import type { ReactNode } from "react";

import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

export function AppShell({ children, userName }: { children: ReactNode; userName: string }) {
  const initials = userName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-workspace">
        <header className="app-header">
          <div className="app-header-main">
            <a className="app-brand" href="/variables">App Name</a>
            <span aria-hidden="true" className="app-breadcrumb-separator">›</span>
            <span className="app-context">Design Variable List</span>
            <form action="/logout" method="post">
              <Tooltip label={userName}><span aria-label={`Signed in as ${userName}`} className="user-avatar">{initials}</span></Tooltip>
              <Button aria-label="Sign out" className="text-button sign-out-button" title="Sign out" type="submit"><svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></svg></Button>
            </form>
          </div>
        </header>
        <main className="app-content" id="main-content">{children}</main>
      </div>
    </div>
  );
}
