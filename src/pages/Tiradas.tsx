import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TiradaRow } from '../components/TiradaRow';
import { useTrainingStore } from '../store/useTrainingStore';
import { translations } from '../data/translations';

export function Tiradas() {
  const tiradas = useTrainingStore((state) => state.tiradas);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  return (
    <div className="page list-page">
      <header className="compact-header compact-header--row">
        <div>
          <h1>{t.nav_sessions}</h1>
          <p>
            {language === 'en'
              ? 'Summary of sessions and accumulated totals.'
              : language === 'fr'
              ? 'Résumé des sessions et des totaux cumulés.'
              : 'Resumen de tiradas y totales acumulados.'}
          </p>
        </div>
        <div className="header-actions">
          <Link className="round-add" to="/nueva-tirada" aria-label="Nueva tirada">
            <Plus />
          </Link>
          <div className="header-logo-container">
            <img src={`${import.meta.env.BASE_URL}logo-pixer.png`} alt="Agencia Pixer" className="header-logo" />
          </div>
        </div>
      </header>
      <div className="session-list">
        {tiradas.map((tirada) => (
          <TiradaRow key={tirada.id} tirada={tirada} />
        ))}
      </div>
    </div>
  );
}
