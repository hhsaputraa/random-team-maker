export interface Member {
  name: string;
  company: string;
}

export interface Team {
  id: number;
  members: Member[];
  companyDistribution: Record<string, number>;
}

export interface TeamDistributionResult {
  teams: Team[];
  totalMembers: number;
  companies: string[];
}