import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Crosshair, Home, Settings, Share2 } from 'lucide-react';
import { useTrainingStore } from '../store/useTrainingStore';
import { translations } from '../data/translations';

export function AppShell({ children }: PropsWithChildren) {
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const navItems = [
    { to: '/', label: t.nav_home, icon: Home },
    { to: '/tiradas', label: t.nav_sessions, icon: Crosshair },
    { to: '/historial', label: t.nav_history, icon: BarChart3 },
    { to: '/compartir', label: t.nav_share, icon: Share2 },
    { to: '/ajustes', label: t.nav_settings, icon: Settings }
  ];

  return (
    <div className="app-shell">
      <main className="app-screen">{children}</main>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="bottom-nav__item">
              <Icon aria-hidden size={25} strokeWidth={2.35} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
