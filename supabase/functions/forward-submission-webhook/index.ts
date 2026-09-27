import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// The site calls this right after inserting the project, so anything older is a replay.
const MAX_SUBMISSION_AGE_MS = 15 * 60 * 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only the project id is taken from the request. Everything forwarded comes from the
    // database, so callers can't push made-up submissions into the webhook.
    const { projectId } = await req.json().catch(() => ({}));
    if (typeof projectId !== "string" || !UUID_PATTERN.test(projectId)) {
      return json({ error: "A valid projectId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, url, category, image_url, status, created_at")
      .eq("id", projectId)
      .maybeSingle();

    const isFresh = project && Date.now() - new Date(project.created_at).getTime() < MAX_SUBMISSION_AGE_MS;
    if (!project || project.status !== "pending" || !isFresh) {
      return json({ error: "No new submission with that id" }, 404);
    }

    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "submission_webhook_url")
      .maybeSingle();

    const webhookUrl = setting?.value;
    if (!webhookUrl) {
      console.log("No webhook URL configured, skipping");
      return json({ success: true, skipped: true, reason: "No webhook URL configured" });
    }

    const { data: submission } = await supabase
      .from("project_submissions")
      .select("submitter_email")
      .eq("project_id", projectId)
      .maybeSingle();

    const webhookPayload = {
      project_name: project.name,
      project_description: project.description,
      project_url: project.url,
      project_category: project.category,
      project_id: project.id,
      submitter_email: submission?.submitter_email || "",
      image_url: project.image_url || "",
      submitted_at: project.created_at,
    };

    console.log("Forwarding submission to webhook:", project.id);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    console.log("Webhook response status:", response.status);

    return json({ success: true, webhookStatus: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook forwarding error:", message);
    return json({ error: "An error occurred processing your request" }, 500);
  }
});
