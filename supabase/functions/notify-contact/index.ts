import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email addresses to receive contact notifications
const NOTIFICATION_EMAILS = ["domingosb846@gmail.com", "boaven00@gmail.com"];

interface ContactNotification {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function generateContactNotificationEmail(data: ContactNotification): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;margin:0;padding:20px;">
  <div style="background-color:#ffffff;margin:0 auto;max-width:600px;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:bold;margin:0;">Nova Mensagem de Contacto</h1>
    </div>
    <div style="padding:40px 32px;">
      <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:8px 0;vertical-align:top;width:100px;"><strong>Nome:</strong></td>
            <td style="color:#1f2937;font-size:14px;padding:8px 0;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:8px 0;vertical-align:top;"><strong>Email:</strong></td>
            <td style="color:#1f2937;font-size:14px;padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#3b82f6;text-decoration:none;">${escapeHtml(data.email)}</a></td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:8px 0;vertical-align:top;"><strong>Assunto:</strong></td>
            <td style="color:#1f2937;font-size:14px;padding:8px 0;">${escapeHtml(data.subject)}</td>
          </tr>
        </table>
      </div>
      <h3 style="color:#1f2937;font-size:16px;font-weight:bold;margin:0 0 12px;">Mensagem:</h3>
      <div style="background-color:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e5e7eb;">
        <p style="color:#374151;font-size:14px;line-height:24px;margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${encodeURIComponent(data.subject)}" style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);border-radius:8px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;display:inline-block;">Responder</a>
      </div>
    </div>
    <div style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Esta mensagem foi enviada através do formulário de contacto do Universo IT</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const data: ContactNotification = await req.json();

    console.log("Received contact notification request:", {
      name: data.name,
      email: data.email,
      subject: data.subject,
    });

    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const html = generateContactNotificationEmail(data);

    console.log(`Sending notification to: ${NOTIFICATION_EMAILS.join(", ")}`);

    const { data: emailData, error } = await resend.emails.send({
      from: "Universo IT <noreply@universoit.tech>",
      to: NOTIFICATION_EMAILS,
      replyTo: data.email,
      subject: `[Contacto] ${data.subject}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Notification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send notification";
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
