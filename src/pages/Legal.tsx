import { useState } from 'react';
import { ArrowLeft, Shield, FileText, Scale } from 'lucide-react';

interface LegalProps {
  onClose?: () => void;
}

export function Legal({ onClose }: LegalProps) {
  const [activeTab, setActiveTab] = useState<'aviso' | 'privacidad' | 'condiciones'>('condiciones');

  return (
    <div className="page page--legal" style={{ paddingBottom: '30px' }}>
      <header className="home-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onClose && (
            <button 
              onClick={onClose} 
              className="ghost-button" 
              style={{ minHeight: 'auto', padding: '8px', borderRadius: '50%' }}
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Documentación Legal</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cumplimiento con la legislación española</p>
          </div>
        </div>
      </header>

      <div className="legal-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`tab-button ${activeTab === 'condiciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('condiciones')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: activeTab === 'condiciones' ? 'var(--primary-color)' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <FileText size={16} />
          Condiciones
        </button>
        <button
          className={`tab-button ${activeTab === 'privacidad' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacidad')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: activeTab === 'privacidad' ? 'var(--primary-color)' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <Shield size={16} />
          Privacidad
        </button>
        <button
          className={`tab-button ${activeTab === 'aviso' ? 'active' : ''}`}
          onClick={() => setActiveTab('aviso')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: activeTab === 'aviso' ? 'var(--primary-color)' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <Scale size={16} />
          Aviso Legal
        </button>
      </div>

      <div 
        className="legal-content-card" 
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          maxHeight: '65vh',
          overflowY: 'auto',
          color: '#d1d5db'
        }}
      >
        {activeTab === 'condiciones' && (
          <div>
            <h3 style={{ color: 'white', marginTop: 0 }}>Condiciones Generales de Contratación</h3>
            <p><strong>Última actualización:</strong> Junio 2026</p>
            
            <h4>1. Objeto y Descripción del Servicio</h4>
            <p>Las presentes Condiciones regulan la contratación del servicio de acceso a la aplicación <strong>TIRO22</strong>, una plataforma móvil (PWA) de registro, análisis y seguimiento de entrenamientos de tiro deportivo con armas de calibre .22 LR.</p>
            
            <h4>2. Tarifas, Facturación y Periodo de Prueba</h4>
            <ul>
              <li><strong>Prueba Gratuita:</strong> El usuario dispone de un periodo de prueba gratuito de 15 días tras el registro. Para acceder a dicho periodo, es obligatorio facilitar los datos de una tarjeta de crédito o débito válida. No se realizará ningún cargo durante estos 15 días.</li>
              <li><strong>Suscripción Mensual:</strong> Transcurrido el periodo de prueba de 15 días, se procederá al cobro recurrente mensual de <strong>1,50 € (IVA incluido)</strong>. El cobro se realizará de forma automática en la tarjeta facilitada, al inicio de cada periodo de facturación mensual.</li>
              <li><strong>Pasarela de Pago:</strong> Los pagos son procesados de forma segura a través de la plataforma <strong>Stripe</strong>. TIRO22 no almacena ni tiene acceso a los datos completos de su tarjeta de crédito.</li>
            </ul>

            <h4>3. Exclusión del Derecho de Desistimiento</h4>
            <p style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', padding: '10px', borderRadius: '4px', color: '#fca5a5' }}>
              <strong>INFORMACIÓN IMPORTANTE:</strong> De conformidad con el <strong>artículo 103.m) del Real Decreto Legislativo 1/2007</strong>, de 16 de noviembre, por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios (TRLGDCU), el derecho de desistimiento no será aplicable a los contratos de suministro de contenido digital que no se preste en un soporte material, cuando la ejecución haya comenzado con el previo consentimiento expreso del usuario y con el conocimiento por su parte de que pierde consecuentemente su derecho de desistimiento. Al registrarse e iniciar el periodo de prueba y uso de la aplicación, el usuario consiente de forma expresa e inequívoca la ejecución inmediata del servicio y asume la pérdida de su derecho de desistimiento.
            </p>

            <h4>4. Duración y Cancelación</h4>
            <p>El contrato tiene una duración mensual prorrogable automáticamente. El usuario podrá cancelar su suscripción en cualquier momento y sin penalización alguna a través de la sección de <strong>Ajustes</strong> dentro de la aplicación, pulsando en <strong>"Gestionar Suscripción"</strong>, lo cual le redirigirá de forma segura al Portal de Clientes de Stripe. La cancelación será efectiva al finalizar el periodo mensual en curso, manteniendo el acceso hasta dicha fecha.</p>

            <h4>5. Ley Aplicable y Jurisdicción</h4>
            <p>Estas condiciones se rigen por la ley española. Para la resolución de cualquier conflicto derivado de las mismas, las partes se someten a los juzgados y tribunales del domicilio del consumidor.</p>
          </div>
        )}

        {activeTab === 'privacidad' && (
          <div>
            <h3 style={{ color: 'white', marginTop: 0 }}>Política de Privacidad (RGPD)</h3>
            <p><strong>Última actualización:</strong> Junio 2026</p>
            
            <h4>1. Responsable del Tratamiento</h4>
            <p>El responsable del tratamiento de sus datos personales es el titular de la aplicación TIRO22, gestionada por <strong>Agencia Pixer</strong>, con correo electrónico de contacto: <a href="mailto:contacto@agenciapixer.es" style={{ color: 'var(--primary-color)' }}>contacto@agenciapixer.es</a>.</p>
            
            <h4>2. Datos Personales que Recopilamos</h4>
            <p>Tratamos los siguientes datos para la prestación del servicio:</p>
            <ul>
              <li><strong>Datos de Identificación y Contacto:</strong> Nombre y dirección de correo electrónico.</li>
              <li><strong>Datos de Uso de la Aplicación:</strong> Sesiones de tiro (tiradas), tandas, puntuaciones, fechas y datos de inventario de armas (marca, modelo, calibre) registrados voluntariamente por el usuario.</li>
              <li><strong>Datos de Pago:</strong> Los datos de tarjeta de crédito son recopilados directamente por <strong>Stripe Inc.</strong> (cumpliendo con la normativa PCI-DSS). Nosotros solo recibimos de Stripe un token identificativo (fingerprint) para evitar fraudes, la marca de la tarjeta (Visa, Mastercard, etc.), los últimos 4 dígitos y el país emisor.</li>
            </ul>

            <h4>3. Finalidad del Tratamiento</h4>
            <p>Sus datos son tratados para:</p>
            <ul>
              <li>Gestionar su cuenta de usuario y permitirle el acceso a la aplicación mediante códigos OTP enviados a su correo.</li>
              <li>Prestar el servicio de registro y analíticas de sus entrenamientos.</li>
              <li>Gestionar la suscripción de pago y la facturación a través de Stripe.</li>
              <li>Enviarle notificaciones transaccionales, como el aviso de finalización de su prueba gratuita 3 días antes de que ocurra.</li>
            </ul>

            <h4>4. Conservación de los Datos</h4>
            <p>Los datos personales se conservarán mientras se mantenga la relación contractual y el usuario no solicite su supresión. Los datos contables y de facturación se conservarán durante los plazos legales aplicables (6 años según el Código de Comercio de España).</p>

            <h4>5. Sus Derechos</h4>
            <p>Usted puede ejercitar sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición enviando un correo electrónico a <a href="mailto:contacto@agenciapixer.es" style={{ color: 'var(--primary-color)' }}>contacto@agenciapixer.es</a>, acreditando su identidad. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) si considera que se han vulnerado sus derechos.</p>
          </div>
        )}

        {activeTab === 'aviso' && (
          <div>
            <h3 style={{ color: 'white', marginTop: 0 }}>Aviso Legal (LSSI-CE)</h3>
            <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se exponen los datos identificativos del titular de este sitio web y aplicación:</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', color: 'white' }}>Denominación Social:</td>
                  <td style={{ padding: '8px 0' }}>Agencia Pixer (Pixer Mkt)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', color: 'white' }}>Domicilio Social:</td>
                  <td style={{ padding: '8px 0' }}>España</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', color: 'white' }}>Email de Contacto:</td>
                  <td style={{ padding: '8px 0' }}><a href="mailto:contacto@agenciapixer.es" style={{ color: 'var(--primary-color)' }}>contacto@agenciapixer.es</a></td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', color: 'white' }}>Actividad:</td>
                  <td style={{ padding: '8px 0' }}>Servicios de desarrollo de software y marketing digital</td>
                </tr>
              </tbody>
            </table>

            <h4>Condiciones de Uso de la Aplicación</h4>
            <p>El acceso y/o uso de esta aplicación atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. El usuario asume la responsabilidad del uso del portal. Dicha responsabilidad se extiende al registro que fuese necesario para acceder a determinados servicios o contenidos.</p>
            <p>El titular se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados.</p>
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="primary-button"
          style={{ marginTop: '20px', width: '100%', minHeight: '44px' }}
        >
          Volver
        </button>
      )}
    </div>
  );
}
