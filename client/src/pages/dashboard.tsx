import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { Sparkles, Play, Plus, Brain, Book, Globe, Trophy, Flame, Users, Target, Clock } from "lucide-react";

// Mock user for now - in real app this would come from auth
const mockUser = {
  id: "user-1",
  name: "Priya S.",
  email: "priya@example.com",
  role: "professional" as const
};

export default function Dashboard() {
  const [user] = useState(mockUser);

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

  // Mock stats - in real app this would be calculated from actual data
  const stats = {
    totalQuizzes: quizzes.length,
    playersThisMonth: 1247,
    avgScore: 84,
    bestStreak: 7
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="gradient-primary p-6 sm:p-8 rounded-2xl text-primary-foreground mb-8 shadow-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight break-words text-wrap">
            {t("dashboard.welcome")}, {user.name}! 👋
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/90 font-medium break-words text-wrap">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatsCard
            icon={<Brain className="h-6 w-6" />}
            value={stats.totalQuizzes}
            label={t("dashboard.total_quizzes")}
            color="text-primary"
          />
          <StatsCard
            icon={<Users className="h-6 w-6" />}
            value={stats.playersThisMonth.toLocaleString()}
            label={t("dashboard.players_month")}
            color="text-accent"
          />
          <StatsCard
            icon={<Target className="h-6 w-6" />}
            value={`${stats.avgScore}%`}
            label={t("dashboard.avg_score")}
            color="text-success"
          />
          <StatsCard
            icon={<Flame className="h-6 w-6" />}
            value={stats.bestStreak}
            label={t("dashboard.best_streak")}
            color="text-warning"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
        <Link href="/ai-builder">
          <Button
            className="btn-primary-lg text-primary-foreground rounded-2xl hover:shadow-2xl transition-all duration-300 touch-target w-full h-auto shadow-lg"
            data-testid="button-create-ai-quiz"
          >
            <div className="text-center py-4">
              <Sparkles className="h-10 w-10 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3 break-words text-wrap">{t("dashboard.create_ai")}</h3>
              <p className="text-base opacity-90 leading-relaxed break-words text-wrap">{t("dashboard.create_ai_desc")}</p>
            </div>
          </Button>
        </Link>

        <Link href="/host-live">
          <Button
            className="btn-secondary-lg text-accent-foreground rounded-2xl hover:shadow-2xl transition-all duration-300 touch-target w-full h-auto shadow-lg"
            data-testid="button-host-live"
          >
            <div className="text-center py-4">
              <Play className="h-10 w-10 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3 break-words text-wrap">{t("dashboard.host_live")}</h3>
              <p className="text-base opacity-90 leading-relaxed break-words text-wrap">{t("dashboard.host_live_desc")}</p>
            </div>
          </Button>
        </Link>

        <Button
          variant="outline"
          className="border-2 border-dashed border-border text-card-foreground p-8 rounded-2xl hover:border-primary hover:bg-accent/5 transition-all duration-300 touch-target w-full h-auto card-elevated"
          data-testid="button-create-manual"
        >
          <div className="text-center py-4">
            <Plus className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-3 break-words text-wrap">{t("dashboard.create_manual")}</h3>
            <p className="text-base text-muted-foreground leading-relaxed break-words text-wrap">{t("dashboard.create_manual_desc")}</p>
          </div>
        </Button>
      </div>

      {/* Recent Quizzes */}
      <Card className="card-elevated rounded-2xl border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between p-8 pb-6">
          <CardTitle className="text-2xl font-bold">{t("dashboard.recent_quizzes")}</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="button-view-all-quizzes">
            {t("dashboard.view_all")}
          </Button>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {quizzesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="w-12 h-12 bg-muted rounded-lg skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded skeleton w-1/3" />
                    <div className="h-3 bg-muted rounded skeleton w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : quizzes.length > 0 ? (
            <div className="space-y-4">
              {quizzes.slice(0, 3).map((quiz: any) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Brain className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">{t("dashboard.no_quizzes")}</h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-md mx-auto">{t("dashboard.no_quizzes_desc")}</p>
              <Link href="/ai-builder">
                <Button className="btn-primary-lg text-primary-foreground rounded-xl shadow-lg" data-testid="button-create-first-quiz">
                  <Sparkles className="h-5 w-5 mr-3" />
                  {t("dashboard.create_first")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function StatsCard({ icon, value, label, color }: StatsCardProps) {
  return (
    <Card className="card-elevated rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1 break-words" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            <p className="text-sm text-muted-foreground font-medium break-words text-wrap">{label}</p>
          </div>
          <div className={`${color} p-3 rounded-full bg-gradient-to-br from-background to-secondary/50`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuizCardProps {
  quiz: any;
}

function QuizCard({ quiz }: QuizCardProps) {
  const getQuizIcon = (title: string) => {
    if (title.toLowerCase().includes("javascript")) return <Brain className="h-6 w-6" />;
    if (title.toLowerCase().includes("ai") || title.toLowerCase().includes("machine")) return <Book className="h-6 w-6" />;
    return <Globe className="h-6 w-6" />;
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-primary to-accent",
      "from-accent to-warning", 
      "from-success to-primary"
    ];
    return gradients[index % gradients.length];
  };

  const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  const lastPlayed = new Date(quiz.updatedAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-background via-card to-background/50 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 gap-4">
      <div className="flex items-center space-x-3 sm:space-x-5 min-w-0 flex-1">
        <div className={`w-14 h-14 bg-gradient-to-r ${getGradientClass(0)} rounded-xl flex items-center justify-center text-primary-foreground shadow-lg`}>
          {getQuizIcon(quiz.title)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-lg mb-1 break-words text-wrap" data-testid={`quiz-title-${quiz.id}`}>
            {quiz.title}
          </h4>
          <p className="text-sm text-muted-foreground break-words">
            <span data-testid={`quiz-question-count-${quiz.id}`} className="font-medium">{questionCount}</span> questions • 
            <span className="ml-1" data-testid={`quiz-last-played-${quiz.id}`}>{lastPlayed}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <Button variant="ghost" size="sm" className="touch-target hover:bg-primary/10 rounded-xl" data-testid={`button-play-${quiz.id}`}>
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button variant="ghost" size="sm" className="touch-target hover:bg-accent/10 rounded-xl" data-testid={`button-edit-${quiz.id}`}>
          <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}
