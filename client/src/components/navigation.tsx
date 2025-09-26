import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useThemeContext } from "@/components/theme-provider";
import { t, getCurrentLanguage, setLanguage } from "@/lib/i18n";
import { Brain, Palette, Globe, User } from "lucide-react";

export function Navigation() {
  const { theme, toggleTheme } = useThemeContext();
  const currentLang = getCurrentLanguage();

  const toggleLanguage = () => {
    const newLang = currentLang === "en" ? "hi" : "en";
    setLanguage(newLang);
    window.location.reload(); // Reload to apply language changes
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile Sidebar Toggle */}
          <SidebarTrigger className="md:hidden" data-testid="button-sidebar-toggle" />
          
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="gradient-primary p-2 rounded-lg">
                <Brain className="text-primary-foreground h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{t("header.title")}</h1>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Language Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleLanguage}
            className="touch-target"
            data-testid="button-language-toggle"
          >
            <Globe className="h-4 w-4 mr-1" />
            {currentLang === "en" ? "EN" : "हि"}
          </Button>
          
          {/* Theme Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            className="touch-target"
            data-testid="button-theme-toggle"
          >
            <Palette className="h-4 w-4" />
          </Button>
          
          {/* User Menu */}
          <Button
            variant="secondary"
            size="sm"
            className="touch-target"
            data-testid="button-user-menu"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden sm:block text-sm font-medium">User</span>
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
