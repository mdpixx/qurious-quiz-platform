import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { QuriousSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import Dashboard from "@/pages/dashboard";
import AIBuilder from "@/pages/ai-builder";
import HostLive from "@/pages/host-live";
import JoinQuiz from "@/pages/join-quiz";
import Results from "@/pages/results";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/auth" component={Auth} />
      <Route path="/ai-builder" component={AIBuilder} />
      <Route path="/host-live" component={HostLive} />
      <Route path="/join/:code?" component={JoinQuiz} />
      <Route path="/results" component={Results} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider>
            <div className="min-h-screen bg-background">
              {/* Fixed Sidebar Background - Ensure visibility */}
              <div 
                className="hidden md:block fixed left-0 top-0 w-64 h-full bg-white border-r border-gray-200 z-10"
                style={{ 
                  backgroundColor: '#ffffff',
                  borderRight: '1px solid #e2e8f0',
                  width: '16rem',
                  height: '100vh',
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  zIndex: 10
                }}
              >
                {/* This ensures sidebar background is always visible */}
              </div>
              
              {/* Modern Sidebar Navigation - Content overlay */}
              <div className="relative z-20">
                <QuriousSidebar />
              </div>
              
              {/* Main Content Area - Offset for sidebar */}
              <SidebarInset className="md:ml-64" style={{ marginLeft: '0' }}>
                <div className="md:ml-64">
                  {/* Simplified Header */}
                  <Navigation />
                  
                  {/* Page Content */}
                  <div className="flex flex-1 flex-col">
                    <Router />
                  </div>
                </div>
              </SidebarInset>
              
              {/* Toast notifications */}
              <Toaster />
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
