import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The site calls this right after inserting the project, so anything older is a replay.
const MAX_SUBMISSION_AGE_MS = 15 * 60 * 1000;

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
  // Handle CORS preflight requests
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
    // Only the project id is taken from the request. The email is built from the database,
    // so callers can't send made-up content to the admin.
    const { projectId } = await req.json().catch(() => ({}));
    if (typeof projectId !== "string" || !UUID_PATTERN.test(projectId)) {
      return new Response(
        JSON.stringify({ error: "A valid projectId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, url, category, image_url, status, created_at")
      .eq("id", projectId)
      .maybeSingle();

    const isFresh = project && Date.now() - new Date(project.created_at).getTime() < MAX_SUBMISSION_AGE_MS;
    if (!project || project.status !== "pending" || !isFresh) {
      return new Response(
        JSON.stringify({ error: "No new submission with that id" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: submission } = await supabase
      .from("project_submissions")
      .select("submitter_email")
      .eq("project_id", projectId)
      .maybeSingle();

    console.log("Sending notification email for project:", project.id);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!adminEmail) {
      console.error("ADMIN_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Admin email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Escape HTML entities for safe email rendering
    const safeName = escapeHtml(project.name);
    const safeDescription = escapeHtml(project.description || '');
    const safeUrl = escapeHtml(project.url || '');
    const safeCategory = escapeHtml(project.category || '');
    const safeId = escapeHtml(project.id);
    const safeEmail = escapeHtml(submission?.submitter_email || 'Not provided');
    const safeImageUrl = escapeHtml(project.image_url || '');

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") || "Project Submissions <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New Project Submission: ${project.name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">New Project Submission</h1>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #6366f1; margin-top: 0;">${safeName}</h2>
              <p style="color: #666; line-height: 1.6;">${safeDescription}</p>
              
              <table style="width: 100%; margin-top: 15px;">
                <tr>
                  <td style="color: #888; padding: 5px 0;">Category:</td>
                  <td style="color: #333; font-weight: 500;">${safeCategory}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 5px 0;">URL:</td>
                  <td><a href="${safeUrl}" style="color: #6366f1;">${safeUrl}</a></td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 5px 0;">Submitter Email:</td>
                  <td style="color: #333; font-weight: 500;">${safeEmail}</td>
                </tr>
                ${safeImageUrl ? `<tr>
                  <td style="color: #888; padding: 5px 0;">Image:</td>
                  <td><a href="${safeImageUrl}" style="color: #6366f1;">View Image</a></td>
                </tr>` : ''}
              </table>
            </div>
            
            <p style="color: #666; margin-top: 20px;">
              Log in to your admin panel to approve or reject this submission.
            </p>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              Project ID: ${safeId}
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
    console.error("Error in notify-submission function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
