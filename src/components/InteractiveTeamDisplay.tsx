import { useState } from 'react';
import { Team, Member } from '@/types/team';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { exportToExcel, exportToCSV, exportToPDF } from '@/utils/exportTeams';
import { Users, Building, Download, FileSpreadsheet, FileText, File, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';

interface InteractiveTeamDisplayProps {
  teams: Team[];
  companies: string[];
  onTeamsUpdate: (teams: Team[]) => void;
}

interface DraggableMemberProps {
  member: Member;
  memberIndex: number;
  teamId: number;
}

interface MemberPool {
  id: string;
  member: Member;
  sourceTeam: number;
}

function DraggableMember({ member, memberIndex, teamId }: DraggableMemberProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${teamId}-${memberIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex justify-between items-center py-2 px-3 rounded bg-background/50 hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className="text-sm font-medium text-foreground">{member.name}</span>
      <span className="text-xs text-muted-foreground">{member.company}</span>
    </div>
  );
}

function DroppableTeamCard({ team, companies, onMemberDrop, onRemoveTeam }: {
  team: Team;
  companies: string[];
  onMemberDrop: (teamId: number) => void;
  onRemoveTeam: (teamId: number) => void;
}) {
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
    <Card 
      className="p-6 bg-card shadow-[var(--shadow-team)] border-border hover:shadow-lg transition-shadow min-h-[400px] relative"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-primary');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('border-primary');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
        onMemberDrop(team.id);
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${getTeamColor(team.id)}`} />
          <h3 className="text-xl font-bold text-foreground">Tim {team.id}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            {team.members.length} orang
          </Badge>
          {team.members.length === 0 && (
            <Button
              onClick={() => onRemoveTeam(team.id)}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
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
          <SortableContext 
            items={team.members.map((_, index) => `${team.id}-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            {team.members.map((member, index) => (
              <DraggableMember
                key={`${team.id}-${index}`}
                member={member}
                memberIndex={index}
                teamId={team.id}
              />
            ))}
          </SortableContext>
        </div>
      </div>

      {team.members.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/30">
          <p className="text-muted-foreground text-sm">Drop anggota disini</p>
        </div>
      )}
    </Card>
  );
}

