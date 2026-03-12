import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmissionNotification {
  projectName: string;
  projectDescription: string;
  projectUrl: string;
  projectCategory: string;
  projectId: string;
  submitterEmail?: string;
  imageUrl?: string;
}

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
    const { projectName, projectDescription, projectUrl, projectCategory, projectId, submitterEmail, imageUrl }: SubmissionNotification = await req.json();

    console.log("Sending notification email for project:", projectName);

    // Validate required fields
    if (!projectName || !projectId) {
      return new Response(
        JSON.stringify({ error: "Project name and ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify project exists in database to prevent spam
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .single();
      
      if (projectError || !project) {
        console.error("Project validation failed:", projectError);
        return new Response(
          JSON.stringify({ error: "Invalid project reference" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

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
    const safeName = escapeHtml(projectName);
    const safeDescription = escapeHtml(projectDescription || '');
    const safeUrl = escapeHtml(projectUrl || '');
    const safeCategory = escapeHtml(projectCategory || '');
    const safeId = escapeHtml(projectId);
    const safeEmail = escapeHtml(submitterEmail || 'Not provided');
    const safeImageUrl = escapeHtml(imageUrl || '');

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Project Submissions <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New Project Submission: ${safeName}`,
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

    return new Response(JSON.stringify({ success: true, emailResponse: result }), {
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
