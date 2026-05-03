import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, CheckSquare, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function SidebarNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
      {/* Sign Out button */}
      <button
        onClick={async () => {
          await signOut();
          // After sign out, redirect to sign-in page
          setLocation("/sign-in");
        }}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </nav>
  );
}
