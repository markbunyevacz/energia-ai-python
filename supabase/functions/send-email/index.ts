import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as nodemailer from "https://deno.land/x/nodemailer/mod.ts";

/**
 * @function serve
 * @description Supabase Edge Function for sending emails.
 * This function receives a request with recipient, subject, and HTML content,
 * and sends an email using a configured SMTP provider.
 *
 * @param {Request} req The incoming HTTP request.
 * @returns {Response} A response indicating success or failure.
 *
 * @author Jogi AI
 * @version 2.0.0
 */
serve(async (req) => {
  try {
    const { to, subject, html } = await req.json();

    // Securely retrieve SMTP configuration from environment variables
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromAddress = Deno.env.get("SMTP_FROM_ADDRESS") || '"Jogi AI" <noreply@jogi-ai.com>';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error("SMTP configuration is missing from environment variables.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Production-ready SMTP transport configuration
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send the email with the provided details
    await transporter.sendMail({
      from: fromAddress,
      to: to,
      subject: subject,
      html: html,
    });

    return new Response(
      JSON.stringify({ message: 'Email sent successfully.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error("Failed to send email:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email.', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}); 
