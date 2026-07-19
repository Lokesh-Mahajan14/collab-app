import nodemailer from "nodemailer";

type InviteEmailInput = {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviteLink: string;
};

type InviteEmailResult = {
  delivered: boolean;
  provider: "smtp" | "resend" | "none";
  details?: string;
};

async function sendWithSmtp(input: InviteEmailInput): Promise<InviteEmailResult | null> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM_EMAIL;

  if (!host || !user || !pass || !from) {
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: `You're invited to ${input.workspaceName} on CollabFlow`,
      html: `<p>${input.inviterName} invited you to join <strong>${input.workspaceName}</strong>.</p><p><a href="${input.inviteLink}">Accept invitation</a></p>`,
    });

    return { delivered: true, provider: "smtp" };
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown SMTP error";
    console.warn(`[invite-email] SMTP send failed for ${input.to}: ${details}`);
    return { delivered: false, provider: "smtp", details };
  }
}

async function sendWithResend(input: InviteEmailInput): Promise<InviteEmailResult | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `You're invited to ${input.workspaceName} on CollabFlow`,
      html: `<p>${input.inviterName} invited you to join <strong>${input.workspaceName}</strong>.</p><p><a href="${input.inviteLink}">Accept invitation</a></p>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.warn(`[invite-email] Resend failed for ${input.to}: ${details}`);
    return { delivered: false, provider: "resend", details };
  }

  return { delivered: true, provider: "resend" };
}

export async function sendWorkspaceInviteEmail(input: InviteEmailInput) {
  const smtpResult = await sendWithSmtp(input);
  if (smtpResult?.delivered) {
    return smtpResult;
  }

  const resendResult = await sendWithResend(input);
  if (resendResult?.delivered) {
    return resendResult;
  }

  const details = smtpResult?.details ?? resendResult?.details;
  const provider = smtpResult ? "smtp" : resendResult ? "resend" : "none";

  console.info("[invite-email] Configure SMTP_* or RESEND_* variables to send real emails.");
  console.info(`[invite-email] Invite for ${input.to}: ${input.inviteLink}`);

  return {
    delivered: false,
    provider,
    details,
  };
}
