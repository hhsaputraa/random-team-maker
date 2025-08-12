import { Member, Team, TeamDistributionResult } from '@/types/team';

export function generateBalancedTeams(members: Member[], teamSize: number = 7): TeamDistributionResult {
  if (members.length === 0) {
    return { teams: [], totalMembers: 0, companies: [] };
  }

  // Get unique companies
  const companies = Array.from(new Set(members.map(m => m.company)));
  
  // Group members by company
  const membersByCompany = companies.reduce((acc, company) => {
    acc[company] = members.filter(m => m.company === company);
    return acc;
  }, {} as Record<string, Member[]>);

  // Calculate number of teams needed - prioritize full teams first
  const fullTeams = Math.floor(members.length / teamSize);
  const remainder = members.length % teamSize;
  const numTeams = fullTeams + (remainder > 0 ? 1 : 0);
  
  // Initialize teams
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    id: i + 1,
    members: [],
    companyDistribution: companies.reduce((acc, company) => {
      acc[company] = 0;
      return acc;
    }, {} as Record<string, number>)
  }));

  // Calculate ideal distribution per team for each company
  const idealDistribution = companies.reduce((acc, company) => {
    const totalForCompany = membersByCompany[company].length;
    acc[company] = Math.floor(totalForCompany / numTeams);
    return acc;
  }, {} as Record<string, number>);

  // First pass: distribute members according to ideal distribution
  for (const company of companies) {
    const companyMembers = [...membersByCompany[company]];
    shuffleArray(companyMembers);
    
    let memberIndex = 0;
    
    // Distribute ideal number to each team
    for (let teamIndex = 0; teamIndex < numTeams && memberIndex < companyMembers.length; teamIndex++) {
      const idealCount = idealDistribution[company];
      
      for (let i = 0; i < idealCount && memberIndex < companyMembers.length; i++) {
        // For full teams, ensure they get exactly teamSize members
        // For remainder team (last team), allow fewer members
        const isRemainderTeam = teamIndex === numTeams - 1 && remainder > 0;
        const maxTeamSize = isRemainderTeam ? remainder : teamSize;
        
        if (teams[teamIndex].members.length < maxTeamSize) {
          teams[teamIndex].members.push(companyMembers[memberIndex]);
          teams[teamIndex].companyDistribution[company]++;
          memberIndex++;
        }
      }
    }

    // Second pass: distribute remaining members to teams with space
    while (memberIndex < companyMembers.length) {
      // Find team with most space and best balance
      const availableTeams = teams
        .map((team, index) => ({ team, index }))
        .filter(({ team, index }) => {
          const isRemainderTeam = index === numTeams - 1 && remainder > 0;
          const maxTeamSize = isRemainderTeam ? remainder : teamSize;
          return team.members.length < maxTeamSize;
        })
        .sort((a, b) => {
          // Prefer teams with fewer members of this company
          const aCount = a.team.companyDistribution[company];
          const bCount = b.team.companyDistribution[company];
          if (aCount !== bCount) return aCount - bCount;

          // Then prefer teams with more available space considering remainder team size
          const isRemainderTeamA = a.index === numTeams - 1 && remainder > 0;
          const maxSizeA = isRemainderTeamA ? remainder : teamSize;
          const isRemainderTeamB = b.index === numTeams - 1 && remainder > 0;
          const maxSizeB = isRemainderTeamB ? remainder : teamSize;
          const aSpace = maxSizeA - a.team.members.length;
          const bSpace = maxSizeB - b.team.members.length;
          return bSpace - aSpace;
        });

      if (availableTeams.length > 0) {
        const targetTeam = availableTeams[0].team;
        targetTeam.members.push(companyMembers[memberIndex]);
        targetTeam.companyDistribution[company]++;
        memberIndex++;
      } else {
        // No more space in any team
        break;
      }
    }
  }

  // Shuffle members within each team for final randomization
  teams.forEach(team => {
    shuffleArray(team.members);
  });

  return {
    teams,
    totalMembers: members.length,
    companies
  };
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}