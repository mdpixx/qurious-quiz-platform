import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { type Session, type Response } from "@shared/schema";
import { 
  BarChart3, 
  Download, 
  Users, 
  Target, 
  Clock, 
  Trophy, 
  TrendingUp,
  ChevronRight,
  FileText,
  Activity
} from "lucide-react";

// Mock user for now
const mockUser = { id: "user-1", name: "Host" };

interface SessionAnalytics {
  sessionInfo: {
    id: string;
    sessionCode: string;
    status: string;
    startedAt?: Date;
    completedAt?: Date;
  };
  participantStats: {
    totalParticipants: number;
    averageScore: number;
    topPerformers: Array<{
      id: string;
      nickname: string;
      score: number;
      streak: number;
    }>;
  };
  questionStats: Array<{
    questionIndex: number;
    question: string;
    totalResponses: number;
    correctResponses: number;
    accuracy: number;
    averageTime: number;
  }>;
  responseData: Response[];
}

export default function Results() {
  const { toast } = useToast();
  const [user] = useState(mockUser);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Fetch user's sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions/active", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/active/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    }
  });

  const sessions = sessionsData?.sessions || [];

  // Fetch analytics for selected session
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/session", selectedSessionId, "analytics"],
    queryFn: async () => {
      const response = await fetch(`/api/session/${selectedSessionId}/analytics`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!selectedSessionId
  });

  const analytics: SessionAnalytics | null = analyticsData?.analytics || null;

  // Auto-select first session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const handleExportCSV = async (sessionId: string, sessionCode: string) => {
    try {
      const response = await fetch(`/api/session/${sessionId}/export/csv`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-session-${sessionCode}-responses.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "CSV file has been downloaded."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export session data.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight break-words text-wrap">{t("results.title")}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground font-medium break-words text-wrap">{t("results.subtitle")}</p>
      </div>

      {sessionsLoading ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-secondary/30 rounded-lg">
                      <div className="h-4 bg-muted rounded skeleton w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded skeleton w-1/2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded skeleton w-1/2 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-3 bg-muted rounded skeleton w-1/3" />
                      <div className="h-3 bg-muted rounded skeleton w-1/4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <BarChart3 className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">No Sessions Yet</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Create and host your first quiz session to see analytics here.
          </p>
          <Button 
            onClick={() => window.location.href = "/host-live"}
            className="btn-primary-lg text-primary-foreground rounded-2xl shadow-xl"
          >
            Host Your First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 mb-12">
          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <Card className="card-elevated rounded-2xl border-0 shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 pb-6 gap-4">
                <CardTitle className="text-xl sm:text-2xl font-bold break-words text-wrap">Recent Sessions</CardTitle>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger className="w-full sm:w-48 rounded-xl border-2 focus:border-primary">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session: Session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.sessionCode} - {session.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {sessions.slice(0, 5).map((session: Session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onExport={() => handleExportCSV(session.id, session.sessionCode)}
                      isSelected={session.id === selectedSessionId}
                      onClick={() => setSelectedSessionId(session.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="card-elevated rounded-2xl border-0 shadow-lg">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-xl">
                    <Activity className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                    <span className="text-base font-medium">Total Sessions</span>
                    <span className="text-xl font-bold text-primary" data-testid="total-sessions">
                      {sessions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/5 to-accent/10 rounded-xl">
                    <span className="text-base font-medium">Total Players</span>
                    <span className="text-xl font-bold text-accent" data-testid="total-players">
                      {sessions.reduce((sum: number, s: Session) => {
                        const participants = Array.isArray(s.participants) ? s.participants : [];
                        return sum + participants.length;
                      }, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success/5 to-success/10 rounded-xl">
                    <span className="text-base font-medium">Completed Sessions</span>
                    <span className="text-xl font-bold text-success" data-testid="completion-rate">
                      {sessions.filter((s: Session) => s.status === "completed").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-warning/5 to-warning/10 rounded-xl">
                    <span className="text-base font-medium">Active Sessions</span>
                    <span className="text-xl font-bold text-warning" data-testid="active-sessions">
                      {sessions.filter((s: Session) => s.status === "active" || s.status === "waiting").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analytics?.participantStats && (
              <Card className="card-elevated rounded-2xl border-0 shadow-lg">
                <CardHeader className="p-8 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="bg-gradient-to-r from-warning to-yellow-400 p-2 rounded-xl">
                      <Trophy className="h-5 w-5 text-warning-foreground" />
                    </div>
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  {analytics.participantStats.topPerformers.length === 0 ? (
                    <p className="text-muted-foreground text-lg text-center py-6">No participants yet</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.participantStats.topPerformers.slice(0, 3).map((participant, index) => (
                        <div key={participant.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-background to-card/50 rounded-xl border border-border/50">
                          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-md">
                            <span className="text-sm font-bold text-primary-foreground">
                              {participant.nickname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-base">{participant.nickname}</p>
                            <p className="text-sm text-muted-foreground font-medium">
                              {participant.score.toLocaleString()} pts
                            </p>
                          </div>
                          {index === 0 && <Trophy className="h-5 w-5 text-warning" />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Detailed Analytics */}
      {analytics && (
        <Card className="card-elevated rounded-2xl border-0 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 pb-6 gap-4">
            <CardTitle className="text-xl sm:text-2xl font-bold break-words text-wrap">Question Performance</CardTitle>
            <Button
              onClick={() => handleExportCSV(analytics.sessionInfo.id, analytics.sessionInfo.sessionCode)}
              className="btn-secondary rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              data-testid="button-export-csv"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {analyticsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="h-4 bg-muted rounded skeleton w-3/4 mb-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="bg-secondary/20 p-2 rounded">
                          <div className="h-3 bg-muted rounded skeleton w-1/2 mb-1" />
                          <div className="h-2 bg-muted rounded skeleton w-1/3" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : analytics.questionStats.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">No question data available for this session.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {analytics.questionStats.map((questionStat, index) => (
                  <QuestionAnalytics key={index} questionStat={questionStat} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  onExport: () => void;
  isSelected: boolean;
  onClick: () => void;
}

function SessionCard({ session, onExport, isSelected, onClick }: SessionCardProps) {
  const participants = Array.isArray(session.participants) ? session.participants : [];
  const averageScore = participants.length > 0 
    ? Math.round(participants.reduce((sum, p) => sum + p.score, 0) / participants.length)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success";
      case "active": return "bg-primary/20 text-primary";
      case "paused": return "bg-warning/20 text-warning";
      case "waiting": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Not started";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleString();
  };

  return (
    <div
      onClick={onClick}
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg gap-4 ${
        isSelected 
          ? "bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary" 
          : "bg-gradient-to-r from-background to-card/50 hover:bg-card/80 border-2 border-border/50 hover:border-primary/30"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
          <h4 className="font-bold text-lg break-words text-wrap" data-testid={`session-code-${session.id}`}>
            Code: {session.sessionCode}
          </h4>
          <Badge className={`${getStatusColor(session.status)} px-3 py-1 rounded-xl font-semibold`}>
            {session.status}
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground font-medium break-words">
          <span data-testid={`session-date-${session.id}`}>
            {formatDate(session.startedAt || session.createdAt)}
          </span> • 
          <span className="ml-1" data-testid={`session-participants-${session.id}`}>
            {participants.length} players
          </span> • 
          <span className="ml-1" data-testid={`session-avg-score-${session.id}`}>
            {averageScore}% avg score
          </span>
        </p>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        {session.status === "completed" && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            variant="outline"
            className="rounded-xl border-2 hover:bg-accent/5 hover:border-primary/50 transition-all duration-300 touch-target p-3"
            data-testid={`button-export-${session.id}`}
          >
            <Download className="h-5 w-5" />
          </Button>
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

interface QuestionAnalyticsProps {
  questionStat: {
    questionIndex: number;
    question: string;
    totalResponses: number;
    correctResponses: number;
    accuracy: number;
    averageTime: number;
  };
}

function QuestionAnalytics({ questionStat }: QuestionAnalyticsProps) {
  const getDifficultyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-success";
    if (accuracy >= 60) return "text-warning";
    return "text-destructive";
  };

  const getDifficultyLabel = (accuracy: number) => {
    if (accuracy >= 80) return "Easy";
    if (accuracy >= 60) return "Medium";
    return "Hard";
  };

  return (
    <div className="border-2 border-border/50 rounded-2xl p-6 bg-gradient-to-r from-background to-card/30 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base sm:text-lg mb-2 leading-relaxed break-words text-wrap" data-testid={`question-${questionStat.questionIndex}`}>
            Q{questionStat.questionIndex + 1}: {questionStat.question}
          </h4>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline" className={`${getDifficultyColor(questionStat.accuracy)} px-3 py-1 rounded-xl font-semibold border-2`}>
              {getDifficultyLabel(questionStat.accuracy)}
            </Badge>
            <span className="font-medium">Avg. time: {Math.round(questionStat.averageTime / 1000)}s</span>
          </div>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-primary mb-1" data-testid={`accuracy-${questionStat.questionIndex}`}>
            {Math.round(questionStat.accuracy)}%
          </p>
          <p className="text-sm text-muted-foreground font-medium">accuracy</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm sm:text-base text-muted-foreground gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">{questionStat.totalResponses} responses</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">{questionStat.correctResponses} correct</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">{Math.round(questionStat.averageTime / 1000)}s avg</span>
        </div>
      </div>
    </div>
  );
}
