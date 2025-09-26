import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { QRCode } from "@/components/qr-code";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { type Quiz, type Session, type Participant, type GameSettings } from "@shared/schema";
import { Rocket, Play, Pause, Square, Users, Clock, Target, Zap, Trophy, Settings } from "lucide-react";

// Mock user for now
const mockUser = { id: "user-1", name: "Host" };

type SessionStatus = "setup" | "waiting" | "active" | "paused" | "completed";

export default function HostLive() {
  const { toast } = useToast();
  const [user] = useState(mockUser);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("setup");
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionResponses, setQuestionResponses] = useState<{[key: string]: number}>({});

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    mode: "accuracy",
    timePerQuestion: 30,
    enableStreaks: true,
    enableConfetti: true,
    enableSounds: false,
    showAnswersAfterEach: false
  });

  // WebSocket connection for real-time updates
  const { subscribe, send, isConnected } = useWebSocket({
    onConnect: () => {
      console.log("WebSocket connected for host");
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected for host");
    }
  });

  // Fetch user's quizzes
  const { data: quizzesData, isLoading: quizzesLoading } = useQuery({
    queryKey: ["/api/quizzes", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    }
  });

  const quizzes = quizzesData?.quizzes || [];

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: {
      quizId: string;
      hostId: string;
      settings: GameSettings;
    }) => {
      const response = await apiRequest("POST", "/api/session", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setSessionStatus("waiting");
      
      // Connect to WebSocket as host
      if (isConnected) {
        send({
          type: "host_session",
          data: {
            sessionId: data.session.id,
            userId: user.id
          }
        });
      }

      toast({
        title: "Session Created",
        description: `Session code: ${data.session.sessionCode}`
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Session",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected || !currentSession) return;

    const unsubscribeParticipantJoined = subscribe("participant_joined", (data) => {
      setParticipants(prev => [...prev, data.participant]);
      toast({
        title: "Player Joined",
        description: `${data.participant.nickname} joined the session`
      });
    });

    const unsubscribeParticipantLeft = subscribe("participant_left", (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
    });

    const unsubscribeParticipantAnswered = subscribe("participant_answered", (data) => {
      setQuestionResponses(prev => ({
        ...prev,
        [`${data.questionIndex}-${data.participantId}`]: Date.now()
      }));
    });

    return () => {
      unsubscribeParticipantJoined();
      unsubscribeParticipantLeft();
      unsubscribeParticipantAnswered();
    };
  }, [subscribe, isConnected, currentSession]);

  const handleCreateSession = () => {
    if (!selectedQuizId) {
      toast({
        title: "Select Quiz",
        description: "Please select a quiz to host.",
        variant: "destructive"
      });
      return;
    }

    createSessionMutation.mutate({
      quizId: selectedQuizId,
      hostId: user.id,
      settings: gameSettings
    });
  };

  const handleStartSession = () => {
    if (!currentSession || !isConnected) return;

    send({
      type: "host_start_session",
      data: { sessionId: currentSession.id }
    });

    setSessionStatus("active");
    setCurrentQuestionIndex(0);

    toast({
      title: "Quiz Started",
      description: "The quiz has begun!"
    });
  };

  const handlePauseSession = () => {
    if (!currentSession || !isConnected) return;

    send({
      type: "host_pause_session", 
      data: { sessionId: currentSession.id }
    });

    setSessionStatus("paused");

    toast({
      title: "Quiz Paused",
      description: "The quiz has been paused."
    });
  };

  const handleNextQuestion = () => {
    if (!currentSession || !isConnected) return;

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);

    send({
      type: "host_next_question",
      data: { 
        sessionId: currentSession.id,
        questionIndex: nextIndex
      }
    });
  };

  const handleEndSession = () => {
    if (!currentSession || !isConnected) return;

    send({
      type: "host_end_session",
      data: { sessionId: currentSession.id }
    });

    setSessionStatus("completed");

    toast({
      title: "Quiz Ended",
      description: "The quiz has ended. View results in the Analytics section."
    });
  };

  const selectedQuiz = quizzes.find((q: Quiz) => q.id === selectedQuizId);
  const totalQuestions = selectedQuiz?.questions ? (Array.isArray(selectedQuiz.questions) ? selectedQuiz.questions.length : 0) : 0;
  const currentQuestion = selectedQuiz?.questions && Array.isArray(selectedQuiz.questions) ? selectedQuiz.questions[currentQuestionIndex] : null;

  if (sessionStatus === "setup") {
    return <SetupView 
      quizzes={quizzes}
      quizzesLoading={quizzesLoading}
      selectedQuizId={selectedQuizId}
      setSelectedQuizId={setSelectedQuizId}
      gameSettings={gameSettings}
      setGameSettings={setGameSettings}
      onCreateSession={handleCreateSession}
      isCreating={createSessionMutation.isPending}
    />;
  }

  if (sessionStatus === "waiting") {
    return <WaitingView
      session={currentSession!}
      participants={participants}
      onStartSession={handleStartSession}
      onEndSession={handleEndSession}
    />;
  }

  if (sessionStatus === "active" || sessionStatus === "paused") {
    return <ActiveView
      session={currentSession!}
      participants={participants}
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      questionResponses={questionResponses}
      sessionStatus={sessionStatus}
      onNextQuestion={handleNextQuestion}
      onPauseSession={handlePauseSession}
      onStartSession={handleStartSession}
      onEndSession={handleEndSession}
    />;
  }

  return (
    <div className="container mx-auto px-4 py-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Session Completed</h2>
      <p className="text-muted-foreground mb-6">
        Your quiz session has ended. View the results in the Analytics section.
      </p>
      <Button onClick={() => {
        setSessionStatus("setup");
        setCurrentSession(null);
        setParticipants([]);
        setCurrentQuestionIndex(0);
        setQuestionResponses({});
      }}>
        Create New Session
      </Button>
    </div>
  );
}

