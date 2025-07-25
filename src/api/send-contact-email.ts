// Example API endpoint for sending contact emails
// This would typically be in your backend API (e.g., Supabase Edge Function, Express.js, etc.)

import { NextApiRequest, NextApiResponse } from 'next';

interface ContactEmailRequest {
  to: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  userInfo?: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyName?: string;
    userId?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: ContactEmailRequest = req.body;

    // Validate required fields
    if (!data.to || !data.subject || !data.message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Here you would integrate with your email service
    // Examples:
    
    // 1. Using nodemailer with SMTP
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      text: data.message,
      html: data.message.replace(/\n/g, '<br>'),
    });
    */

    // 2. Using SendGrid
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: data.to,
      from: process.env.FROM_EMAIL,
      subject: data.subject,
      text: data.message,
      html: data.message.replace(/\n/g, '<br>'),
    });
    */

    // 3. Using Mailgun
    /*
    const mailgun = require('mailgun-js')({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    });

    await mailgun.messages().send({
      from: process.env.FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      text: data.message,
    });
    */

    // For demonstration, we'll just log the email data
    console.log('Email would be sent:', {
      to: data.to,
      subject: data.subject,
      message: data.message,
      priority: data.priority,
      userInfo: data.userInfo,
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      emailId: `email_${Date.now()}` // Mock email ID
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
