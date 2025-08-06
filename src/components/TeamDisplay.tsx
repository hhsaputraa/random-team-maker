import { Team } from '@/types/team';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building } from 'lucide-react';

interface TeamDisplayProps {
  teams: Team[];
  companies: string[];
}

export function TeamDisplay({ teams, companies }: TeamDisplayProps) {
  const getTeamColor = (teamId: number) => {
    const colors = [
      'bg-team-1', 'bg-team-2', 'bg-team-3', 'bg-team-4', 'bg-team-5',
      'bg-team-6', 'bg-team-7', 'bg-team-8', 'bg-team-9', 'bg-team-10'
    ];
    return colors[(teamId - 1) % colors.length];
  };

  const getCompanyColors = () => {
    const colors = [
      'bg-accent', 'bg-success', 'bg-primary', 'bg-destructive',
      'bg-team-3', 'bg-team-5', 'bg-team-7', 'bg-team-9'
    ];
    return colors;
  };

  const companyColors = getCompanyColors();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">Hasil Pembagian Tim</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">Total: {teams.reduce((acc, team) => acc + team.members.length, 0)} orang</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Building className="h-5 w-5 text-accent" />
            <span className="font-medium">{teams.length} tim</span>
          </div>
        </div>
        
        {companies.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Perusahaan:</span>
            {companies.map((company, index) => (
              <Badge 
                key={company} 
                className={`${companyColors[index % companyColors.length]} text-white`}
              >
                {company}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="p-6 bg-card shadow-[var(--shadow-team)] border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${getTeamColor(team.id)}`} />
                <h3 className="text-xl font-bold text-foreground">Tim {team.id}</h3>
              </div>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {team.members.length} orang
              </Badge>
            </div>

            {/* Company Distribution */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">Distribusi Perusahaan:</p>
              <div className="space-y-1">
                {companies.map((company, index) => {
                  const count = team.companyDistribution[company] || 0;
                  return (
                    <div key={company} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${companyColors[index % companyColors.length]}`} />
                        <span className="text-sm text-foreground">{company}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground mb-2">Anggota Tim:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {team.members.map((member, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center py-1 px-2 rounded bg-background/50 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{member.name}</span>
                    <span className="text-xs text-muted-foreground">{member.company}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}