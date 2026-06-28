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
import { Legal } from './pages/Legal';
import { useTrainingStore } from './store/useTrainingStore';
import { translations } from './data/translations';
import { Smartphone, Mail, Lock, User as UserIcon, CreditCard, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Inicializar Stripe con la clave pública de las variables de entorno o una de prueba
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51PZ...placeholder');

export default function App() {
  const loadFromApi = useTrainingStore((state) => state.loadFromApi);
  const userEmail = useTrainingStore((state) => state.userEmail);
  const subscriptionStatus = useTrainingStore((state) => state.subscriptionStatus);
  const logout = useTrainingStore((state) => state.logout);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'register'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLegal, setShowLegal] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    if (userEmail && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')) {
      loadFromApi();
    }
  }, [loadFromApi, userEmail, subscriptionStatus]);

  // Si no está logueado, mostramos el onboarding envuelto en el proveedor de Stripe
  if (!userEmail) {
    return (
      <Elements stripe={stripePromise}>
        <OnboardingFlow
          email={email}
          setEmail={setEmail}
          step={step}
          setStep={setStep}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          errorMsg={errorMsg}
          setErrorMsg={setErrorMsg}
          showLegal={showLegal}
          setShowLegal={setShowLegal}
          t={t}
        />
      </Elements>
    );
  }

  // Si el usuario está logueado pero su suscripción NO está activa ni en periodo de prueba
  const isSubscriptionActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  if (!isSubscriptionActive) {
    const handleReactivate = async () => {
      setIsPortalLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
        const response = await fetch(`${apiUrl}/create-portal-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.url;
        } else {
          setErrorMsg('No se pudo abrir el portal de facturación. Contacta con soporte.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error de conexión al portal.');
      } finally {
        setIsPortalLoading(false);
      }
    };

    return (
      <div className="onboarding-screen">
        <div className="onboarding-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div className="onboarding-logo" style={{ marginBottom: '20px' }}>
            <div className="header-logo-container" style={{ marginBottom: '10px' }}>
              <img
                src={`${import.meta.env.BASE_URL}logo-pixer.png`}
                alt="Agencia Pixer"
                className="header-logo"
                style={{ width: '80px', height: '80px', margin: '0 auto' }}
              />
            </div>
            <h1 style={{ color: 'var(--red)' }}>Suscripción Inactiva</h1>
            <p style={{ marginTop: '10px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Tu suscripción de TIRO22 se encuentra en estado: <strong style={{ textTransform: 'uppercase', color: 'var(--red)' }}>{subscriptionStatus || 'Inexistente'}</strong>.
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              Para seguir registrando tus tiradas y acceder a tus estadísticas, reactiva tu suscripción por solo 1,50 € al mes.
            </p>
          </div>

          {errorMsg && (
            <div className="error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          <button 
            className="primary-button" 
            onClick={handleReactivate}
            disabled={isPortalLoading}
            style={{ marginBottom: '12px' }}
          >
            {isPortalLoading ? 'Cargando portal...' : 'Reactivar Suscripción'}
          </button>

          <button 
            className="ghost-button" 
            onClick={logout}
            style={{ 
              width: '100%', 
              minHeight: '44px', 
              color: 'var(--red)', 
              borderColor: 'rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Flujo normal de la app para usuarios con suscripción activa
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

// --- COMPONENTE INTERNO DEL FLUJO DE ONBOARDING ---

interface OnboardingFlowProps {
  email: string;
  setEmail: (val: string) => void;
  step: 'email' | 'otp' | 'register';
  setStep: (val: any) => void;
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  errorMsg: string;
  setErrorMsg: (val: string) => void;
  showLegal: boolean;
  setShowLegal: (val: boolean) => void;
  t: any;
}

function OnboardingFlow({
  email,
  setEmail,
  step,
  setStep,
  isSubmitting,
  setIsSubmitting,
  errorMsg,
  setErrorMsg,
  showLegal,
  setShowLegal,
  t
}: OnboardingFlowProps) {
  const sendOtp = useTrainingStore((state) => state.sendOtp);
  const verifyOtp = useTrainingStore((state) => state.verifyOtp);
  const registerSubscription = useTrainingStore((state) => state.registerSubscription);

  const [otpToken, setOtpToken] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<{
    monthly: { priceId: string; amount: number; currency: string } | null;
    yearly: { priceId: string; amount: number; currency: string } | null;
  }>({ monthly: null, yearly: null });

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
        const response = await fetch(`${apiUrl}/stripe-prices`);
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  if (showLegal) {
    return <Legal onClose={() => setShowLegal(false)} />;
  }

  // 1. Paso de email: Enviar OTP y decidir si es Login o Registro
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await sendOtp(cleanEmail);
      if (res && res.requiresRegistration) {
        setStep('register');
      } else {
        setStep('otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Paso de OTP: Verificar login
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.length !== 6) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await verifyOtp(email, otpToken);
      if (res.requiresRegistration) {
        setStep('register');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Código incorrecto o expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Paso de Registro + Suscripción (Stripe)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setErrorMsg('Stripe no está cargado. Por favor, recarga la página.');
      return;
    }
    if (!legalAccepted) {
      setErrorMsg('Debes aceptar las condiciones legales para continuar.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Crear PaymentMethod en Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email,
          name: registerName,
        },
      });

      if (error) {
        throw new Error(error.message || 'Error en los datos de la tarjeta.');
      }

      // Enviar al backend para crear la suscripción
      const priceId = selectedPlan === 'monthly' ? plans.monthly?.priceId : plans.yearly?.priceId;
      if (!priceId) {
        throw new Error('No se ha podido cargar el plan de suscripción seleccionado.');
      }
      const res = await registerSubscription(email, registerName, paymentMethod.id, priceId);
      
      if (!res.success) {
        if (res.error === 'TRIAL_ABUSE') {
          throw new Error(res.message);
        } else {
          throw new Error(res.message || 'No se pudo completar el registro.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-screen">
      {step === 'email' && (
        <form className="onboarding-card" onSubmit={handleEmailSubmit}>
          <div className="onboarding-logo">
            <div className="header-logo-container" style={{ marginBottom: '10px' }}>
              <img
                src={`${import.meta.env.BASE_URL}logo-pixer.png`}
                alt="Agencia Pixer"
                className="header-logo"
                style={{ width: '85px', height: '85px', margin: '0 auto' }}
              />
            </div>
            <h1>TIRO<span>22</span></h1>
            <p>Introduce tu correo para iniciar sesión o registrarte con 15 días de prueba gratuita.</p>
          </div>

          {errorMsg && <div className="error-banner" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>{errorMsg}</div>}

          <label className="field">
            <span>Correo electrónico</span>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                style={{ paddingLeft: '40px' }}
                autoFocus
              />
            </div>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting || !email.trim()}>
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={18} className="animate-spin" /> Enviando código...
              </span>
            ) : 'Continuar'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form className="onboarding-card" onSubmit={handleOtpSubmit}>
          <div className="onboarding-logo">
            <h1>Código de Acceso</h1>
            <p>Hemos enviado un código OTP de 6 dígitos a su correo <strong style={{ color: 'var(--green)' }}>{email}</strong>.</p>
          </div>

          {errorMsg && <div className="error-banner" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>{errorMsg}</div>}

          <label className="field">
            <span>Introduce el código OTP</span>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                required
                disabled={isSubmitting}
                style={{ paddingLeft: '40px', letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center' }}
                autoFocus
              />
            </div>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting || otpToken.length !== 6}>
            {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
          </button>

          <button 
            type="button" 
            className="ghost-button" 
            onClick={() => setStep('email')} 
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '10px', minHeight: '40px' }}
          >
            Volver a introducir email
          </button>
        </form>
      )}

      {step === 'register' && (
        <form className="onboarding-card" onSubmit={handleRegisterSubmit} style={{ maxWidth: '440px' }}>
          <div className="onboarding-logo">
            <h1>Completa tu Registro</h1>
            <p>Regístrate y comienza tu prueba de 15 días gratis. Luego, selecciona tu plan.</p>
          </div>

          {errorMsg && <div className="error-banner" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>{errorMsg}</div>}

          {/* Selector de Planes */}
          <div className="field" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Elige tu plan de suscripción</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div 
                onClick={() => setSelectedPlan('monthly')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedPlan === 'monthly' ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedPlan === 'monthly' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: selectedPlan === 'monthly' ? 'var(--green)' : '#fff' }}>Mensual</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '8px 0' }}>
                  {plans.monthly ? `${plans.monthly.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '1,50 €'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Al mes (15 días gratis)</div>
              </div>
              <div 
                onClick={() => setSelectedPlan('yearly')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedPlan === 'yearly' ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedPlan === 'yearly' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: selectedPlan === 'yearly' ? 'var(--green)' : '#fff' }}>Anual</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '8px 0' }}>
                  {plans.yearly ? `${plans.yearly.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '15,00 €'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Al año (15 días gratis)</div>
              </div>
            </div>
          </div>

          <label className="field">
            <span>Nombre completo</span>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tu nombre"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
                disabled={isSubmitting}
                style={{ paddingLeft: '40px' }}
                autoFocus
              />
            </div>
          </label>

          <div className="field" style={{ marginBottom: '20px' }}>
            <span>Tarjeta de crédito o débito</span>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              padding: '14px',
              boxSizing: 'border-box'
            }}>
              <CardElement options={{
                style: {
                  base: {
                    color: '#ffffff',
                    fontFamily: 'Outfit, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder': {
                      color: '#9ca3af'
                    }
                  },
                  invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444'
                  }
                }
              }} />
            </div>
          </div>

          <label className="checkbox-field" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '15px 0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={legalAccepted}
              onChange={(e) => setLegalAccepted(e.target.checked)}
              required
              disabled={isSubmitting}
              style={{ marginTop: '3px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Acepto el <span onClick={(e) => { e.preventDefault(); setShowLegal(true); }} style={{ color: 'var(--green)', textDecoration: 'underline' }}>Aviso Legal, la Política de Privacidad y las Condiciones de Contratación</span>, consintiendo expresamente perder el derecho de desistimiento al comenzar el servicio inmediato.
            </span>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting || !registerName.trim() || !legalAccepted}>
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={18} className="animate-spin" /> Creando suscripción...
              </span>
            ) : 'Iniciar prueba gratuita de 15 días'}
          </button>

          <button 
            type="button" 
            className="ghost-button" 
            onClick={() => setStep('email')} 
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '10px', minHeight: '40px' }}
          >
            Atrás
          </button>
        </form>
      )}
    </div>
  );
}
