import { AppDataSource } from "../config/database";
import { Patient } from "../entities/Patient.entity";
import { Staff } from "../entities/Staff.entity";
import { AppError } from "../utils/app-error";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { imageToBase64 } from "../utils/image.utils";
import { renderHtmlToPdf } from "../utils/pdf";

function normalizeOptionalDecimal(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const num = Number(value);
  if (isNaN(num)) return undefined;
  return Math.round(num * 100) / 100;
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

function normalizePatientPayload(data: any) {
  return {
    ...data,
    weight: normalizeOptionalDecimal(data.weight),
    height: normalizeOptionalDecimal(data.height),
    shoeSize: normalizeOptionalText(data.shoeSize),
    emergencyContactName: normalizeOptionalText(data.emergencyContactName),
    emergencyContactPhone: normalizeOptionalText(data.emergencyContactPhone),
    emergencyContactAddress: normalizeOptionalText(
      data.emergencyContactAddress
    ),
  };
}

function displayValue(value: unknown, empty = "—"): string {
  if (value === undefined || value === null) return empty;
  const text = String(value).trim();
  return text === "" ? empty : text;
}

function formatBirthDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(
    typeof value === "string" && !value.includes("T")
      ? `${value}T12:00:00`
      : (value as string | Date)
  );
  if (isNaN(date.getTime())) return displayValue(value);
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAge(birthDate: unknown): string {
  if (!birthDate) return "—";
  const birth = new Date(
    typeof birthDate === "string" && !birthDate.includes("T")
      ? `${birthDate}T12:00:00`
      : (birthDate as string | Date)
  );
  if (isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

function genderLabel(gender?: string | null): string {
  const g = (gender || "").toUpperCase();
  if (g === "M" || g.startsWith("M")) return "Masculino";
  if (g === "F" || g.startsWith("F")) return "Femenino";
  return displayValue(gender);
}

export class PatientService {
  private patientRepo = AppDataSource.getRepository(Patient);
  private staffRepo = AppDataSource.getRepository(Staff);

  async create(data: any, user?: { id: string; role: string }) {
    if (
      !data.firstName ||
      !data.lastName ||
      !data.gender ||
      !data.birthDate ||
      !data.phone ||
      !data.address ||
      !data.occupation ||
      !data.educationLevel ||
      !data.bloodType
    ) {
      throw new AppError(400, "Faltan campos obligatorios");
    }

    const existing = await this.patientRepo
      .createQueryBuilder("patient")
      .where("LOWER(patient.firstName) = LOWER(:firstName)", {
        firstName: data.firstName.trim(),
      })
      .andWhere("LOWER(patient.lastName) = LOWER(:lastName)", {
        lastName: data.lastName.trim(),
      })
      .andWhere("patient.birthDate = :birthDate", { birthDate: data.birthDate })
      .andWhere("patient.phone = :phone", { phone: data.phone.trim() })
      .getOne();

    if (existing) {
      const message = existing.isActive
        ? "Ya existe un paciente registrado con los mismos datos."
        : "Ya existe un paciente con esos datos, pero está inactivo. Puedes reactivarlo.";
      throw new AppError(409, message);
    }

    let createdById: string | undefined;
    let createdByName: string | undefined;
    if (user?.id) {
      const staff = await this.staffRepo.findOneBy({ id: user.id });
      createdById = user.id;
      createdByName = staff?.name || "Usuario";
    }

    const payload = normalizePatientPayload(data);
    const patient = this.patientRepo.create({
      ...payload,
      createdById,
      createdByName,
    });
    await this.patientRepo.save(patient);

    return { message: "Paciente registrado correctamente", patient };
  }

  async list(filters: {
    page?: string | number;
    limit?: string | number;
    search?: string;
    isActive?: string;
    createdById?: string;
  }) {
    const pageNumber = parseInt(String(filters.page ?? "1"), 10);
    const limitNumber = parseInt(String(filters.limit ?? "10"), 10);
    const skip = (pageNumber - 1) * limitNumber;
    const searchTerm = String(filters.search ?? "").trim();
    const creatorId = String(filters.createdById ?? "").trim();
    const isActive = filters.isActive ?? "all";

    const qb = this.patientRepo.createQueryBuilder("patient");

    if (isActive !== "all") {
      qb.andWhere("patient.isActive = :isActive", {
        isActive: isActive === "true",
      });
    }

    if (creatorId) {
      qb.andWhere("patient.createdById = :creatorId", { creatorId });
    }

    if (searchTerm) {
      qb.andWhere(
        "(LOWER(patient.firstName) LIKE LOWER(:search) OR LOWER(patient.lastName) LIKE LOWER(:search) OR patient.phone LIKE :search)",
        { search: `%${searchTerm}%` }
      );
    }

    qb.orderBy("patient.createdAt", "DESC").skip(skip).take(limitNumber);

    const [patients, total] = await qb.getManyAndCount();

    return {
      patients,
      total,
      page: pageNumber,
      limit: limitNumber,
    };
  }

  async getById(id: string) {
    const patient = await this.patientRepo.findOneBy({ id });
    if (!patient) {
      throw new AppError(404, "Paciente no encontrado");
    }
    return patient;
  }

  async generateRecordPdf(id: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const patient = await this.patientRepo.findOneBy({ id });
    if (!patient) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const logoPath = imageToBase64(
      path.resolve(__dirname, "../utils/assets/logo.png")
    );
    const watermarkPath = imageToBase64(
      path.resolve(__dirname, "../utils/assets/logo completo sin fondo.png")
    );

    const fullName =
      `${(patient.firstName || "").trim()} ${(patient.lastName || "").trim()}`.trim() ||
      "—";

    const context = {
      logoPath,
      watermarkPath,
      fullName,
      birthDate: formatBirthDate(patient.birthDate),
      age: formatAge(patient.birthDate),
      gender: genderLabel(patient.gender),
      maritalStatus: displayValue(patient.maritalStatus),
      guardianName: displayValue(patient.guardianName),
      phone: displayValue(patient.phone),
      email: displayValue(patient.email),
      address: displayValue(patient.address),
      occupation: displayValue(patient.occupation),
      educationLevel: displayValue(patient.educationLevel),
      curp: displayValue(patient.curp),
      bloodType: displayValue(patient.bloodType),
      weight:
        patient.weight !== undefined && patient.weight !== null
          ? `${patient.weight} kg`
          : "—",
      height:
        patient.height !== undefined && patient.height !== null
          ? `${patient.height} m`
          : "—",
      shoeSize: displayValue(patient.shoeSize),
      emergencyContactName: displayValue(patient.emergencyContactName),
      emergencyContactPhone: displayValue(patient.emergencyContactPhone),
      emergencyContactAddress: displayValue(patient.emergencyContactAddress),
      allergies: displayValue(patient.allergies),
      medicalConditions: displayValue(patient.medicalConditions),
      currentMedications: displayValue(patient.currentMedications),
      patologicos: displayValue(patient.patologicos),
      noPatologicos: displayValue(patient.noPatologicos),
      initialNotes: displayValue(patient.initialNotes),
      printedAt: new Date().toLocaleString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      updatedAt: new Date(
        patient.updatedAt || patient.createdAt
      ).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    const htmlPath = path.join(
      __dirname,
      "..",
      "templates",
      "patient-record.hbs"
    );
    const source = fs.readFileSync(htmlPath, "utf8");
    const template = Handlebars.compile(source);
    const html = template(context);
    const buffer = await renderHtmlToPdf(html);

    const slug = fullName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9áéíóúñ-]/gi, "");
    const filename = `expediente-${slug || "paciente"}-${new Date().toISOString().split("T")[0]}.pdf`;

    return { buffer, filename };
  }

  async update(id: string, data: any) {
    const patient = await this.patientRepo.findOneBy({ id });
    if (!patient || !patient.isActive) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const { createdById, createdByName, ...rest } = normalizePatientPayload(
      data
    );
    Object.assign(patient, rest);
    await this.patientRepo.save(patient);

    return { message: "Paciente actualizado correctamente", patient };
  }

  async deactivate(id: string) {
    const patient = await this.patientRepo.findOneBy({ id });
    if (!patient || !patient.isActive) {
      throw new AppError(404, "Paciente no encontrado");
    }

    patient.isActive = false;
    await this.patientRepo.save(patient);

    return { message: "Paciente desactivado correctamente" };
  }

  async listActiveForSelect() {
    return this.patientRepo.find({
      select: ["id", "firstName", "lastName"],
      where: { isActive: true },
      order: { firstName: "ASC" },
    });
  }
}

export const patientService = new PatientService();
