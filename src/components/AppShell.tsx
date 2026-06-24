import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Crosshair, Home, Settings, Share2 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/tiradas', label: 'Tiradas', icon: Crosshair },
  { to: '/historial', label: 'Historial', icon: BarChart3 },
  { to: '/compartir', label: 'Compartir', icon: Share2 },
  { to: '/ajustes', label: 'Ajustes', icon: Settings }
];

export function AppShell({ children }: PropsWithChildren) {
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