export function InteractiveTeamDisplay({ teams: initialTeams, companies, onTeamsUpdate }: InteractiveTeamDisplayProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [draggedMember, setDraggedMember] = useState<{ member: Member; teamId: number; index: number } | null>(null);
  const [memberPool, setMemberPool] = useState<MemberPool[]>([]);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateTeams = (newTeams: Team[]) => {
    // Recalculate company distribution for each team
    const updatedTeams = newTeams.map(team => ({
      ...team,
      companyDistribution: team.members.reduce((acc, member) => {
        acc[member.company] = (acc[member.company] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }));
    
    setTeams(updatedTeams);
    onTeamsUpdate(updatedTeams);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const [teamId, memberIndex] = event.active.id.toString().split('-').map(Number);
    const team = teams.find(t => t.id === teamId);
    if (team && team.members[memberIndex]) {
      setDraggedMember({
        member: team.members[memberIndex],
        teamId,
        index: memberIndex
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedMember(null);

    if (!over || !draggedMember) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Check if dropping to storage
    if (overId === 'storage') {
      handleDropToStorage();
      return;
    }

    const [sourceTeamId, sourceMemberIndex] = activeId.split('-').map(Number);
    const targetTeamId = parseInt(overId.split('-')[0]);

    if (sourceTeamId === targetTeamId) return;

    // Move member from source team to target team
    const newTeams = teams.map(team => {
      if (team.id === sourceTeamId) {
        // Remove member from source team
        return {
          ...team,
          members: team.members.filter((_, index) => index !== sourceMemberIndex)
        };
      } else if (team.id === targetTeamId) {
        // Add member to target team
        return {
          ...team,
          members: [...team.members, draggedMember.member]
        };
      }
      return team;
    });

    updateTeams(newTeams);
    
    toast({
      title: "Anggota dipindahkan",
      description: `${draggedMember.member.name} dipindahkan dari Tim ${sourceTeamId} ke Tim ${targetTeamId}`,
    });
  };

  const handleMemberDrop = (targetTeamId: number) => {
    if (!draggedMember) return;

    const sourceTeamId = draggedMember.teamId;
    if (sourceTeamId === targetTeamId) return;

    // If dragging from storage
    if (sourceTeamId === -1) {
      const newPool = memberPool.filter((_, index) => index !== draggedMember.index);
      setMemberPool(newPool);
      
      const newTeams = teams.map(team => {
        if (team.id === targetTeamId) {
          return {
            ...team,
            members: [...team.members, draggedMember.member]
          };
        }
        return team;
      });
      
      updateTeams(newTeams);
      return;
    }

    const newTeams = teams.map(team => {
      if (team.id === sourceTeamId) {
        return {
          ...team,
          members: team.members.filter((_, index) => index !== draggedMember.index)
        };
      } else if (team.id === targetTeamId) {
        return {
          ...team,
          members: [...team.members, draggedMember.member]
        };
      }
      return team;
    });

    updateTeams(newTeams);
  };

  const handleDropToStorage = () => {
    if (!draggedMember || draggedMember.teamId === -1) return;

    const newPoolMember: MemberPool = {
      id: `storage-${Date.now()}`,
      member: draggedMember.member,
      sourceTeam: draggedMember.teamId
    };

    setMemberPool([...memberPool, newPoolMember]);

    const newTeams = teams.map(team => {
      if (team.id === draggedMember.teamId) {
        return {
          ...team,
          members: team.members.filter((_, index) => index !== draggedMember.index)
        };
      }
      return team;
    });

    updateTeams(newTeams);
    
    toast({
      title: "Anggota disimpan",
      description: `${draggedMember.member.name} disimpan di area sementara`,
    });
  };


  const removeTeam = (teamId: number) => {
    const teamToRemove = teams.find(t => t.id === teamId);
    if (!teamToRemove || teamToRemove.members.length > 0) return;

    const newTeams = teams.filter(t => t.id !== teamId);
    updateTeams(newTeams);
    
    toast({
      title: "Tim dihapus",
      description: `Tim ${teamId} telah dihapus`,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Tim Interaktif</h2>
          <p className="text-muted-foreground mb-6">Drag anggota untuk memindahkan antar tim</p>
          
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
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground mr-2">Perusahaan:</span>
              {companies.map((company, index) => {
                const colors = ['bg-accent', 'bg-success', 'bg-primary', 'bg-destructive'];
                return (
                  <Badge 
                    key={company} 
                    className={`${colors[index % colors.length]} text-white`}
                  >
                    {company}
                  </Badge>
                );
              })}
            </div>
          )}
          
          {/* Export Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              onClick={() => exportToExcel(teams)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              onClick={() => exportToPDF(teams)}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              onClick={() => exportToCSV(teams)}
              variant="outline"
              className="border-accent text-accent hover:bg-accent hover:text-white"
            >
              <File className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Temporary Storage Area */}
        <StorageArea 
          memberPool={memberPool} 
          setDraggedMember={setDraggedMember} 
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <DroppableTeamCard
              key={team.id}
              team={team}
              companies={companies}
              onMemberDrop={handleMemberDrop}
              onRemoveTeam={removeTeam}
            />
          ))}
        </div>

        <DragOverlay>
          {draggedMember ? (
            <div className="flex justify-between items-center py-2 px-3 rounded bg-background/90 border shadow-lg">
              <span className="text-sm font-medium text-foreground">{draggedMember.member.name}</span>
              <span className="text-xs text-muted-foreground">{draggedMember.member.company}</span>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

function StorageArea({ memberPool, setDraggedMember }: {
  memberPool: MemberPool[];
  setDraggedMember: (member: { member: Member; teamId: number; index: number } | null) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'storage',
  });

  return (
    <div className="sticky top-4 z-10 mb-6">
      <Card 
        ref={setNodeRef}
        className={`p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 shadow-lg backdrop-blur-sm transition-colors ${
          isOver ? 'border-primary bg-primary/20' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            Penyimpanan Sementara
          </h3>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {memberPool.length} anggota
          </Badge>
        </div>
        
        {memberPool.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Drop anggota disini untuk menyimpan sementara</p>
            <p className="text-xs">Berguna untuk memindahkan anggota ke tim yang jauh</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {memberPool.map((poolMember) => (
              <div
                key={poolMember.id}
                draggable
                onDragStart={(e) => {
                  setDraggedMember({
                    member: poolMember.member,
                    teamId: -1, // -1 indicates from storage
                    index: memberPool.findIndex(m => m.id === poolMember.id)
                  });
                }}
                className="flex justify-between items-center py-2 px-3 rounded bg-background/80 border cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{poolMember.member.name}</span>
                <span className="text-xs text-muted-foreground">{poolMember.member.company}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}