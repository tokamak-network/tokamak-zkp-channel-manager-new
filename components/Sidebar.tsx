/**
 * Sidebar Component
 * 
 * Left navigation menu
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@tokamak/ui';
import { Card, CardContent } from '@tokamak/ui';

interface MenuItem {
  label: string;
  href: string;
  icon?: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'Create Channel',
    href: '/create-channel',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0">
      <Card>
        <CardContent className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'primary' : 'outline'}
                    className="w-full justify-start"
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>
    </aside>
  );
}

