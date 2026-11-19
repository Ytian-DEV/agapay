import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Home, Map, User } from 'lucide-react';

interface BottomTabBarProps {
  alertBadgeCount?: number;
}

export function BottomTabBar({ alertBadgeCount = 0 }: BottomTabBarProps) {
  const { t } = useTranslation();

  const items = [
    { to: '/home', label: t('nav.home'), icon: Home, badgeCount: 0 },
    { to: '/map', label: t('nav.map'), icon: Map, badgeCount: 0 },
    { to: '/alerts', label: t('nav.alerts'), icon: Bell, badgeCount: alertBadgeCount },
    { to: '/profile', label: t('nav.profile'), icon: User, badgeCount: 0 },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="no-print fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pt-2"
      style={{ paddingBottom: 'max(14px, var(--safe-bottom))' }}
    >
      <div
        className="flex items-center gap-1 rounded-[32px] border p-1.5 shadow-[0_8px_24px_rgba(17,19,18,0.12)] backdrop-blur-md"
        style={{
          backgroundColor: 'var(--glass)',
          borderColor: 'var(--border)',
        }}
      >
        {items.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[26px] px-2 transition-colors ${
                  isActive
                    ? 'bg-[var(--ink)] text-[var(--bg)] shadow-sm'
                    : 'text-[var(--sub)] hover:text-[var(--ink)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.4 : 2}
                      className={isActive ? 'text-[var(--accent-bright)] dark:text-[var(--accent-deep)]' : ''}
                    />
                    {tab.badgeCount > 0 ? (
                      <span
                        className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ backgroundColor: 'var(--avoid-border)' }}
                      >
                        {tab.badgeCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] font-semibold tracking-tight">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
