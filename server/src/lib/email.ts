import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'mail.agenciapixer.es';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || `"Tiro22" <no-reply@agenciapixer.es>`;

// Creamos el transportador de correo si las credenciales están configuradas
const createTransporter = () => {
  if (!smtpUser || !smtpPass) {
    console.warn('Warning: SMTP_USER or SMTP_PASS is not configured. Emails will be logged to console instead.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Añadimos TLS por seguridad en caso de certificados auto-firmados
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.log('--- EMAIL SIMULATION ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log('------------------------');
    return;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
}

/**
 * Envía el correo electrónico con el código OTP de 6 dígitos
 */
export async function sendOtpEmail(email: string, code: string) {
  const subject = 'Código de acceso - TIRO22';
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">TIRO<span style="color: #10b981;">22</span></h2>
      <p>Hola,</p>
      <p>Has solicitado iniciar sesión en TIRO22. Utiliza el siguiente código de un solo uso (OTP) para acceder a tu cuenta:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0; color: #1f2937;">
        ${code}
      </div>
      <p style="font-size: 12px; color: #6b7280;">Este código es válido por 10 minutos. Si no has solicitado este código, puedes ignorar este correo de forma segura.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} TIRO22. Todos los derechos reservados.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
}

/**
 * Envía el aviso de que el periodo de prueba de 15 días está por finalizar (3 días antes)
 */
export async function sendTrialEndingEmail(email: string, trialEndDate: Date, portalUrl: string) {
  const formattedDate = trialEndDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = 'Tu periodo de prueba de TIRO22 está por finalizar';
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">TIRO<span style="color: #10b981;">22</span></h2>
      <p>Hola,</p>
      <p>Te escribimos para recordarte que tu periodo de prueba gratuito de 15 días en TIRO22 finalizará el próximo <strong>${formattedDate}</strong>.</p>
      <p>A partir de esa fecha, se procederá al cobro de la suscripción mensual por un importe de <strong>1,50 €</strong>.</p>
      <p>Si estás disfrutando de la aplicación y deseas continuar registrando tus entrenamientos, no tienes que hacer nada; la suscripción se renovará automáticamente.</p>
      <p><strong>¿Deseas cancelar?</strong> Si no deseas continuar y quieres evitar el cobro, puedes cancelar tu suscripción de forma sencilla en cualquier momento antes del cobro desde tu panel de ajustes en la aplicación o haciendo clic en el siguiente botón:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
          Gestionar o Cancelar Suscripción
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">Si tienes alguna duda o problema, por favor responde a este correo y te ayudaremos.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} TIRO22. Todos los derechos reservados.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
}
