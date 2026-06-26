import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { NewRound } from './pages/NewRound';
import { NewTirada } from './pages/NewTirada';
import { Share } from './pages/Share';
import { Tiradas } from './pages/Tiradas';
import { Settings } from './pages/Settings';
import { useTrainingStore } from './store/useTrainingStore';
import { translations } from './data/translations';

export default function App() {
  const loadFromApi = useTrainingStore((state) => state.loadFromApi);
  const userEmail = useTrainingStore((state) => state.userEmail);
  const registerUser = useTrainingStore((state) => state.registerUser);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Carga inicial y sincronización de datos de la API solo si hay usuario registrado
    if (userEmail) {
      loadFromApi();
    }

    const handleOnline = () => {
      if (userEmail) {
        loadFromApi();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [loadFromApi, userEmail]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    setIsSubmitting(true);
    try {
      await registerUser(cleanEmail);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si no hay email registrado, bloqueamos la app con el onboarding
  if (!userEmail) {
    return (
      <div className="onboarding-screen">
        <form className="onboarding-card" onSubmit={handleSubmitEmail}>
          <div className="onboarding-logo">
            <div className="header-logo-container" style={{ marginBottom: '10px' }}>
              <img
                src={`${import.meta.env.BASE_URL}logo-pixer.png`}
                alt="Agencia Pixer"
                className="header-logo"
                style={{ width: '80px', height: '80px', margin: '0 auto' }}
              />
            </div>
            <h1>{t.onboarding_title}<span>22</span></h1>
            <p>{t.onboarding_subtitle}</p>
          </div>
          <label className="field">
            <span>{t.onboarding_email_label}</span>
            <input
              type="email"
              placeholder={t.onboarding_email_placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              autoFocus
            />
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting || !email.trim()}>
            {isSubmitting ? t.onboarding_btn_loading : t.onboarding_btn_submit}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nueva-tanda" element={<NewRound />} />
        <Route path="/nueva-tirada" element={<NewTirada />} />
        <Route path="/tiradas" element={<Tiradas />} />
        <Route path="/historial" element={<History />} />
        <Route path="/compartir" element={<Share />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
