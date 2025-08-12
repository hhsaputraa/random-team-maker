import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from './FileUpload';
import { TeamDisplay } from './TeamDisplay';
import { InteractiveTeamDisplay } from './InteractiveTeamDisplay';
import { parseFile } from '@/utils/fileParser';
import { generateBalancedTeams } from '@/utils/teamGenerator';
import { Member, TeamDistributionResult, Team } from '@/types/team';
import { useToast } from '@/hooks/use-toast';
import { Shuffle, Users, Sparkles, Edit3, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TEAM_SIZE = 7;

export function TeamMaker() {
  const [members, setMembers] = useState<Member[]>([]);
  const [teamResult, setTeamResult] = useState<TeamDistributionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsedMembers = await parseFile(file);
      setMembers(parsedMembers);
      
      toast({
        title: "File berhasil dimuat!",
        description: `${parsedMembers.length} data anggota telah siap untuk dibentuk tim.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error saat memproses file",
        description: error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateTeams = () => {
    if (members.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Silakan upload file terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }

    const result = generateBalancedTeams(members, TEAM_SIZE);
    setTeamResult(result);
    
    toast({
      title: "Tim berhasil dibentuk!",
      description: `${result.teams.length} tim telah terbentuk dengan distribusi yang seimbang.`,
      variant: "default"
    });
  };

  const handleShuffleTeams = () => {
    if (members.length === 0) return;
    
    const result = generateBalancedTeams(members, TEAM_SIZE);
    setTeamResult(result);
    setIsInteractive(false);
    
    toast({
      title: "Tim telah diacak ulang!",
      description: "Tim baru telah terbentuk dengan distribusi yang seimbang.",
      variant: "default"
    });
  };

  const handleTeamsUpdate = (updatedTeams: Team[]) => {
    if (teamResult) {
      setTeamResult({
        ...teamResult,
        teams: updatedTeams
      });
    }
  };

  const toggleInteractiveMode = () => {
    setIsInteractive(!isInteractive);
    toast({
      title: isInteractive ? "Mode Normal" : "Mode Interaktif",
      description: isInteractive 
        ? "Kembali ke tampilan tim normal" 
        : "Sekarang Anda dapat drag & drop anggota antar tim",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Random Team Maker</h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Buat tim secara acak dengan distribusi perusahaan yang seimbang dari file CSV atau Excel Anda
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
        </div>

        {/* Data Summary */}
        {members.length > 0 && (
          <Card className="p-6 mb-8 bg-card border-border shadow-[var(--shadow-card)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">
                    {members.length} anggota siap
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">
                    {Array.from(new Set(members.map(m => m.company))).length} perusahaan
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleGenerateTeams}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Buat Tim
                </Button>
                
                {teamResult && (
                  <>
                    <Button 
                      onClick={handleShuffleTeams}
                      variant="outline"
                      disabled={isProcessing}
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Acak Ulang
                    </Button>
                    <Button 
                      onClick={toggleInteractiveMode}
                      variant="outline"
                      disabled={isProcessing}
                      className={isInteractive 
                        ? "border-accent text-accent hover:bg-accent hover:text-white" 
                        : "border-success text-success hover:bg-success hover:text-white"
                      }
                    >
                      {isInteractive ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                      {isInteractive ? "Lihat Normal" : "Edit Tim"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Team Results */}
        {teamResult && (
          isInteractive ? (
            <InteractiveTeamDisplay 
              teams={teamResult.teams} 
              companies={teamResult.companies}
              onTeamsUpdate={handleTeamsUpdate}
            />
          ) : (
            <TeamDisplay teams={teamResult.teams} companies={teamResult.companies} />
          )
        )}

        {/* Instructions */}
        {members.length === 0 && (
          <Card className="p-8 bg-muted/30 border-border">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">Cara Menggunakan</h3>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Upload File</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload file CSV atau Excel dengan kolom "nama" dan "perusahaan"
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-accent">2</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Buat Tim</h4>
                  <p className="text-sm text-muted-foreground">
                    Klik tombol "Buat Tim" untuk membagi data menjadi tim berisi 7 orang
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-success">3</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Lihat Hasil</h4>
                  <p className="text-sm text-muted-foreground">
                    Tim akan terbentuk dengan distribusi perusahaan yang seimbang
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}