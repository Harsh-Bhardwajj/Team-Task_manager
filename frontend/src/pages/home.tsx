import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/lib/auth";

export default function Home() {
  const { data: user } = useAuthUser();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2 font-bold text-primary text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M8 7v7" />
            <path d="M12 7v4" />
            <path d="M16 7v9" />
          </svg>
          <span>Team Task Manager</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            A focused workspace for <br />
            <span className="text-primary">high-performing teams</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track projects, manage tasks, and keep everyone aligned without the clutter. Built for speed and clarity.
          </p>
          {!user && (
            <div className="pt-4 flex justify-center gap-4">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 py-2 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Start Building Now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
