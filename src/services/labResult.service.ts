import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { AppDataSource } from "../config/database";
import { LabResult } from "../entities/LabResult.entity";
import { Patient } from "../entities/Patient.entity";
import { Staff } from "../entities/Staff.entity";
import { AppError } from "../utils/app-error";
import { imageToBase64 } from "../utils/image.utils";
import { renderHtmlToPdf } from "../utils/pdf";

export type LabResultRowInput = {
  id?: string;
  name: string;
  value: string;
  unit?: string;
  section?: string;
  status?: string;
  reference?: string;
  note?: string;
};

export type LabPanelInput = {
  id?: string;
  title: string;
  method?: string;
  notes?: string;
  rows: LabResultRowInput[];
};

function parsePanels(raw: string): LabPanelInput[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializePanels(panels: LabPanelInput[]): string {
  return JSON.stringify(panels);
}

function normalizePanels(panels: unknown): LabPanelInput[] {
  if (!Array.isArray(panels) || panels.length === 0) {
    throw new AppError(400, "Debes agregar al menos un panel de resultados");
  }

  return panels.map((panel, index) => {
    if (!panel || typeof panel !== "object") {
      throw new AppError(400, `Panel ${index + 1} inválido`);
    }

    const p = panel as LabPanelInput;
    const title = String(p.title ?? "").trim() || `Panel ${index + 1}`;

    if (!Array.isArray(p.rows) || p.rows.length === 0) {
      throw new AppError(400, `El panel "${title}" necesita al menos un análisis`);
    }

    const rows = p.rows
      .map((row) => {
        const name = String(row?.name ?? "").trim();
        const value = String(row?.value ?? "").trim();
        return {
          id: row?.id ? String(row.id) : undefined,
          name,
          value,
          unit: String(row?.unit ?? "").trim(),
          section: String(row?.section ?? "").trim(),
          status: String(row?.status ?? "").trim(),
          reference: String(row?.reference ?? "").trim(),
          note: String(row?.note ?? "").trim(),
        };
      })
      .filter((row) => row.name || row.value);

    if (rows.length === 0) {
      throw new AppError(
        400,
        `El panel "${title}" necesita al menos un análisis con nombre y resultado`
      );
    }

    const incomplete = rows.find((row) => !row.name || !row.value);
    if (incomplete) {
      throw new AppError(
        400,
        `En "${title}", completa el análisis y el resultado de cada fila`
      );
    }

    return {
      id: p.id ? String(p.id) : undefined,
      title,
      method: String(p.method ?? "").trim(),
      notes: String(p.notes ?? "").trim(),
      rows,
    };
  });
}

function toResponse(entity: LabResult) {
  return {
    id: entity.id,
    patientId: entity.patientId,
    createdById: entity.createdById,
    studyDate: entity.studyDate,
    generalNotes: entity.generalNotes || "",
    panels: parsePanels(entity.panels),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    patient: entity.patient
      ? {
          id: entity.patient.id,
          firstName: entity.patient.firstName,
          lastName: entity.patient.lastName,
          birthDate: entity.patient.birthDate,
          gender: entity.patient.gender,
        }
      : undefined,
  };
}

function formatStudyDate(studyDate: string): string {
  const d = new Date(`${studyDate}T12:00:00`);
  if (isNaN(d.getTime())) return studyDate;
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function patientAgeLabel(birthDate?: string | Date | null): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

function genderLabel(gender?: string | null): string {
  const g = (gender || "").toLowerCase();
  if (g.startsWith("f")) return "Femenino";
  if (g.startsWith("m")) return "Masculino";
  return gender || "—";
}

function groupRowsBySection(rows: LabResultRowInput[]) {
  const blocks: { section: string | null; rows: LabResultRowInput[] }[] = [];
  for (const item of rows) {
    const section = item.section?.trim() || null;
    const last = blocks[blocks.length - 1];
    if (last && last.section === section) {
      last.rows.push(item);
    } else {
      blocks.push({ section, rows: [item] });
    }
  }
  return blocks;
}

function buildTemplatePanels(panels: LabPanelInput[]) {
  return panels.map((panel) => {
    const hasStatus = panel.rows.some((row) => Boolean(row.status?.trim()));
    return {
      title: panel.title,
      method: panel.method || "",
      notes: panel.notes || "",
      hasStatus,
      colspan: hasStatus ? 5 : 4,
      blocks: groupRowsBySection(panel.rows),
    };
  });
}

export class LabResultService {
  private labRepo = AppDataSource.getRepository(LabResult);
  private patientRepo = AppDataSource.getRepository(Patient);
  private staffRepo = AppDataSource.getRepository(Staff);

  async create(
    data: {
      patientId: string;
      studyDate: string;
      generalNotes?: string;
      panels: LabPanelInput[];
    },
    user?: { id: string; role: string }
  ) {
    if (!user?.id) {
      throw new AppError(401, "No autorizado");
    }

    const patientId = String(data.patientId ?? "").trim();
    if (!patientId) {
      throw new AppError(400, "Selecciona un paciente");
    }

    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const studyDate = String(data.studyDate ?? "").trim();
    if (!studyDate) {
      throw new AppError(400, "Indica la fecha del estudio");
    }

    const panels = normalizePanels(data.panels);

    const entity = this.labRepo.create({
      patientId,
      createdById: user.id,
      studyDate,
      generalNotes: String(data.generalNotes ?? "").trim() || undefined,
      panels: serializePanels(panels),
    });

    await this.labRepo.save(entity);

    const saved = await this.labRepo.findOne({
      where: { id: entity.id },
      relations: ["patient"],
    });

    return {
      message: "Resultados de laboratorio guardados",
      labResult: toResponse(saved!),
    };
  }

  async update(
    id: string,
    data: {
      studyDate?: string;
      generalNotes?: string;
      panels?: LabPanelInput[];
    }
  ) {
    const entity = await this.labRepo.findOne({
      where: { id },
      relations: ["patient"],
    });
    if (!entity) {
      throw new AppError(404, "Resultado de laboratorio no encontrado");
    }

    if (data.studyDate !== undefined) {
      const studyDate = String(data.studyDate).trim();
      if (!studyDate) {
        throw new AppError(400, "Indica la fecha del estudio");
      }
      entity.studyDate = studyDate;
    }

    if (data.generalNotes !== undefined) {
      entity.generalNotes = String(data.generalNotes).trim() || undefined;
    }

    if (data.panels !== undefined) {
      entity.panels = serializePanels(normalizePanels(data.panels));
    }

    await this.labRepo.save(entity);

    return {
      message: "Resultados actualizados",
      labResult: toResponse(entity),
    };
  }

  async getById(id: string) {
    const entity = await this.labRepo.findOne({
      where: { id },
      relations: ["patient"],
    });
    if (!entity) {
      throw new AppError(404, "Resultado de laboratorio no encontrado");
    }
    return toResponse(entity);
  }

  async listByPatient(patientId: string, page = 1, limit = 20) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const [items, total] = await this.labRepo.findAndCount({
      where: { patientId },
      relations: ["patient"],
      order: { studyDate: "DESC", createdAt: "DESC" },
      skip,
      take: limitNumber,
    });

    return {
      total,
      page: pageNumber,
      limit: limitNumber,
      labResults: items.map(toResponse),
    };
  }

  async generatePdfFromDraft(
    data: {
      patientId?: string;
      patientName?: string;
      patientBirthDate?: string;
      patientGender?: string;
      studyDate: string;
      generalNotes?: string;
      panels: LabPanelInput[];
      createdById?: string;
    },
    user?: { id: string; role: string }
  ): Promise<{ buffer: Buffer; filename: string }> {
    const studyDate = String(data.studyDate ?? "").trim();
    if (!studyDate) {
      throw new AppError(400, "Indica la fecha del estudio");
    }

    const panels = normalizePanels(data.panels);

    let patient: Patient | null = null;
    if (data.patientId) {
      patient = await this.patientRepo.findOneBy({ id: data.patientId });
    }

    const patientName =
      patient
        ? `${patient.firstName} ${patient.lastName}`.trim()
        : String(data.patientName ?? "").trim() || "Sin paciente";

    const birthDate = patient?.birthDate || data.patientBirthDate || null;
    const gender = patient?.gender || data.patientGender || null;
    const ageGender = `${patientAgeLabel(birthDate)} · ${genderLabel(gender)}`;

    const signerId = data.createdById || user?.id;
    let staff: Staff | null = null;
    if (signerId) {
      staff = await this.staffRepo.findOneBy({ id: signerId });
    }

    const staffName = staff?.name?.trim() || "Médico RISE";
    const staffCedula = staff?.cedula?.trim() || "";
    const staffSignatureDataUrl = staff?.signatureDataUrl?.trim() || "";

    const logoPath = imageToBase64(
      path.resolve(__dirname, "../utils/assets/logo.png")
    );

    const htmlPath = path.join(__dirname, "..", "templates", "lab-report.hbs");
    const source = fs.readFileSync(htmlPath, "utf8");
    const template = Handlebars.compile(source);
    const html = template({
      logoPath,
      patientName,
      studyDateLabel: formatStudyDate(studyDate),
      ageGender,
      panels: buildTemplatePanels(panels),
      generalNotes: String(data.generalNotes ?? "").trim(),
      staffName,
      staffCedula,
      staffSignatureDataUrl,
    });

    const buffer = await renderHtmlToPdf(html);
    const slug = patientName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9áéíóúñ-]/gi, "");
    const filename = `resultados-laboratorio-${slug || "sin-paciente"}-${studyDate}.pdf`;

    return { buffer, filename };
  }

  async generatePdfById(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const entity = await this.labRepo.findOne({
      where: { id },
      relations: ["patient"],
    });
    if (!entity) {
      throw new AppError(404, "Resultado de laboratorio no encontrado");
    }

    return this.generatePdfFromDraft({
      patientId: entity.patientId,
      studyDate: entity.studyDate,
      generalNotes: entity.generalNotes,
      panels: parsePanels(entity.panels),
      createdById: entity.createdById,
    });
  }
}

export const labResultService = new LabResultService();
