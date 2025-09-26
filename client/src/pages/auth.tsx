import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { t } from "@/lib/i18n";
import { type InsertUser, type User } from "@shared/schema";
import { Brain, Mail, User as UserIcon, Building, Globe, Palette } from "lucide-react";

type AuthMode = "login" | "register";

export default function Auth() {
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"professional" | "student" | "teacher">("student");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [theme, setTheme] = useState<"playful" | "minimal">("playful");
  const [organizationName, setOrganizationName] = useState("");

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store user in localStorage (in real app, use proper auth state management)
      localStorage.setItem("qurious-user", JSON.stringify(data.user));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.username}!`
      });
      
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      // Store user in localStorage
      localStorage.setItem("qurious-user", JSON.stringify(data.user));
      
      toast({
        title: "Registration Successful",
        description: `Welcome to Qurious, ${data.user.username}!`
      });
      
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLogin = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    loginMutation.mutate({ email: email.trim() });
  };

  const handleRegister = () => {
    if (!email.trim() || !username.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const userData: InsertUser = {
      email: email.trim(),
      username: username.trim(),
      role,
      preferredLanguage,
      theme,
      organizationName: organizationName.trim() || undefined
    };

    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words text-wrap">{t("header.title")}</h1>
          <p className="text-muted-foreground break-words text-wrap">
            {mode === "login" 
              ? "Welcome back to your quiz platform"
              : "Join the gamified learning experience"
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg sm:text-xl break-words text-wrap">
              {mode === "login" ? "Sign In" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 touch-target"
                  data-testid="input-email"
                />
              </div>
            </div>

            {mode === "register" && (
              <>
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Display Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Your display name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 touch-target"
                      data-testid="input-username"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={(value: "professional" | "student" | "teacher") => setRole(value)}>
                    <SelectTrigger className="touch-target" data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Working Professional</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher/Educator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization (for professionals) */}
                {role === "professional" && (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization (Optional)</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organization"
                        type="text"
                        placeholder="Your company"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="pl-10 touch-target"
                        data-testid="input-organization"
                      />
                    </div>
                  </div>
                )}

                {/* Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                      <SelectTrigger className="touch-target" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={(value: "playful" | "minimal") => setTheme(value)}>
                      <SelectTrigger className="touch-target" data-testid="select-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full gradient-primary text-primary-foreground py-3 text-base sm:text-lg font-semibold touch-target break-words text-wrap"
              data-testid={mode === "login" ? "button-login" : "button-register"}
            >
              {loginMutation.isPending || registerMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                  {mode === "login" ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </>
              )}
            </Button>

            {/* Mode Toggle */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm break-words text-wrap"
                data-testid="button-toggle-mode"
              >
                {mode === "login" 
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>

            {/* Demo Users Info */}
            <div className="bg-muted/50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2 break-words text-wrap">Demo Mode:</p>
              <p className="text-muted-foreground break-words text-wrap">
                For testing, you can use any email address. In a production environment, 
                this would integrate with proper authentication providers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p className="break-words text-wrap">Built for India-first learning experiences</p>
          <p className="mt-1 break-words text-wrap">🇮🇳 Mobile-first • Multilingual • Low-bandwidth optimized</p>
        </div>
      </div>
    </div>
  );
}
