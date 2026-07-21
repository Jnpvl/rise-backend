import { AppDataSource } from "../config/database";
import {
  WebInquiry,
  WebInquiryStatus,
  WebInquiryType,
} from "../entities/WebInquiry.entity";
import { AppError } from "../utils/app-error";
import { sendNotificationEmail } from "./mail.service";

export type CreateAppointmentInquiryInput = {
  name: string;
  phone: string;
  preferredDate?: string;
  reason?: string;
};

export type CreateContactInquiryInput = {
  name: string;
  phone: string;
  email?: string;
  message: string;
};

function requireTrimmed(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, `${field} es obligatorio`);
  }
  return value.trim();
}

class WebInquiryService {
  private repo() {
    return AppDataSource.getRepository(WebInquiry);
  }

  async createAppointment(
    data: CreateAppointmentInquiryInput
  ): Promise<WebInquiry> {
    const name = requireTrimmed(data.name, "Nombre");
    const phone = requireTrimmed(data.phone, "Teléfono");
    const reason =
      typeof data.reason === "string" && data.reason.trim()
        ? data.reason.trim()
        : null;

    let preferredDate: Date | null = null;
    if (data.preferredDate) {
      const parsed = new Date(data.preferredDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError(400, "Fecha preferida inválida");
      }
      preferredDate = parsed;
    }

    const inquiry = this.repo().create({
      type: "appointment" satisfies WebInquiryType,
      name,
      phone,
      email: null,
      preferredDate,
      reason,
      message: null,
      status: "pending",
    });

    const saved = await this.repo().save(inquiry);
    void this.notifyByEmail(saved);
    return saved;
  }

  async createContact(data: CreateContactInquiryInput): Promise<WebInquiry> {
    const name = requireTrimmed(data.name, "Nombre");
    const phone = requireTrimmed(data.phone, "Teléfono");
    const message = requireTrimmed(data.message, "Mensaje");
    const email =
      typeof data.email === "string" && data.email.trim()
        ? data.email.trim()
        : null;

    const inquiry = this.repo().create({
      type: "contact" satisfies WebInquiryType,
      name,
      phone,
      email,
      preferredDate: null,
      reason: null,
      message,
      status: "pending",
    });

    const saved = await this.repo().save(inquiry);
    void this.notifyByEmail(saved);
    return saved;
  }

  async list(type?: WebInquiryType): Promise<WebInquiry[]> {
    const where = type ? { type } : {};
    return this.repo().find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async updateStatus(
    id: string,
    status: WebInquiryStatus
  ): Promise<WebInquiry> {
    const allowed: WebInquiryStatus[] = [
      "pending",
      "scheduled",
      "cancelled",
      "resolved",
    ];
    if (!allowed.includes(status)) {
      throw new AppError(400, "Estado inválido");
    }

    const inquiry = await this.repo().findOne({ where: { id } });
    if (!inquiry) {
      throw new AppError(404, "Solicitud no encontrada");
    }

    if (inquiry.type === "appointment") {
      if (!["pending", "scheduled", "cancelled"].includes(status)) {
        throw new AppError(
          400,
          "Para citas el estado debe ser pendiente, agendada o cancelada"
        );
      }
    } else if (!["pending", "resolved"].includes(status)) {
      throw new AppError(
        400,
        "Para dudas el estado debe ser pendiente o resuelta"
      );
    }

    inquiry.status = status;
    return this.repo().save(inquiry);
  }

  private async notifyByEmail(inquiry: WebInquiry): Promise<void> {
    try {
      const isAppointment = inquiry.type === "appointment";
      const title = isAppointment
        ? "Nueva solicitud de cita"
        : "Nuevo mensaje de contacto";

      const preferred =
        inquiry.preferredDate != null
          ? new Date(inquiry.preferredDate).toLocaleString("es-MX")
          : "Sin preferencia";

      const lines = [
        title,
        "",
        `Nombre: ${inquiry.name}`,
        `Teléfono: ${inquiry.phone}`,
        ...(inquiry.email ? [`Correo: ${inquiry.email}`] : []),
        ...(isAppointment
          ? [
              `Fecha preferida: ${preferred}`,
              `Motivo: ${inquiry.reason || "—"}`,
            ]
          : [`Mensaje: ${inquiry.message || "—"}`]),
        "",
        `ID: ${inquiry.id}`,
      ];

      const htmlRows = [
        ["Nombre", inquiry.name],
        ["Teléfono", inquiry.phone],
        ...(inquiry.email ? [["Correo", inquiry.email] as [string, string]] : []),
        ...(isAppointment
          ? ([
              ["Fecha preferida", preferred],
              ["Motivo", inquiry.reason || "—"],
            ] as [string, string][])
          : ([["Mensaje", inquiry.message || "—"]] as [string, string][])),
      ]
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 12px;font-weight:600">${label}</td><td style="padding:6px 12px">${value}</td></tr>`
        )
        .join("");

      await sendNotificationEmail({
        subject: `[RISE] ${title} — ${inquiry.name}`,
        text: lines.join("\n"),
        html: `
          <h2>${title}</h2>
          <table style="border-collapse:collapse">${htmlRows}</table>
          <p style="color:#666;font-size:12px;margin-top:16px">ID: ${inquiry.id}</p>
        `,
      });
    } catch (err) {
      console.error("[mail] Error enviando notificación de web inquiry:", err);
    }
  }
}

export const webInquiryService = new WebInquiryService();
