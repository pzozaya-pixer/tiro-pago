import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { NewRound } from './pages/NewRound';
import { NewTirada } from './pages/NewTirada';
import { Tiradas } from './pages/Tiradas';
import { useTrainingStore } from './store/useTrainingStore';

export default function App() {
  const loadFromApi = useTrainingStore((state) => state.loadFromApi);
  const userPhone = useTrainingStore((state) => state.userPhone);
  const registerUser = useTrainingStore((state) => state.registerUser);

  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Carga inicial y sincronización de datos de la API solo si hay usuario registrado
    if (userPhone) {
      loadFromApi();
    }

    const handleOnline = () => {
      if (userPhone) {
        loadFromApi();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [loadFromApi, userPhone]);

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) return;
    setIsSubmitting(true);
    try {
      await registerUser(cleanPhone);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si no hay teléfono registrado, bloqueamos la app con el onboarding
  if (!userPhone) {
    return (
      <div className="onboarding-screen">
        <form className="onboarding-card" onSubmit={handleSubmitPhone}>
          <div className="onboarding-logo">
            <div className="header-logo-container" style={{ marginBottom: '10px' }}>
              <img
                src={`${import.meta.env.BASE_URL}logo-pixer.png`}
                alt="Agencia Pixer"
                className="header-logo"
                style={{ width: '80px', height: '80px', margin: '0 auto' }}
              />
            </div>
            <h1>Tiro<span>22</span></h1>
            <p>Registra tu número de teléfono para comenzar a guardar tus tiradas y tandas de forma segura.</p>
          </div>
          <label className="field">
            <span>Número de Teléfono</span>
            <input
              type="tel"
              placeholder="Ej. 600000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={isSubmitting}
              autoFocus
            />
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting || !phone.trim()}>
            {isSubmitting ? 'Registrando...' : 'Comenzar'}
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
        <Route path="/armas" element={<Tiradas mode="weapons" />} />
        <Route path="/ajustes" element={<Tiradas mode="settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

