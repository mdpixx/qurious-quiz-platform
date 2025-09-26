import { Link, useLocation } from "wouter";
import { t } from "@/lib/i18n";
import { Home, Sparkles, Play, Users, BarChart3 } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <div className="grid grid-cols-5 gap-1">
        <MobileNavItem
          href="/"
          icon={<Home className="h-5 w-5" />}
          label="Home"
          active={location === "/"}
        />
        <MobileNavItem
          href="/ai-builder"
          icon={<Sparkles className="h-5 w-5" />}
          label="AI Build"
          active={location === "/ai-builder"}
        />
        <MobileNavItem
          href="/host-live"
          icon={<Play className="h-5 w-5" />}
          label="Host"
          active={location === "/host-live"}
        />
        <MobileNavItem
          href="/join"
          icon={<Users className="h-5 w-5" />}
          label="Join"
          active={location.startsWith("/join")}
        />
        <MobileNavItem
          href="/results"
          icon={<BarChart3 className="h-5 w-5" />}
          label="Results"
          active={location === "/results"}
        />
      </div>
    </nav>
  );
}

interface MobileNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function MobileNavItem({ href, icon, label, active }: MobileNavItemProps) {
  return (
    <Link href={href}>
      <button
        className={`flex flex-col items-center justify-center p-3 text-xs transition-colors ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
        data-testid={`mobile-nav-${href.replace("/", "") || "dashboard"}`}
      >
        <div className="mb-1">{icon}</div>
        <span>{label}</span>
      </button>
    </Link>
  );
}
