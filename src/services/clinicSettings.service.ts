import { AppDataSource } from "../config/database";
import { ClinicSettings } from "../entities/ClinicSettings.entity";

export type ClinicSettingsPayload = {
  horario?: string;
  telefono?: string;
  whatsapp?: string;
  ubicacion?: string;
  facebookUrl?: string;
};

const DEFAULTS: ClinicSettingsPayload = {
  horario: "Lun–Vie 9:00–19:00 · Sáb 9:00–14:00",
  telefono: "",
  whatsapp: "",
  ubicacion: "",
  facebookUrl: "",
};

class ClinicSettingsService {
  private repo() {
    return AppDataSource.getRepository(ClinicSettings);
  }

  async get(): Promise<ClinicSettings> {
    const existing = await this.repo().find({
      order: { createdAt: "ASC" },
      take: 1,
    });

    if (existing[0]) return existing[0];

    const created = this.repo().create(DEFAULTS);
    return this.repo().save(created);
  }

  async update(data: ClinicSettingsPayload): Promise<ClinicSettings> {
    const settings = await this.get();

    if (data.horario !== undefined) settings.horario = String(data.horario).trim();
    if (data.telefono !== undefined) settings.telefono = String(data.telefono).trim();
    if (data.whatsapp !== undefined) settings.whatsapp = String(data.whatsapp).trim();
    if (data.ubicacion !== undefined) settings.ubicacion = String(data.ubicacion).trim();
    if (data.facebookUrl !== undefined) {
      const raw = String(data.facebookUrl).trim();
      if (!raw) {
        settings.facebookUrl = "";
      } else {
        const withoutProtocol = raw.replace(/^https?:\/\//i, "");
        settings.facebookUrl = `https://${withoutProtocol}`;
      }
    }

    return this.repo().save(settings);
  }
}

export const clinicSettingsService = new ClinicSettingsService();
