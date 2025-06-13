import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as nodemailer from "https://deno.land/x/nodemailer/mod.ts";

serve(async (req) => {
  const { to, subject, html } = await req.json()

  const transporter = nodemailer.createTransport({
    stream: true, // This is for testing, it logs the email to the console
  });

  await transporter.sendMail({
    from: '"Jogi AI" <noreply@jogi-ai.com>',
    to: to,
    subject: subject,
    html: html,
  });

  return new Response(
    JSON.stringify({ message: 'Email sent successfully (mocked)' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}) 