interface SetupViewProps {
  quizzes: Quiz[];
  quizzesLoading: boolean;
  selectedQuizId: string;
  setSelectedQuizId: (id: string) => void;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  onCreateSession: () => void;
  isCreating: boolean;
}

function SetupView({
  quizzes,
  quizzesLoading,
  selectedQuizId,
  setSelectedQuizId,
  gameSettings,
  setGameSettings,
  onCreateSession,
  isCreating
}: SetupViewProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight break-words text-wrap">{t("host.title")}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground font-medium break-words text-wrap">{t("host.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Quiz Selection */}
        <Card className="card-elevated rounded-2xl border-0 shadow-lg">
          <CardHeader className="p-8 pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-3 break-words text-wrap">
              <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span className="min-w-0">{t("host.select_quiz")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {quizzesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="h-4 bg-muted rounded skeleton w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded skeleton w-3/4" />
                  </div>
                ))}
              </div>
            ) : quizzes.length > 0 ? (
              <div className="space-y-3">
                {quizzes.map((quiz: Quiz) => (
                  <label
                    key={quiz.id}
                    className={`flex items-center space-x-4 p-5 border-2 rounded-2xl hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer ${
                      selectedQuizId === quiz.id 
                        ? "border-primary bg-gradient-to-r from-primary/5 to-primary/10 shadow-md" 
                        : "border-border bg-gradient-to-r from-background to-card/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedQuiz"
                      value={quiz.id}
                      checked={selectedQuizId === quiz.id}
                      onChange={(e) => setSelectedQuizId(e.target.value)}
                      className="w-5 h-5 text-primary"
                      data-testid={`radio-quiz-${quiz.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg mb-1 break-words text-wrap">{quiz.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium break-words">
                        {Array.isArray(quiz.questions) ? quiz.questions.length : 0} questions • 
                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Settings className="h-12 w-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">No quizzes available. Create a quiz first.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Settings */}
        <Card className="card-elevated rounded-2xl border-0 shadow-lg">
          <CardHeader className="p-8 pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-3 break-words text-wrap">
              <span className="bg-gradient-to-r from-accent to-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span className="min-w-0">{t("host.game_settings")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8 pt-0">
            <div>
              <Label className="text-sm font-medium mb-2 block">{t("host.game_mode")}</Label>
              <Select
                value={gameSettings.mode}
                onValueChange={(value: "speed" | "accuracy" | "team") => 
                  setGameSettings({ ...gameSettings, mode: value })
                }
              >
                <SelectTrigger className="touch-target" data-testid="select-game-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speed">{t("host.speed_mode")}</SelectItem>
                  <SelectItem value="accuracy">{t("host.accuracy_mode")}</SelectItem>
                  <SelectItem value="team">{t("host.team_mode")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">{t("host.time_per_question")}</Label>
              <Select
                value={gameSettings.timePerQuestion.toString()}
                onValueChange={(value) => 
                  setGameSettings({ ...gameSettings, timePerQuestion: parseInt(value) })
                }
              >
                <SelectTrigger className="touch-target" data-testid="select-time-per-question">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="45">45 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="0">No timer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">{t("host.features")}</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="streaks"
                    checked={gameSettings.enableStreaks}
                    onCheckedChange={(checked) => 
                      setGameSettings({ ...gameSettings, enableStreaks: checked as boolean })
                    }
                    data-testid="checkbox-streaks"
                  />
                  <Label htmlFor="streaks" className="text-sm">{t("host.streak_bonuses")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confetti"
                    checked={gameSettings.enableConfetti}
                    onCheckedChange={(checked) => 
                      setGameSettings({ ...gameSettings, enableConfetti: checked as boolean })
                    }
                    data-testid="checkbox-confetti"
                  />
                  <Label htmlFor="confetti" className="text-sm">{t("host.confetti")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sounds"
                    checked={gameSettings.enableSounds}
                    onCheckedChange={(checked) => 
                      setGameSettings({ ...gameSettings, enableSounds: checked as boolean })
                    }
                    data-testid="checkbox-sounds"
                  />
                  <Label htmlFor="sounds" className="text-sm">{t("host.sound_effects")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showAnswers"
                    checked={gameSettings.showAnswersAfterEach}
                    onCheckedChange={(checked) => 
                      setGameSettings({ ...gameSettings, showAnswersAfterEach: checked as boolean })
                    }
                    data-testid="checkbox-show-answers"
                  />
                  <Label htmlFor="showAnswers" className="text-sm">{t("host.show_answers")}</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <Button
          onClick={onCreateSession}
          disabled={!selectedQuizId || isCreating}
          className="btn-primary-lg text-primary-foreground rounded-2xl hover:shadow-2xl transition-all duration-300 touch-target shadow-xl text-xl px-12 py-6"
          data-testid="button-create-session"
        >
          {isCreating ? (
            <>
              <Settings className="h-6 w-6 mr-3 animate-spin" />
              Creating Session...
            </>
          ) : (
            <>
              <Rocket className="h-6 w-6 mr-3" />
              {t("host.create_session")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface WaitingViewProps {
  session: Session;
  participants: Participant[];
  onStartSession: () => void;
  onEndSession: () => void;
}

function WaitingView({ session, participants, onStartSession, onEndSession }: WaitingViewProps) {
  const joinUrl = `${window.location.origin}/join/${session.sessionCode}`;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Session Info & QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>{t("host.session_details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="mb-4">
                <QRCode value={joinUrl} size={150} />
              </div>
              <div className="gradient-primary p-4 rounded-lg text-primary-foreground mb-4">
                <p className="text-sm font-medium">{t("host.join_code")}</p>
                <p className="text-3xl font-bold" data-testid="session-code">
                  {session.sessionCode}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Players can scan QR or visit {window.location.host}/join
              </p>
            </div>

            {/* Session Controls */}
            <div className="space-y-3">
              <Button
                onClick={onStartSession}
                className="w-full py-3 bg-success text-white hover:bg-success/90 transition-colors touch-target"
                data-testid="button-start-session"
              >
                <Play className="h-4 w-4 mr-2" />
                {t("host.start_quiz")}
              </Button>
              <Button
                onClick={onEndSession}
                variant="outline"
                className="w-full py-3 border-destructive text-destructive hover:bg-destructive/10 transition-colors touch-target"
                data-testid="button-end-session"
              >
                <Square className="h-4 w-4 mr-2" />
                {t("host.end_session")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("host.participants")}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium" data-testid="participant-count">
                  {participants.length} joined
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Waiting for players to join...</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {participant.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{participant.nickname}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-xs text-muted-foreground">Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ActiveViewProps {
  session: Session;
  participants: Participant[];
  currentQuestion: any;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionResponses: {[key: string]: number};
  sessionStatus: SessionStatus;
  onNextQuestion: () => void;
  onPauseSession: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
}

function ActiveView({
  session,
  participants,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  questionResponses,
  sessionStatus,
  onNextQuestion,
  onPauseSession,
  onStartSession,
  onEndSession
}: ActiveViewProps) {
  const responseCount = Object.keys(questionResponses)
    .filter(key => key.startsWith(`${currentQuestionIndex}-`))
    .length;

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-muted-foreground mb-6">
          All questions have been answered.
        </p>
        <Button onClick={onEndSession} className="gradient-primary">
          View Results
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Question Progress */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center space-x-4 bg-card px-6 py-3 rounded-lg border border-border">
          <span className="text-sm text-muted-foreground">Question</span>
          <span className="text-lg font-bold text-primary" data-testid="current-question">
            {currentQuestionIndex + 1}
          </span>
          <span className="text-sm text-muted-foreground">of</span>
          <span className="text-lg font-bold" data-testid="total-questions">
            {totalQuestions}
          </span>
        </div>
      </div>

      {/* Current Question */}
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 break-words text-wrap" data-testid="question-text">
            {currentQuestion.question}
          </h2>

          {/* Answer Options for MCQ */}
          {currentQuestion.type === "mcq" && currentQuestion.options && (
            <div className="grid md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className="p-4 border-2 border-border rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-medium">{option}</span>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Responses: {/* TODO: Track option-specific responses */}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* True/False Options */}
          {currentQuestion.type === "true_false" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-border rounded-lg bg-secondary/20">
                <span className="font-medium">True</span>
              </div>
              <div className="p-4 border-2 border-border rounded-lg bg-secondary/20">
                <span className="font-medium">False</span>
              </div>
            </div>
          )}

          {/* Response Stats */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{responseCount} of {participants.length} responded</span>
            </div>
            {sessionStatus === "paused" && (
              <Badge variant="outline" className="text-warning">
                Paused
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Host Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onNextQuestion}
          disabled={currentQuestionIndex >= totalQuestions - 1}
          className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-target"
          data-testid="button-next-question"
        >
          <Target className="h-4 w-4 mr-2" />
          Next Question
        </Button>
        
        {sessionStatus === "active" ? (
          <Button
            onClick={onPauseSession}
            variant="outline"
            className="px-6 py-3 border-border hover:bg-secondary transition-colors touch-target"
            data-testid="button-pause"
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        ) : (
          <Button
            onClick={onStartSession}
            variant="outline"
            className="px-6 py-3 border-border hover:bg-secondary transition-colors touch-target"
            data-testid="button-resume"
          >
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        )}
        
        <Button
          onClick={onEndSession}
          variant="outline"
          className="px-6 py-3 border-destructive text-destructive hover:bg-destructive/10 transition-colors touch-target"
          data-testid="button-end-quiz"
        >
          <Square className="h-4 w-4 mr-2" />
          End Quiz
        </Button>
      </div>
    </div>
  );
}
