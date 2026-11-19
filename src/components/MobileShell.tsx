import React from 'react';
import { BottomTabBar } from './BottomTabBar';

interface MobileShellProps {
  children: React.ReactNode;
  showTabs?: boolean;
  className?: string;
}

/**
 * Responsive mobile-first container with Capacitor-safe viewport padding.
 * Expands gracefully on larger screens while preserving Agapay's clean phone proportions.
 */
export function MobileShell({ children, showTabs = true, className = '' }: MobileShellProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-[var(--bg)] text-[var(--ink)]">
      <main
        className={`mx-auto min-h-[100dvh] w-full max-w-md px-4 pt-safe ${
          showTabs ? 'pb-36' : 'pb-safe'
        } ${className}`}
      >
        {children}
      </main>
      {showTabs && <BottomTabBar />}
    </div>
  );
}
