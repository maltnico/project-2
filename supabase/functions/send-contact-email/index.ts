// Supabase Edge Function example for sending contact emails
// This would be placed in supabase/functions/send-contact-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data: ContactEmailRequest = await req.json()

    // Validate required fields
    if (!data.to || !data.subject || !data.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Here you would integrate with your email service
    // For example, using Resend API:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'support@easybail.pro',
        to: [data.to],
        subject: data.subject,
        html: data.message.replace(/\n/g, '<br>'),
      }),
    })

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`)
    }
    */

    // For demonstration, we'll just log the email data
    console.log('Email would be sent:', {
      to: data.to,
      subject: data.subject,
      message: data.message,
      priority: data.priority,
      userInfo: data.userInfo,
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: `email_${Date.now()}`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
