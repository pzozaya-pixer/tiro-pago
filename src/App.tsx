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
import { Smartphone } from 'lucide-react';

export default function App() {
  const loadFromApi = useTrainingStore((state) => state.loadFromApi);
  const userEmail = useTrainingStore((state) => state.userEmail);
  const registerUser = useTrainingStore((state) => state.registerUser);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showiOSInstructions, setShowiOSInstructions] = useState(false);

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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
  const showInstallButton = installPrompt || (isiOS && !isStandalone);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else if (isiOS) {
      setShowiOSInstructions(true);
    }
  };

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
          {showInstallButton && (
            <button
              type="button"
              className="onboarding-install-btn"
              onClick={handleInstallClick}
            >
              <Smartphone size={20} />
              <span>Añadir al escritorio</span>
            </button>
          )}
        </form>
        {showiOSInstructions && (
          <div className="ios-install-banner" onClick={() => setShowiOSInstructions(false)}>
            <div className="ios-install-banner__content" onClick={(e) => e.stopPropagation()}>
              <h4>Instalar en tu iPhone / iPad</h4>
              <p>
                1. Pulsa el botón de <strong>Compartir</strong> en la barra de Safari (el icono de un cuadro con una flecha hacia arriba).
              </p>
              <p>
                2. Desplázate hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong>.
              </p>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowiOSInstructions(false)}
                style={{ minHeight: '36px', fontSize: '0.85rem', marginTop: '6px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}
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
