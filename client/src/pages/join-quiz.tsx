import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Confetti } from "@/components/confetti";
import { t } from "@/lib/i18n";
import { type Session, type Quiz, type Participant } from "@shared/schema";
import { 
  Brain, 
  Camera, 
  LogIn, 
  Users, 
  Clock, 
  Target, 
  Trophy, 
  Flame,
  Check,
  X,
  Star
} from "lucide-react";

type JoinStatus = "entering" | "joining" | "lobby" | "playing" | "finished";

export default function JoinQuiz() {
  const params = useParams();
  const { toast } = useToast();
  
  const [joinStatus, setJoinStatus] = useState<JoinStatus>("entering");
  const [sessionCode, setSessionCode] = useState(params.code || "");
  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participantId, setParticipantId] = useState<string>("");
  const [otherParticipants, setOtherParticipants] = useState<Participant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // WebSocket connection
  const { subscribe, send, isConnected } = useWebSocket({
    onConnect: () => {
      console.log("WebSocket connected for participant");
    }
  });

  // Auto-fill code from URL params
  useEffect(() => {
    if (params.code) {
      setSessionCode(params.code.toUpperCase());
    }
  }, [params.code]);

  // Join session mutation
  const joinMutation = useMutation({
    mutationFn: async (data: { sessionCode: string; nickname: string }) => {
      const response = await fetch(`/api/session/code/${data.sessionCode}`);
      if (!response.ok) {
        throw new Error("Session not found");
      }
      const sessionData = await response.json();
      
      // Get quiz details
      const quizResponse = await fetch(`/api/quiz/${sessionData.session.quizId}`);
      if (!quizResponse.ok) {
        throw new Error("Failed to load quiz");
      }
      const quizData = await quizResponse.json();
      
      return { session: sessionData.session, quiz: quizData.quiz };
    },
    onSuccess: (data) => {
      setSession(data.session);
      setQuiz(data.quiz);
      setJoinStatus("joining");

      // Connect to WebSocket
      if (isConnected) {
        send({
          type: "join_session",
          data: {
            sessionCode: sessionCode.toUpperCase(),
            nickname: nickname
          }
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Join",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeJoinSuccess = subscribe("join_success", (data) => {
      setParticipantId(data.participantId);
      setJoinStatus("lobby");
      toast({
        title: "Joined Successfully!",
        description: "Waiting for the quiz to start..."
      });
    });

    const unsubscribeParticipantJoined = subscribe("participant_joined", (data) => {
      if (data.participant.id !== participantId) {
        setOtherParticipants(prev => [...prev, data.participant]);
      }
    });

    const unsubscribeParticipantLeft = subscribe("participant_left", (data) => {
      setOtherParticipants(prev => prev.filter(p => p.id !== data.participantId));
    });

    const unsubscribeSessionStarted = subscribe("session_started", () => {
      setJoinStatus("playing");
      setGameStarted(true);
      setCurrentQuestionIndex(0);
      toast({
        title: "Quiz Started!",
        description: "Get ready for the first question!"
      });
    });

    const unsubscribeNextQuestion = subscribe("next_question", (data) => {
      setCurrentQuestionIndex(data.questionIndex);
      setSelectedAnswer("");
      setTimeRemaining(30); // Reset timer
    });

    const unsubscribeAnswerReceived = subscribe("answer_received", (data) => {
      setScore(prev => prev + data.points);
      setStreak(data.streak);
      
      if (data.isCorrect) {
        setShowConfetti(true);
        toast({
          title: "Correct! 🎉",
          description: `+${data.points} points${data.streak > 1 ? ` (${data.streak} streak!)` : ""}`
        });
      } else {
        toast({
          title: "Incorrect",
          description: "Better luck next time!",
          variant: "destructive"
        });
      }
    });

    const unsubscribeSessionEnded = subscribe("session_ended", () => {
      setJoinStatus("finished");
      toast({
        title: "Quiz Finished!",
        description: "Thanks for playing!"
      });
    });

    return () => {
      unsubscribeJoinSuccess();
      unsubscribeParticipantJoined();
      unsubscribeParticipantLeft();
      unsubscribeSessionStarted();
      unsubscribeNextQuestion();
      unsubscribeAnswerReceived();
      unsubscribeSessionEnded();
    };
  }, [subscribe, isConnected, participantId]);

  // Timer countdown
  useEffect(() => {
    if (joinStatus !== "playing" || selectedAnswer || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [joinStatus, selectedAnswer, timeRemaining]);

  const handleJoinQuiz = () => {
    if (!sessionCode.trim() || !nickname.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both quiz code and your nickname.",
        variant: "destructive"
      });
      return;
    }

    joinMutation.mutate({
      sessionCode: sessionCode.toUpperCase(),
      nickname: nickname.trim()
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || !isConnected) return;

    setSelectedAnswer(answer);
    
    const responseTime = (30 - timeRemaining) * 1000; // Convert to milliseconds

    send({
      type: "participant_answer",
      data: {
        questionIndex: currentQuestionIndex,
        answer: answer,
        responseTime: responseTime
      }
    });
  };

  if (joinStatus === "entering") {
    return <EnterView
      sessionCode={sessionCode}
      setSessionCode={setSessionCode}
      nickname={nickname}
      setNickname={setNickname}
      onJoin={handleJoinQuiz}
      isJoining={joinMutation.isPending}
    />;
  }

  if (joinStatus === "joining") {
    return <div className="container mx-auto px-4 py-6 text-center max-w-md">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-lg">Joining quiz...</p>
    </div>;
  }

  if (joinStatus === "lobby") {
    return <LobbyView
      quiz={quiz!}
      otherParticipants={otherParticipants}
    />;
  }

  if (joinStatus === "playing") {
    const currentQuestion = quiz?.questions && Array.isArray(quiz.questions) 
      ? quiz.questions[currentQuestionIndex] 
      : null;
    const totalQuestions = quiz?.questions && Array.isArray(quiz.questions) 
      ? quiz.questions.length 
      : 0;

    return <PlayingView
      question={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      selectedAnswer={selectedAnswer}
      onAnswerSelect={handleAnswerSelect}
      score={score}
      streak={streak}
      timeRemaining={timeRemaining}
      showConfetti={showConfetti}
      onConfettiComplete={() => setShowConfetti(false)}
    />;
  }

  if (joinStatus === "finished") {
    return <FinishedView score={score} streak={streak} />;
  }

  return null;
}

interface EnterViewProps {
  sessionCode: string;
  setSessionCode: (code: string) => void;
  nickname: string;
  setNickname: (name: string) => void;
  onJoin: () => void;
  isJoining: boolean;
}

function EnterView({ sessionCode, setSessionCode, nickname, setNickname, onJoin, isJoining }: EnterViewProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center shadow-xl">
          <Brain className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight break-words text-wrap">{t("join.title")}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground font-medium break-words text-wrap">{t("join.subtitle")}</p>
      </div>

      <div className="space-y-6 mb-10">
        <Input
          type="text"
          placeholder={t("join.enter_code")}
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
          className="text-center text-lg sm:text-xl lg:text-2xl font-mono tracking-wider touch-target rounded-2xl border-2 focus:border-primary p-4 sm:p-6 shadow-md break-words"
          maxLength={6}
          data-testid="input-session-code"
        />
        
        <Input
          type="text"
          placeholder={t("join.nickname")}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="text-center text-lg sm:text-xl touch-target rounded-2xl border-2 focus:border-primary p-4 sm:p-6 shadow-md break-words"
          data-testid="input-nickname"
        />

        <Button
          onClick={onJoin}
          disabled={isJoining || !sessionCode.trim() || !nickname.trim()}
          className="btn-primary-lg w-full text-primary-foreground rounded-2xl hover:shadow-2xl transition-all duration-300 touch-target shadow-xl text-xl py-6"
          data-testid="button-join"
        >
          {isJoining ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-3" />
              Joining...
            </>
          ) : (
            <>
              <LogIn className="h-6 w-6 mr-3" />
              {t("join.join_button")}
            </>
          )}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-base text-muted-foreground mb-6 font-medium">or</p>
        <Button
          variant="outline"
          className="px-8 py-4 border-2 border-border rounded-2xl hover:bg-accent/5 hover:border-primary/50 transition-all duration-300 touch-target shadow-md"
          data-testid="button-scan-qr"
        >
          <Camera className="h-5 w-5 mr-3" />
          {t("join.scan_qr")}
        </Button>
      </div>
    </div>
  );
}

interface LobbyViewProps {
  quiz: Quiz;
  otherParticipants: Participant[];
}

function LobbyView({ quiz, otherParticipants }: LobbyViewProps) {
  const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 gradient-success rounded-3xl flex items-center justify-center bounce-in shadow-xl">
          <Check className="h-10 w-10 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">{t("join.youre_in")} 🎉</h2>
        <p className="text-lg text-muted-foreground font-medium">{t("join.waiting")}</p>
      </div>

      {/* Quiz Info */}
      <Card className="mb-8 card-elevated rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="font-bold text-xl mb-3">{quiz.title}</h3>
          <p className="text-base text-muted-foreground mb-6 leading-relaxed">
            {quiz.description || "Test your knowledge with this engaging quiz"}
          </p>
          
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              <p className="text-2xl font-bold text-primary mb-1">{questionCount}</p>
              <p className="text-sm text-muted-foreground font-medium">Questions</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
              <p className="text-2xl font-bold text-accent mb-1">30s</p>
              <p className="text-sm text-muted-foreground font-medium">Per Question</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Players */}
      <Card className="card-elevated rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <h4 className="font-bold text-lg mb-4">{t("join.other_players")}</h4>
          {otherParticipants.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                You're the first player! Others will appear here when they join.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {otherParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-3 bg-gradient-to-r from-secondary/30 to-secondary/50 px-4 py-3 rounded-2xl border border-border/50"
                >
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-primary-foreground">
                      {participant.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-base font-medium break-words text-wrap">{participant.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface PlayingViewProps {
  question: any;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  score: number;
  streak: number;
  timeRemaining: number;
  showConfetti: boolean;
  onConfettiComplete: () => void;
}

function PlayingView({
  question,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  score,
  streak,
  timeRemaining,
  showConfetti,
  onConfettiComplete
}: PlayingViewProps) {
  if (!question) {
    return (
      <div className="container mx-auto px-4 py-6 text-center max-w-md">
        <p className="text-muted-foreground">Loading question...</p>
      </div>
    );
  }

  const getOptionColor = (index: number) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];
    return colors[index] || "bg-gray-500";
  };

  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <Confetti active={showConfetti} onComplete={onConfettiComplete} />
      
      {/* Progress Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="flex items-center space-x-1">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-sm font-bold" data-testid="player-streak">{streak}</span>
            <span className="text-xs text-muted-foreground">streak</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="text-sm">
            <span className="font-bold" data-testid="current-question">{currentQuestionIndex + 1}</span>
            <span className="text-muted-foreground">/</span>
            <span data-testid="total-questions">{totalQuestions}</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="text-sm">
            <span className="font-bold text-primary" data-testid="player-score">{score.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <Card className="mb-8 card-elevated rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 leading-relaxed break-words text-wrap" data-testid="question-text">
            {question.question}
          </h2>
          
          {/* Answer Options */}
          <div className="space-y-4">
            {question.type === "mcq" && question.options ? (
              question.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  onClick={() => onAnswerSelect(option)}
                  disabled={!!selectedAnswer}
                  className={`w-full p-5 text-left rounded-2xl border-2 transition-all duration-300 touch-target shadow-md hover:shadow-lg ${
                    selectedAnswer === option
                      ? "border-primary bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg"
                      : selectedAnswer
                      ? "border-border bg-muted opacity-50"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  variant="outline"
                  data-testid={`answer-option-${index}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 ${getOptionColor(index)} rounded-xl flex items-center justify-center shadow-md`}>
                      <span className="text-white font-bold text-lg">{getOptionLetter(index)}</span>
                    </div>
                    <span className="font-semibold text-base sm:text-lg break-words text-wrap">{option}</span>
                  </div>
                </Button>
              ))
            ) : question.type === "true_false" ? (
              <>
                <Button
                  onClick={() => onAnswerSelect("true")}
                  disabled={!!selectedAnswer}
                  className={`w-full p-5 text-left rounded-2xl border-2 transition-all duration-300 touch-target shadow-md hover:shadow-lg ${
                    selectedAnswer === "true"
                      ? "border-primary bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg"
                      : selectedAnswer
                      ? "border-border bg-muted opacity-50"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  variant="outline"
                  data-testid="answer-option-true"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-semibold text-base sm:text-lg break-words text-wrap">True</span>
                  </div>
                </Button>
                <Button
                  onClick={() => onAnswerSelect("false")}
                  disabled={!!selectedAnswer}
                  className={`w-full p-5 text-left rounded-2xl border-2 transition-all duration-300 touch-target shadow-md hover:shadow-lg ${
                    selectedAnswer === "false"
                      ? "border-primary bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg"
                      : selectedAnswer
                      ? "border-border bg-muted opacity-50"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  variant="outline"
                  data-testid="answer-option-false"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                      <X className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-semibold text-base sm:text-lg break-words text-wrap">False</span>
                  </div>
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Timer */}
      <div className="text-center">
        <div className="inline-block">
          <div className="relative w-20 h-20 mb-2">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle 
                cx="40" 
                cy="40" 
                r="36" 
                stroke="hsl(var(--muted))" 
                strokeWidth="4" 
                fill="transparent"
              />
              <circle 
                cx="40" 
                cy="40" 
                r="36" 
                stroke="hsl(var(--primary))" 
                strokeWidth="4" 
                fill="transparent"
                strokeDasharray="226" 
                strokeDashoffset={226 - (226 * timeRemaining / 30)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold" data-testid="time-remaining">
                {timeRemaining}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">seconds remaining</p>
        </div>
      </div>
    </div>
  );
}

interface FinishedViewProps {
  score: number;
  streak: number;
}

function FinishedView({ score, streak }: FinishedViewProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-md text-center">
      <div className="mb-10">
        <div className="bg-gradient-to-br from-warning/20 to-warning/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <Trophy className="h-14 w-14 text-warning" />
        </div>
        <h2 className="text-3xl font-bold mb-3 tracking-tight">Quiz Complete! 🎉</h2>
        <p className="text-lg text-muted-foreground font-medium">Thanks for playing!</p>
      </div>

      <Card className="mb-8 card-elevated rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8">
          <h3 className="font-bold text-xl mb-6">Your Results</h3>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl">
              <p className="text-3xl font-bold text-primary mb-2" data-testid="final-score">
                {score.toLocaleString()}
              </p>
              <p className="text-base text-muted-foreground font-medium">Final Score</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl">
              <p className="text-3xl font-bold text-warning mb-2" data-testid="best-streak">
                {streak}
              </p>
              <p className="text-base text-muted-foreground font-medium">Best Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => window.location.href = "/"}
        className="btn-primary-lg text-primary-foreground rounded-2xl shadow-xl"
        data-testid="button-play-again"
      >
        <Star className="h-5 w-5 mr-3" />
        Play Another Quiz
      </Button>
    </div>
  );
}
