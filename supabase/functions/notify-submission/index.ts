import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, projectDescription, projectUrl, projectCategory, projectId }: SubmissionNotification = await req.json();

    console.log("Sending notification email for project:", projectName);

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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Project Submissions <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New Project Submission: ${projectName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">New Project Submission</h1>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #6366f1; margin-top: 0;">${projectName}</h2>
              <p style="color: #666; line-height: 1.6;">${projectDescription}</p>
              
              <table style="width: 100%; margin-top: 15px;">
                <tr>
                  <td style="color: #888; padding: 5px 0;">Category:</td>
                  <td style="color: #333; font-weight: 500;">${projectCategory}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 5px 0;">URL:</td>
                  <td><a href="${projectUrl}" style="color: #6366f1;">${projectUrl}</a></td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; margin-top: 20px;">
              Log in to your admin panel to approve or reject this submission.
            </p>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              Project ID: ${projectId}
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);