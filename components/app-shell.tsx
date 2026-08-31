"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { getInitials } from "../lib/utils";
import { Avatar } from "./ui/Avatar/avatar";
import { Sidebar } from "./ui/Sidebar/sidebar";
import { navItems } from "./ui/Sidebar/constant";
import { SignOutIcon } from "./icons/icons";

export function AppShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const initials = getInitials(userName);
  const pathname = usePathname();
  const activeItem = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="app-workspace">
        <Sidebar />
        <div className="app-main">
          <header className="app-header">
            <div className="app-header-main">
              <a className="app-brand" href="/variables">
                App Name
              </a>
              <span aria-hidden="true" className="app-breadcrumb-separator">
                ›
              </span>
              <span className="app-context">
                {activeItem?.label ?? "Design Variable List"}
              </span>
              <form action="/logout" method="post">
                <Tooltip label={userName}>
                  <Avatar
                    name={initials}
                    aria={`Signed in as ${userName}`}
                  />
                </Tooltip>
                <Button
                  aria-label="Sign out"
                  className="text-button sign-out-button"
                  title="Sign out"
                  type="submit"
                >
                  <SignOutIcon />
                </Button>
              </form>
            </div>
          </header>
          <main className="app-content" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
