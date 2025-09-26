import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  Home, 
  Sparkles, 
  Play, 
  Users, 
  BarChart3,
  FileText, 
  Heart, 
  Share2,
  Settings, 
  HelpCircle,
  Globe,
  Palette,
  ChevronDown,
  ChevronRight,
  Brain,
  User
} from "lucide-react";

import { t, getCurrentLanguage, setLanguage } from "@/lib/i18n";
import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}

const primaryNavItems: NavigationItem[] = [
  {
    title: t("nav.dashboard"),
    href: "/",
    icon: Home,
    testId: "nav-dashboard",
  },
  {
    title: t("nav.ai_builder"),
    href: "/ai-builder",
    icon: Sparkles,
    testId: "nav-ai-builder",
  },
  {
    title: "Host Live",
    href: "/host-live",
    icon: Play,
    testId: "nav-host-live",
  },
  {
    title: "Join Quiz",
    href: "/join",
    icon: Users,
    testId: "nav-join-quiz",
  },
  {
    title: "Analytics",
    href: "/results",
    icon: BarChart3,
    testId: "nav-analytics",
  },
];

const contentNavItems: NavigationItem[] = [
  {
    title: "My Quizzes",
    href: "/my-quizzes",
    icon: FileText,
    testId: "nav-my-quizzes",
  },
  {
    title: "Favorites",
    href: "/favorites",
    icon: Heart,
    testId: "nav-favorites",
  },
  {
    title: "Shared",
    href: "/shared",
    icon: Share2,
    testId: "nav-shared",
  },
];

const systemNavItems: NavigationItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    testId: "nav-settings",
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
    testId: "nav-help",
  },
];

export function QuriousSidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useThemeContext();
  const currentLang = getCurrentLanguage();
  const { isMobile, setOpenMobile } = useSidebar();

  const [contentExpanded, setContentExpanded] = useState(true);
  const [systemExpanded, setSystemExpanded] = useState(true);

  const toggleLanguage = () => {
    const newLang = currentLang === "en" ? "hi" : "en";
    setLanguage(newLang);
    window.location.reload(); // Reload to apply language changes
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  // Auto-close mobile drawer after navigation
  const handleNavigationClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarPrimitive 
      className="border-r bg-white shadow-sm" 
      data-testid="sidebar-main"
      style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0' }}
    >
      <SidebarHeader className="border-b">
        <Link 
          href="/" 
          data-testid="link-branding"
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
        >
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="gradient-primary p-2 rounded-lg">
              <Brain className="text-primary-foreground h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground group-data-[collapsible=icon]:hidden">
                {t("header.title")}
              </h1>
              <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                Quiz Platform
              </p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    data-testid={item.testId}
                    className="touch-target min-h-[44px]"
                  >
                    <Link href={item.href} onClick={handleNavigationClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Content Management */}
        <Collapsible 
          open={contentExpanded} 
          onOpenChange={setContentExpanded}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger 
                className="flex w-full items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary touch-target min-h-[44px]"
                data-testid="toggle-content-section"
                aria-label="Toggle content management section"
                tabIndex={0}
              >
                <span>Content Management</span>
                {contentExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {contentNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                        data-testid={item.testId}
                        className="touch-target min-h-[44px]"
                      >
                        <Link href={item.href} onClick={handleNavigationClick}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* System */}
        <Collapsible 
          open={systemExpanded} 
          onOpenChange={setSystemExpanded}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger 
                className="flex w-full items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary touch-target min-h-[44px]"
                data-testid="toggle-system-section"
                aria-label="Toggle system section"
                tabIndex={0}
              >
                <span>System</span>
                {systemExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                        data-testid={item.testId}
                        className="touch-target min-h-[44px]"
                      >
                        <Link href={item.href} onClick={handleNavigationClick}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {/* User Controls */}
        <SidebarMenu>
          {/* Language Toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleLanguage}
              tooltip={`Switch to ${currentLang === "en" ? "Hindi" : "English"}`}
              data-testid="button-language-toggle"
              aria-label={`Switch to ${currentLang === "en" ? "Hindi" : "English"}`}
              className="touch-target min-h-[44px]"
            >
              <Globe className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                {currentLang === "en" ? "English" : "हिन्दी"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Theme Toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={`Switch to ${theme === "playful" ? "minimal" : "playful"} theme`}
              data-testid="button-theme-toggle"
              aria-label={`Switch to ${theme === "playful" ? "minimal" : "playful"} theme`}
              className="touch-target min-h-[44px]"
            >
              <Palette className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                {theme === "playful" ? "Playful" : "Minimal"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* User Profile */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="User Profile"
              data-testid="button-user-profile"
              className="touch-target min-h-[44px]"
            >
              <Link href="/profile" onClick={handleNavigationClick}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium">User</span>
                    <span className="text-xs text-muted-foreground">user@example.com</span>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}