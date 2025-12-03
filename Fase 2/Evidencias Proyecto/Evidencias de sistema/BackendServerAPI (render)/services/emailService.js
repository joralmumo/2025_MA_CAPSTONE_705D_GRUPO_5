const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetCode = async (nombre, correo, codigo) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'InstaCotiza <ayuda@noreply.instacotiza.com>',
      to: [correo],
      subject: 'Código de Recuperación de Contraseña',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #00d289ff 0%, #784ba2ff 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .code-box {
                background: white;
                border: 2px dashed #00d289ff;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 8px;
              }
              .code {
                font-size: 32px;
                font-weight: bold;
                color: #00d289ff;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 15px 0;
                border-radius: 4px;
                font-size: 14px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>Recibimos una solicitud para restablecer tu contraseña en InstaCotiza.</p>
              <p>Tu código de verificación es:</p>
              
              <div class="code-box">
                <div class="code">${codigo}</div>
              </div>
              
              <div class="warning">
                ⏱️ <strong>Este código expira en 15 minutos.</strong>
              </div>
              
              <p>Ingresa este código en la página de recuperación de contraseña para continuar.</p>
              
              <p><strong>¿No solicitaste este cambio?</strong><br>
              Si no fuiste tú, ignora este correo. Tu contraseña permanecerá segura.</p>
            </div>
            <div class="footer">
              <p>© 2025 InstaCotiza. Todos los derechos reservados.</p>
              <p>www.instacotiza.com</p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error enviando código de recuperación:', error);
      return { success: false, error };
    }

    console.log('Código de recuperación enviado a:', correo);
    return { success: true, data };
  } catch (error) {
    console.error('Error en sendPasswordResetCode:', error);
    return { success: false, error };
  }
};




const sendWelcomeEmail = async (nombre, correo) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'InstaCotiza <bienvenida@noreply.instacotiza.com>',
      to: [correo],
      subject: '¡Bienvenido a InstaCotiza!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #00d289ff 0%, #784ba2ff 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #00d289ff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>¡Bienvenido a InstaCotiza!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>¡Gracias por registrarte en InstaCotiza!</p>
              <p>Con tu cuenta ahora puedes:</p>
              <ul>
                <li>Cotizar tus trabajos rápidamente.</li>
                <li>Almacenar tus plantillas de cotización en la nube.</li>
                <li>Generar documentos de cotización en segundos.</li>
              </ul>
              <p style="text-align: center;">
                <a href="https://instacotiza.com/login" class="button">Comenzar Ahora</a>
              </p>
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Éxito en tus trabajos!</p>
            </div>
            <div class="footer">
              <p>© 2025 InstaCotiza by Team Dynamite. Todos los derechos reservados.</p>
              <p>www.instacotiza.com</p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error enviando email de bienvenida:', error);
      return { success: false, error };
    }

    console.log('Email de bienvenida enviado a:', correo);
    return { success: true, data };
  } catch (error) {
    console.error('Error en sendWelcomeEmail:', error);
    return { success: false, error };
  }
};

module.exports = { sendWelcomeEmail, sendPasswordResetCode };
