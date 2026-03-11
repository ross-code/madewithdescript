import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SubmissionPayload {
  projectName: string;
  projectDescription: string;
  projectUrl: string;
  projectCategory: string;
  projectId: string;
  submitterEmail?: string;
  imageUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SubmissionPayload = await req.json();

    // Get webhook URL from app_settings using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "submission_webhook_url")
      .single();

    const webhookUrl = setting?.value;

    if (!webhookUrl) {
      console.log("No webhook URL configured, skipping");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No webhook URL configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Forward to webhook
    const webhookPayload = {
      project_name: payload.projectName,
      project_description: payload.projectDescription,
      project_url: payload.projectUrl,
      project_category: payload.projectCategory,
      project_id: payload.projectId,
      submitter_email: payload.submitterEmail || "",
      image_url: payload.imageUrl || "",
      submitted_at: new Date().toISOString(),
    };

    console.log("Forwarding submission to webhook:", webhookUrl);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    console.log("Webhook response status:", response.status);

    return new Response(
      JSON.stringify({ success: true, webhookStatus: response.status }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook forwarding error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
