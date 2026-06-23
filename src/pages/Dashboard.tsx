import { Link } from 'react-router-dom';
import { Crosshair, Plus, TrendingUp, Trophy } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { ProgressChart } from '../components/ProgressChart';
import { TiradaRow } from '../components/TiradaRow';
import { useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';

export function Dashboard() {
  const tiradas = useTrainingStore((state) => state.tiradas);
  const weekly = tiradas.slice(0, 8);
  const totalShots = weekly.reduce((sum, tirada) => sum + tirada.totalShots, 0);
  const totalScore = weekly.reduce((sum, tirada) => sum + tirada.totalScore, 0);
  const bestTirada = weekly.reduce<any>((best, tirada) => (!best || tirada.totalScore > best.totalScore ? tirada : best), null);
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
          <Link to="/nueva-tirada" className="quick-card">
            <Plus size={48} />
            <strong>Nueva tirada</strong>
            <span>Crear tirada completa</span>
          </Link>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Mis tiradas recientes</h2>
          <Link to="/tiradas">Ver todas</Link>
        </div>
        <div className="session-list">
          {tiradas.slice(0, 3).map((tirada) => (
            <TiradaRow key={tirada.id} tirada={tirada} />
          ))}
        </div>
      </section>

      <section>
        <h2>Resumen de esta semana</h2>
        <div className="summary-card">
          <div>
            <Crosshair />
            <strong>{weekly.length}</strong>
            <span>Tiradas</span>
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
            <strong>{bestTirada ? bestTirada.totalScore : 0}</strong>
            <span>Mejor puntuación</span>
            {bestTirada && (
              <span className="summary-date">{formatDate(bestTirada.date)}</span>
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
