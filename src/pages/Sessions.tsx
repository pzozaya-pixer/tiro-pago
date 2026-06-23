import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { SessionRow } from '../components/SessionRow';
import { useTrainingStore } from '../store/useTrainingStore';

export function Sessions({ mode }: { mode?: 'weapons' | 'settings' }) {
  const sessions = useTrainingStore((state) => state.sessions);
  const weapons = useTrainingStore((state) => state.weapons);

  if (mode === 'weapons') {
    return (
      <div className="page list-page">
        <header className="compact-header">
          <h1>Armas</h1>
          <p>Armas preparadas para sesiones de pistola y carabina .22 LR.</p>
        </header>
        <div className="simple-list">
          {weapons.map((weapon) => (
            <article key={weapon.id}>
              <strong>{weapon.name}</strong>
              <span>{weapon.caliber} · {weapon.type === 'pistol' ? 'Pistola' : 'Carabina'}</span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'settings') {
    return (
      <div className="page list-page">
        <header className="compact-header">
          <h1>Ajustes</h1>
          <p>Proveedor configurado: {import.meta.env.VITE_DATA_PROVIDER ?? 'local'}.</p>
        </header>
        <div className="status-card">
          <strong>Offline listo</strong>
          <span>Las tandas se guardan en el dispositivo y quedan en cola para sincronizar.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page list-page">
      <header className="compact-header compact-header--row">
        <div>
          <h1>Sesiones</h1>
          <p>Resumen de sesiones y totales acumulados.</p>
        </div>
        <Link className="round-add" to="/nueva-sesion" aria-label="Nueva sesión">
          <Plus />
        </Link>
      </header>
      <div className="session-list">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
