/**
 * Sidebar Component
 *
 * Left navigation menu
 * Uses Next.js router for SPA navigation
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@tokamak/ui";
import { Card, CardContent } from "@tokamak/ui";

interface MenuItem {
  label: string;
  path: string;
  icon?: string;
}

const menuItems: MenuItem[] = [
  {
    label: "Create Channel",
    path: "/create-channel",
  },
  {
    label: "Deposit",
    path: "/deposit",
  },
  {
    label: "Initialize State",
    path: "/initialize-state",
  },
  {
    label: "State Explorer",
    path: "/state-explorer",
  },
  {
    label: "Submit Proof",
    path: "/submit-proof",
  },
  {
    label: "L2 Address",
    path: "/l2-address",
  },
  {
    label: "Test Hooks",
    path: "/test-hooks",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 flex-shrink-0">
      <Card>
        <CardContent className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-input"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>
    </aside>
  );
}
