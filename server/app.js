const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔄 Initialisation du serveur email Easy Bail...');
console.log(`🔧 PORT configuré: ${PORT}`);

// Configuration GoCardless avec votre token sandbox
const GOCARDLESS_API_URL = 'https://api-sandbox.gocardless.com/api/v2';
const GOCARDLESS_SANDBOX_TOKEN = 'sandbox_75cv_6zICBha7ZwMxaLso0yDEp5cWcJILEMJmTcQ';
const GOCARDLESS_SECRET_ID = 'e0baa8f7-a8bb-451a-90fd-2c25eefe3e5b';
const GOCARDLESS_SECRET_KEY = '1abb091813e84e92becaee723ceb8198d3f45bce21b5b76ea8c9711b32a6a5a57939f8f4740bad30f09e2c1c43f36b76256dd9ca80c864bc9976c2c60958e067';
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

// GoCardless API Proxy Endpoints

// Générer un token d'accès (utilise le token sandbox)
app.post('/api/gocardless/token', async (req, res) => {
  try {
    console.log('🔐 Retour du token sandbox GoCardless...');
    
    // Retourne directement le token sandbox
    const tokenData = {
      access: GOCARDLESS_SANDBOX_TOKEN,
      access_expires: 86400, // 24 heures
      refresh: null,
      refresh_expires: null
    };

    console.log('✅ Token sandbox retourné avec succès');
    res.json(tokenData);
  } catch (error) {
    console.error('❌ Erreur serveur génération token:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la génération du token',
      message: error.message
    });
  }
});

// Récupérer les institutions bancaires
app.get('/api/gocardless/institutions', async (req, res) => {
  try {
    const { country = 'FR' } = req.query;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token d\'autorisation manquant' });
    }

    console.log(`🏦 Récupération institutions pour ${country}...`);
    
    const response = await fetch(`${GOCARDLESS_API_URL}/institutions/?country=${country}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur récupération institutions:', data);
      return res.status(response.status).json({
        error: 'Erreur récupération institutions',
        details: data
      });
    }

    console.log(`✅ ${Array.isArray(data) ? data.length : 0} institutions récupérées`);
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur serveur récupération institutions:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération des institutions',
      message: error.message
    });
  }
});

// Créer un end-user agreement
app.post('/api/gocardless/agreements', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { institution_id, max_historical_days = 90, access_valid_for_days = 90 } = req.body;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token d\'autorisation manquant' });
    }

    console.log(`📝 Création agreement pour institution ${institution_id}...`);
    
    const response = await fetch(`${GOCARDLESS_API_URL}/agreements/enduser/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        institution_id,
        max_historical_days,
        access_valid_for_days,
        access_scope: ['balances', 'details', 'transactions']
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur création agreement:', data);
      return res.status(response.status).json({
        error: 'Erreur création agreement',
        details: data
      });
    }

    console.log('✅ Agreement créé avec succès');
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur serveur création agreement:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la création de l\'agreement',
      message: error.message
    });
  }
});

// Créer une requisition
app.post('/api/gocardless/requisitions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { agreement, redirect = 'http://localhost:5173/banking/callback', institution_id, user_language = 'FR' } = req.body;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token d\'autorisation manquant' });
    }

    console.log(`🔗 Création requisition pour agreement ${agreement}...`);
    
    const response = await fetch(`${GOCARDLESS_API_URL}/requisitions/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        redirect,
        institution_id,
        agreement,
        user_language
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur création requisition:', data);
      return res.status(response.status).json({
        error: 'Erreur création requisition',
        details: data
      });
    }

    console.log('✅ Requisition créée avec succès');
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur serveur création requisition:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la création de la requisition',
      message: error.message
    });
  }
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
