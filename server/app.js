const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔄 Initialisation du serveur email Easy Bail...');
console.log(`🔧 PORT configuré: ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('📡 Test endpoint appelé');
  res.json({ 
    message: 'Serveur email OVH Easy Bail opérationnel',
    timestamp: new Date().toISOString(),
    config: {
      port: PORT,
      nodeVersion: process.version
    }
  });
});

// Endpoint principal pour l'envoi d'emails avec configuration dynamique
app.post('/api/send-email', async (req, res) => {
  try {
    const { config, emailOptions } = req.body;
    console.log('📧 Requête d\'envoi d\'email reçue');

    // Validation des données requises
    if (!config || !emailOptions) {
      return res.status(400).json({
        success: false,
        error: "Configuration et options d'email requises"
      });
    }

    // Validation de la configuration SMTP
    if (!config.host || !config.port || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        error: "Configuration SMTP incomplète (host, port, username, password requis)"
      });
    }

    // Validation des options d'email
    if (!emailOptions.to || !emailOptions.subject || (!emailOptions.text && !emailOptions.html)) {
      return res.status(400).json({
        success: false,
        error: "Options d'email incomplètes (to, subject, et text ou html requis)"
      });
    }

    console.log(`📧 Envoi d'email via ${config.host}:${config.port}`);
    console.log(`📤 De: ${emailOptions.from} → À: ${emailOptions.to}`);
    console.log(`📝 Sujet: ${emailOptions.subject}`);

    // Configuration du transporteur avec les paramètres reçus
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure, // true pour 465, false pour autres ports
      auth: {
        user: config.username,
        pass: config.password,
      },
      // Options supplémentaires pour OVH
      tls: {
        rejectUnauthorized: false
      }
    });

    // Vérification de la connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée');

    // Préparation du message
    const mailOptions = {
      from: emailOptions.from,
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
      html: emailOptions.html,
      replyTo: emailOptions.replyTo
    };

    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email envoyé avec succès:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email envoyé avec succès'
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error.message);
    
    // Messages d'erreur spécifiques pour OVH
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = "Authentification SMTP échouée. Vérifiez vos identifiants OVH.";
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = "Connexion refusée au serveur SMTP. Vérifiez l'adresse et le port.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "Timeout de connexion. Vérifiez votre connexion internet et les paramètres firewall.";
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      code: error.code || 'UNKNOWN'
    });
  }
});

// Test SMTP avec configuration fournie
app.post('/api/test-smtp', async (req, res) => {
  try {
    const { config } = req.body;
    console.log('🔧 Test de configuration SMTP demandé');

    if (!config || !config.host || !config.port || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        error: 'Configuration SMTP incomplète'
      });
    }

    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log('✅ Test SMTP réussi');

    res.json({
      success: true,
      message: 'Connexion SMTP testée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur test SMTP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Démarrage du serveur
console.log('🔄 Tentative de démarrage du serveur...');

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur email Easy Bail démarré sur http://localhost:${PORT}`);
  console.log(`📧 Prêt pour l'envoi d'emails via configuration admin`);
  console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  console.error('❌ Erreur lors du démarrage du serveur:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} déjà utilisé. Essayez un autre port.`);
  }
  process.exit(1);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

module.exports = app;
