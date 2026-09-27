import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// The contact form calls this right after saving the message, so anything older is a replay.
const MAX_MESSAGE_AGE_MS = 15 * 60 * 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max requests per window
const RATE_WINDOW_MS = 60000; // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

// Escape HTML to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                   req.headers.get("cf-connecting-ip") ||
                   "unknown";
  if (isRateLimited(clientIP)) {
    console.log("Rate limit exceeded for IP:", clientIP);
    return json({ error: "Too many requests. Please try again later." }, 429);
  }

  try {
    // Only the message id is taken from the request. The email is built from the database,
    // so callers can't send made-up content to the admin.
    const { contactId } = await req.json().catch(() => ({}));
    if (typeof contactId !== "string" || !UUID_PATTERN.test(contactId)) {
      return json({ error: "A valid contactId is required" }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: message } = await supabase
      .from("contact_submissions")
      .select("id, name, email, subject, message, created_at")
      .eq("id", contactId)
      .maybeSingle();

    const isFresh = message && Date.now() - new Date(message.created_at).getTime() < MAX_MESSAGE_AGE_MS;
    if (!message || !isFresh) {
      return json({ error: "No new message with that id" }, 404);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (!resendApiKey || !adminEmail) {
      console.error("RESEND_API_KEY or ADMIN_EMAIL not configured");
      return json({ error: "Email is not configured" }, 500);
    }

    console.log("Sending contact notification for message:", message.id);

    const safeName = escapeHtml(message.name);
    const safeEmail = escapeHtml(message.email);
    const safeSubject = escapeHtml(message.subject || "(no subject)");
    const safeMessage = escapeHtml(message.message).replace(/\n/g, "<br>");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") || "Contact Form <onboarding@resend.dev>",
        to: [adminEmail],
        // Replying to the notification goes straight to the person who wrote in
        reply_to: message.email,
        subject: `New message from ${message.name}${message.subject ? `: ${message.subject}` : ""}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #16150f;">
            <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">New message from the contact form</h1>
            <table style="width: 100%; margin-bottom: 16px; font-size: 14px;">
              <tr>
                <td style="color: #6b6861; padding: 4px 0; width: 80px;">From</td>
                <td>${safeName} &lt;<a href="mailto:${safeEmail}" style="color: #16150f;">${safeEmail}</a>&gt;</td>
              </tr>
              <tr>
                <td style="color: #6b6861; padding: 4px 0;">Subject</td>
                <td>${safeSubject}</td>
              </tr>
            </table>
            <div style="background: #f7f5f1; border-radius: 8px; padding: 16px; line-height: 1.6; font-size: 15px;">
              ${safeMessage}
            </div>
            <p style="color: #6b6861; font-size: 13px; margin-top: 20px;">
              Reply to this email to answer ${safeName} directly. The message is also saved in the admin panel.
            </p>
          </div>
        `,
      }),
    });

    const result = await emailResponse.json();
    console.log("Resend API response:", result);

    if (!emailResponse.ok) {
      console.error("Email send failed:", result);
      return json({ error: "Failed to send email" }, 500);
    }

    return json({ success: true });
  } catch (error: unknown) {
    console.error("Error in notify-contact function:", error);
    return json({ error: "An error occurred processing your request" }, 500);
  }
});
