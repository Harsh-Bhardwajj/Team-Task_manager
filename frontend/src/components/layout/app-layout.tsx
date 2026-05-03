import { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 border-r bg-card md:block">
        <div className="flex h-14 items-center border-b px-4">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M8 7v7" />
              <path d="M12 7v4" />
              <path d="M16 7v9" />
            </svg>
            <span>Team Task Manager</span>
          </div>
        </div>
        <div className="p-4">
          <SidebarNav />
        </div>
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
