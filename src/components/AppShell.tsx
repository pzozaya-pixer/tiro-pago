import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Crosshair, Home, ListChecks, Settings, Shield } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/tiradas', label: 'Tiradas', icon: Crosshair },
  { to: '/historial', label: 'Historial', icon: BarChart3 },
  { to: '/armas', label: 'Armas', icon: Shield },
  { to: '/ajustes', label: 'Ajustes', icon: Settings }
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <main className="app-screen">{children}</main>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {navItems.map((item) => {
          const Icon = item.icon === Shield ? ListChecks : item.icon;
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
