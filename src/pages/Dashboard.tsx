import { Link } from 'react-router-dom';
import { Crosshair, Plus, TrendingUp, Trophy } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { ProgressChart } from '../components/ProgressChart';
import { TiradaRow } from '../components/TiradaRow';
import { useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';
import { translations } from '../data/translations';

export function Dashboard() {
  const tiradas = useTrainingStore((state) => state.tiradas);
  const userPhone = useTrainingStore((state) => state.userPhone);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

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
            <p>{t.dashboard_welcome_subtitle} · <span style={{ color: 'var(--green)', fontWeight: 700 }}>{userPhone}</span></p>
          </div>
        </div>
        <div className="header-logo-container">
          <img src={`${import.meta.env.BASE_URL}logo-pixer.png`} alt="Agencia Pixer" className="header-logo" />
        </div>
      </header>

      <section>
        <h2>{t.dashboard_actions_title}</h2>
        <div className="quick-actions">
          <Link to="/nueva-tirada" className="quick-card">
            <Plus size={32} />
            <strong>{t.new_tirada_title}</strong>
            <span>{t.dashboard_btn_new_session_desc}</span>
          </Link>
          <Link to="/nueva-tanda" className="quick-card quick-card--primary">
            <Crosshair size={34} />
            <strong>{t.new_round_title}</strong>
            <span>{t.dashboard_btn_new_round_desc}</span>
          </Link>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>{t.dashboard_recent_title}</h2>
          <Link to="/tiradas">{t.dashboard_view_all}</Link>
        </div>
        <div className="session-list">
          {tiradas.slice(0, 3).map((tirada) => (
            <TiradaRow key={tirada.id} tirada={tirada} />
          ))}
        </div>
      </section>

      <section>
        <h2>{t.dashboard_weekly_title}</h2>
        <div className="summary-card">
          <div>
            <Crosshair />
            <strong>{weekly.length}</strong>
            <span>{t.dashboard_stat_sessions}</span>
          </div>
          <div>
            <Trophy />
            <strong>{totalShots}</strong>
            <span>{t.dashboard_stat_shots}</span>
          </div>
          <div>
            <TrendingUp />
            <strong>{formatAverage(average)}</strong>
            <span>{t.dashboard_stat_average}</span>
          </div>
          <div>
            <Trophy />
            <strong>{bestTirada ? bestTirada.totalScore : 0}</strong>
            <span>{t.dashboard_stat_best}</span>
            {bestTirada && (
              <span className="summary-date">{formatDate(bestTirada.date)}</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>{t.dashboard_progress_title}</h2>
          <Link to="/historial">{t.dashboard_view_more}</Link>
        </div>
        <ProgressChart />
      </section>
    </div>
  );
}
