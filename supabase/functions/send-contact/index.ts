import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max requests per window
const RATE_WINDOW_MS = 60000; // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// Escape HTML to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
  
  if (isRateLimited(clientIP)) {
    console.log("Rate limit exceeded for IP:", clientIP);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();

    console.log("Sending contact email from:", name, email);

    // Validate inputs with length limits
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enforce max length limits
    if (name.length > 100 || email.length > 255 || message.length > 5000 || (subject && subject.length > 200)) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!resendApiKey || !adminEmail) {
      console.error("Missing RESEND_API_KEY or ADMIN_EMAIL");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Escape HTML entities for safe email rendering
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = subject ? escapeHtml(subject) : '';
    const safeMessage = escapeHtml(message);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contact Form <onboarding@resend.dev>",
        to: [adminEmail],
        reply_to: email,
        subject: subject || `Contact from ${name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">New Contact Message</h1>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #888; padding: 8px 0; width: 80px;">From:</td>
                  <td style="color: #333; font-weight: 500;">${safeName}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 8px 0;">Email:</td>
                  <td><a href="mailto:${safeEmail}" style="color: #6366f1;">${safeEmail}</a></td>
                </tr>
                ${safeSubject ? `
                <tr>
                  <td style="color: #888; padding: 8px 0;">Subject:</td>
                  <td style="color: #333;">${safeSubject}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Message:</h3>
              <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              You can reply directly to this email to respond to ${safeName}.
            </p>
          </div>
        `,
      }),
    });

    const result = await emailResponse.json();
    console.log("Resend API response:", result);

    if (!emailResponse.ok) {
      console.error("Email send failed:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
