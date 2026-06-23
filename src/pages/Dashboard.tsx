import { Link } from 'react-router-dom';
import { Crosshair, Plus, TrendingUp, Trophy } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { ProgressChart } from '../components/ProgressChart';
import { SessionRow } from '../components/SessionRow';
import { useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';

export function Dashboard() {
  const sessions = useTrainingStore((state) => state.sessions);
  const weekly = sessions.slice(0, 8);
  const totalShots = weekly.reduce((sum, session) => sum + session.totalShots, 0);
  const totalScore = weekly.reduce((sum, session) => sum + session.totalScore, 0);
  const bestSession = weekly.reduce<any>((best, session) => (!best || session.totalScore > best.totalScore ? session : best), null);
  const average = totalShots ? totalScore / totalShots : 0;

  return (
    <div className="page page--home">
      <header className="home-header">
        <div className="home-header__brand">
          <BrandMark />
          <div>
            <h1>
              TIRO<span>22</span>
            </h1>
            <p>Tu entrenamiento, tu progreso</p>
          </div>
        </div>
      </header>

      <section>
        <h2>Acciones rápidas</h2>
        <div className="quick-actions">
          <Link to="/nueva-tanda" className="quick-card quick-card--primary">
            <Crosshair size={54} />
            <strong>Nueva tanda</strong>
            <span>Registrar 5 disparos</span>
          </Link>
          <Link to="/nueva-sesion" className="quick-card">
            <Plus size={48} />
            <strong>Nueva sesión</strong>
            <span>Crear sesión completa</span>
          </Link>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Mis sesiones recientes</h2>
          <Link to="/sesiones">Ver todas</Link>
        </div>
        <div className="session-list">
          {sessions.slice(0, 3).map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      </section>

      <section>
        <h2>Resumen de esta semana</h2>
        <div className="summary-card">
          <div>
            <Crosshair />
            <strong>{weekly.length}</strong>
            <span>Sesiones</span>
          </div>
          <div>
            <Trophy />
            <strong>{totalShots}</strong>
            <span>Disparos</span>
          </div>
          <div>
            <TrendingUp />
            <strong>{formatAverage(average)}</strong>
            <span>Media general</span>
          </div>
          <div>
            <Trophy />
            <strong>{bestSession ? bestSession.totalScore : 0}</strong>
            <span>Mejor puntuación</span>
            {bestSession && (
              <span className="summary-date">{formatDate(bestSession.date)}</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Progreso</h2>
          <Link to="/historial">Ver más</Link>
        </div>
        <ProgressChart />
      </section>
    </div>
  );
}
