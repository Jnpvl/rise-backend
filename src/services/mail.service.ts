import nodemailer from "nodemailer";

type MailPayload = {
  subject: string;
  text: string;
  html: string;
};

function getMailPass(): string {
  // Gmail muestra la app password con espacios; SMTP la exige sin espacios.
  return (process.env.MAIL_PASS || "").replace(/\s+/g, "").trim();
}

function isMailConfigured(): boolean {
  return Boolean(process.env.MAIL_USER?.trim() && getMailPass());
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER?.trim(),
      pass: getMailPass(),
    },
  });
}

export async function sendNotificationEmail(
  payload: MailPayload
): Promise<void> {
  if (!isMailConfigured()) {
    console.warn(
      "[mail] MAIL_USER/MAIL_PASS no configurados; se omite el envío de correo",
      {
        host: process.env.MAIL_HOST || null,
        userSet: Boolean(process.env.MAIL_USER?.trim()),
        passSet: Boolean(getMailPass()),
      }
    );
    return;
  }

  const to =
    process.env.MAIL_TO?.trim() ||
    process.env.MAIL_FROM?.trim() ||
    "serviciosmedicosrise@gmail.com";

  const fromAddress =
    process.env.MAIL_FROM?.trim() ||
    process.env.MAIL_TO?.trim() ||
    process.env.MAIL_USER?.trim();

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  console.log("[mail] Enviado", {
    to,
    from: fromAddress,
    messageId: info.messageId,
    response: info.response,
  });
}
