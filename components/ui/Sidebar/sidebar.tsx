"use client";

import { usePathname } from "next/navigation";

import { cn } from "../../../lib/utils";
import styles from "./style.module.css";
import { navItems } from "./constant";

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={styles.sidebar}>
      <div className={styles.section}>
        {navItems.map((item) => (
          <a
            className={cn(styles.navItem, pathname === item.href && styles.navItemActive)}
            href={item.href}
            key={item.href}
          >
            <item.icon />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
};
