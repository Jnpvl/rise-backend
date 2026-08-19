import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { AppDataSource } from "../config/database";
import { Consultation } from "../entities/consultations.entity";
import { Patient } from "../entities/Patient.entity";
import { Staff } from "../entities/Staff.entity";
import { AppError } from "../utils/app-error";
import { imageToBase64 } from "../utils/image.utils";
import { renderHtmlToPdf } from "../utils/pdf";
import { appointmentService } from "./appointment.service";

type AuthUser = { id: string; role: string };

function normalizeDecimal(value: unknown): number | null {
  if (value === "" || value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return Math.round(num * 100) / 100;
}

function normalizeDate(value: unknown): Date | null {
  if (!value || value === "") return null;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

function parseJsonField(value: unknown): unknown[] {
  try {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      return JSON.parse(value);
    }
  } catch {
    // ignore
  }
  return [];
}

function serializeSpecialtyData(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function normalizeTemplatePayload(data: any) {
  const templateKey =
    data.templateKey === "podology" ? "podology" : "general";

  if (templateKey === "podology") {
    const specialty =
      typeof data.specialtyData === "object" && data.specialtyData
        ? data.specialtyData
        : {};

    return {
      templateKey,
      consultationTypeId: String(
        data.consultationTypeId || "Seguimiento podológico"
      ).trim(),
      reasonForConsultation: String(
        data.reasonForConsultation ||
          specialty.initialObservations ||
          "Seguimiento podológico"
      ).trim(),
      diagnosis: String(
        data.diagnosis || specialty.treatment || "Seguimiento podológico"
      ).trim(),
      generalInstructions: String(
        data.generalInstructions ||
          specialty.therapeutics ||
          specialty.treatment ||
          "Ver terapéutica y tratamiento"
      ).trim(),
      initialObservations: String(
        data.initialObservations || specialty.initialObservations || ""
      ),
      additionalNotes: String(
        data.additionalNotes || specialty.explorationNotes || ""
      ),
      specialtyData: serializeSpecialtyData(
        data.specialtyData ?? specialty
      ),
    };
  }

  return {
    templateKey,
    consultationTypeId: String(data.consultationTypeId || "").trim(),
    reasonForConsultation: data.reasonForConsultation,
    diagnosis: data.diagnosis,
    generalInstructions: data.generalInstructions,
    initialObservations: data.initialObservations,
    additionalNotes: data.additionalNotes,
    specialtyData: serializeSpecialtyData(data.specialtyData),
  };
}

function parseSpecialtyObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, any>;
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

const PODOLOGY_CONDITION_LABELS: { key: string; label: string }[] = [
  { key: "palidez", label: "Palidez" },
  { key: "leuconiquia", label: "Leuconiquia" },
  { key: "eritema", label: "Eritema" },
  { key: "melanoniquia", label: "Melanoniquia" },
  { key: "hematoma", label: "Hematoma" },
  { key: "oniquia", label: "Oniquia" },
  { key: "dermatitis", label: "Dermatitis" },
  { key: "coiloniquia", label: "Coiloniquia" },
  { key: "alteracionesOseas", label: "Alteraciones óseas" },
  { key: "onicoquizia", label: "Onicoquizia" },
  { key: "polidactilia", label: "Polidactilia" },
  { key: "unaEnDedal", label: "Uña en dedal" },
  { key: "sindactilia", label: "Sindactilia" },
  { key: "unaMitadYMitad", label: "Uña mitad y mitad" },
  { key: "hiperqueratosis", label: "Hiperqueratosis" },
  { key: "unasHipocraticas", label: "Uñas hipocráticas" },
  { key: "onicomicosis", label: "Onicomicosis" },
  { key: "micosisPlantar", label: "Micosis plantar" },
  { key: "onicogrifosis", label: "Onicogrifosis" },
  { key: "micosisInterdigital", label: "Micosis interdigital" },
  { key: "descamacion", label: "Descamación" },
  { key: "ulceras", label: "Úlceras" },
  { key: "heloma", label: "Heloma" },
  { key: "tatuajes", label: "Tatuajes" },
  { key: "halluxValgus", label: "Hallux valgus" },
  { key: "onicocriptosis", label: "Onicocriptosis" },
  { key: "onicolisis", label: "Onicolisis" },
  { key: "paroniquia", label: "Paroniquia" },
  { key: "onicomadesis", label: "Onicomadesis" },
  { key: "onicodistrofia", label: "Onicodistrofia" },
  { key: "juaneteSastre", label: "Juanete sastre" },
];

const PODOLOGY_FOOT_TYPE_LABELS: Record<string, string> = {
  griego: "Pie griego",
  egipcio: "Pie egipcio",
  polinesio: "Pie polinesio o cuadrado",
};

const PODOLOGY_CONSENT_TEXT =
  "En este documento quedan impresos los datos que he proporcionado y afirmo que son veredictos, después de conocer el tratamiento a seguir que me ha sugerido el Podólogo recibiendo con atención la información respectiva sobre el mismo, lo acepto y autorizo. De acuerdo con el artículo 4° de la Conamed este documento es confidencial e intransferible.";

function markSide(value: unknown): string {
  return value ? "✓" : "";
}

function formatFollowUpDate(value: unknown): string {
  if (!value || typeof value !== "string") return "No registrada";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export class ConsultationService {
  private consultationRepo = AppDataSource.getRepository(Consultation);
  private patientRepo = AppDataSource.getRepository(Patient);
  private staffRepo = AppDataSource.getRepository(Staff);

  async create(data: any, user?: AuthUser) {
    const normalized = normalizeTemplatePayload(data);

    if (
      !data.patientId ||
      !data.doctorId ||
      !normalized.consultationTypeId ||
      !normalized.reasonForConsultation ||
      !normalized.diagnosis ||
      !normalized.generalInstructions
    ) {
      throw new AppError(
        400,
        "Faltan campos obligatorios (incluye tipo de consulta)"
      );
    }

    if (normalized.templateKey === "podology") {
      const specialty =
        typeof data.specialtyData === "object" && data.specialtyData
          ? data.specialtyData
          : {};
      if (!specialty.consentAccepted) {
        throw new AppError(400, "Debe aceptar el consentimiento informado");
      }
      if (!specialty.patientSignatureDataUrl || !specialty.podologistSignatureDataUrl) {
        throw new AppError(400, "Se requieren firmas del paciente y del podólogo");
      }
    }

    const patient = await this.patientRepo.findOneBy({ id: data.patientId });
    if (!patient || !patient.isActive) {
      throw new AppError(
        404,
        "El paciente especificado no existe o está inactivo."
      );
    }

    const nextAppointment = normalizeDate(data.nextAppointment);
    const consultationTypeId = normalized.consultationTypeId;

    const consultation: Consultation = this.consultationRepo.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      consultationTypeId,
      templateKey: normalized.templateKey,
      specialtyData: normalized.specialtyData,
      reasonForConsultation: normalized.reasonForConsultation,
      initialObservations: normalized.initialObservations,
      bloodPressure: data.bloodPressure,
      heartRate: data.heartRate,
      respiratoryRate: data.respiratoryRate,
      temperature: data.temperature,
      oxygenSaturation: data.oxygenSaturation,
      weight: normalizeDecimal(data.weight) ?? undefined,
      height: normalizeDecimal(data.height) ?? undefined,
      bmi: normalizeDecimal(data.bmi) ?? undefined,
      physicalExam: data.physicalExam,
      currentCondition: data.currentCondition,
      systemReview: data.systemReview,
      diagnosis: normalized.diagnosis,
      generalInstructions: normalized.generalInstructions,
      requestedStudies: data.requestedStudies,
      additionalNotes: normalized.additionalNotes,
      nextAppointment: nextAppointment ?? undefined,
      prescribedMedications: JSON.stringify(data.prescribedMedications || []),
      attachedDocuments: JSON.stringify(data.attachedDocuments || []),
    });

    const saved = await this.consultationRepo.save(consultation);

    let appointment = null;
    if (nextAppointment) {
      try {
        const result = await appointmentService.ensureFromConsultation(
          {
            consultationId: saved.id,
            patientId: saved.patientId,
            doctorId: saved.doctorId,
            scheduledDate: data.nextAppointment || nextAppointment,
            consultationType: consultationTypeId,
          },
          user
        );
        appointment = result.appointment;
      } catch (err) {
        await this.consultationRepo.remove(saved);
        throw err;
      }
    }

    return {
      message: appointment
        ? "Consulta registrada y próxima cita agendada correctamente"
        : "Consulta registrada correctamente",
      consultation: saved,
      appointment,
    };
  }

  async listByPatient(
    patientId: string,
    page?: string | number,
    limit?: string | number
  ) {
    const pageNumber = parseInt(String(page ?? "1"), 10);
    const limitNumber = parseInt(String(limit ?? "10"), 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [consultations, total] = await this.consultationRepo.findAndCount({
      where: { patientId },
      order: { consultationDate: "DESC" },
      skip,
      take: limitNumber,
    });

    return {
      total,
      page: pageNumber,
      limit: limitNumber,
      consultations: consultations.map((c) => ({
        ...c,
        prescribedMedications: parseJsonField(c.prescribedMedications),
        attachedDocuments: parseJsonField(c.attachedDocuments),
      })),
    };
  }

  async listAttachmentsByPatient(patientId: string) {
    const consultations = await this.consultationRepo.find({
      where: { patientId },
      order: { consultationDate: "DESC" },
    });

    const attachments: Array<{
      fileName: string;
      fileUrl: string;
      storedName?: string;
      patientId?: string;
      consultationId: string;
      consultationDate: Date;
      consultationType: string;
    }> = [];

    for (const consultation of consultations) {
      const docs = parseJsonField(consultation.attachedDocuments) as Array<any>;
      for (const doc of docs) {
        if (!doc?.fileUrl && !doc?.fileName) continue;
        attachments.push({
          fileName: doc.fileName || "Archivo",
          fileUrl: doc.fileUrl || "",
          storedName: doc.storedName,
          patientId: doc.patientId || patientId,
          consultationId: consultation.id,
          consultationDate: consultation.consultationDate,
          consultationType: consultation.consultationTypeId,
        });
      }
    }

    return { total: attachments.length, attachments };
  }

  async getById(id: string) {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
      relations: ["patient"],
    });

    if (!consultation) {
      throw new AppError(404, "Consulta no encontrada");
    }

    const prescribedMedications = parseJsonField(
      consultation.prescribedMedications
    );
    const attachedDocuments = parseJsonField(consultation.attachedDocuments);

    const patientName = consultation.patient
      ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
      : null;

    const staff = await this.staffRepo.findOneBy({
      id: consultation.doctorId,
    });

    return {
      ...consultation,
      prescribedMedications,
      attachedDocuments,
      specialtyData: (() => {
        try {
          if (!consultation.specialtyData) return null;
          return typeof consultation.specialtyData === "string"
            ? JSON.parse(consultation.specialtyData)
            : consultation.specialtyData;
        } catch {
          return null;
        }
      })(),
      patientName,
      staffName: staff?.name || null,
      staffCedula: staff?.cedula || null,
    };
  }

  async update(id: string, data: any, user?: AuthUser) {
    const normalized = normalizeTemplatePayload(data);

    if (
      !data.doctorId ||
      !normalized.consultationTypeId ||
      !normalized.reasonForConsultation ||
      !normalized.diagnosis ||
      !normalized.generalInstructions
    ) {
      throw new AppError(
        400,
        "Faltan campos obligatorios (incluye tipo de consulta)"
      );
    }

    if (normalized.templateKey === "podology") {
      const specialty =
        typeof data.specialtyData === "object" && data.specialtyData
          ? data.specialtyData
          : {};
      if (!specialty.consentAccepted) {
        throw new AppError(400, "Debe aceptar el consentimiento informado");
      }
      if (!specialty.patientSignatureDataUrl || !specialty.podologistSignatureDataUrl) {
        throw new AppError(400, "Se requieren firmas del paciente y del podólogo");
      }
    }

    const consultation = await this.consultationRepo.findOneBy({ id });
    if (!consultation) {
      throw new AppError(404, "Consulta no encontrada");
    }

    consultation.doctorId = data.doctorId;
    consultation.consultationTypeId = normalized.consultationTypeId;
    consultation.templateKey = normalized.templateKey;
    if (normalized.specialtyData !== undefined) {
      consultation.specialtyData = normalized.specialtyData;
    }
    consultation.reasonForConsultation = normalized.reasonForConsultation;
    consultation.diagnosis = normalized.diagnosis;
    consultation.generalInstructions = normalized.generalInstructions;

    consultation.initialObservations =
      normalized.initialObservations ?? consultation.initialObservations;
    consultation.bloodPressure =
      data.bloodPressure ?? consultation.bloodPressure;
    consultation.heartRate = data.heartRate ?? consultation.heartRate;
    consultation.respiratoryRate =
      data.respiratoryRate ?? consultation.respiratoryRate;
    consultation.temperature = data.temperature ?? consultation.temperature;
    consultation.oxygenSaturation =
      data.oxygenSaturation ?? consultation.oxygenSaturation;
    consultation.weight =
      normalizeDecimal(data.weight) ?? consultation.weight;
    consultation.height =
      normalizeDecimal(data.height) ?? consultation.height;
    consultation.bmi = normalizeDecimal(data.bmi) ?? consultation.bmi;
    consultation.physicalExam =
      data.physicalExam ?? consultation.physicalExam;
    consultation.currentCondition =
      data.currentCondition ?? consultation.currentCondition;
    consultation.systemReview =
      data.systemReview ?? consultation.systemReview;
    consultation.prescribedMedications = data.prescribedMedications
      ? JSON.stringify(data.prescribedMedications)
      : consultation.prescribedMedications;
    consultation.requestedStudies =
      data.requestedStudies ?? consultation.requestedStudies;

    const nextProvided =
      data.nextAppointment !== undefined && data.nextAppointment !== null;
    if (nextProvided) {
      consultation.nextAppointment =
        normalizeDate(data.nextAppointment) ?? undefined;
    }

    consultation.additionalNotes =
      normalized.additionalNotes ?? consultation.additionalNotes;
    consultation.attachedDocuments = data.attachedDocuments
      ? JSON.stringify(data.attachedDocuments)
      : consultation.attachedDocuments;

    await this.consultationRepo.save(consultation);

    let appointment = null;
    if (consultation.nextAppointment) {
      const result = await appointmentService.ensureFromConsultation(
        {
          consultationId: consultation.id,
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          scheduledDate:
            (nextProvided && data.nextAppointment) ||
            consultation.nextAppointment,
          consultationType: consultation.consultationTypeId,
        },
        user
      );
      appointment = result.appointment;
    }

    return {
      message: appointment
        ? "Consulta actualizada y próxima cita agendada correctamente"
        : "Consulta actualizada correctamente",
      consultation,
      appointment,
    };
  }

  async generatePrescriptionPdf(id: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
      relations: ["patient"],
    });

    if (!consultation) {
      throw new AppError(404, "Consulta no encontrada");
    }

    if (consultation.templateKey === "podology") {
      throw new AppError(
        400,
        "Las consultas de podología no generan receta médica"
      );
    }

    const patient = consultation.patient;
    if (!patient) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const staff = await this.staffRepo.findOneBy({
      id: consultation.doctorId,
    });
    const staffName = staff?.name || null;
    const staffCedula = staff?.cedula || "No registrada";

    const prescribedMedications = parseJsonField(
      consultation.prescribedMedications
    );
    const logoPath = imageToBase64(
      path.resolve(__dirname, "../utils/assets/logo.png")
    );

    const generalInstructionsHtml = new Handlebars.SafeString(
      Handlebars.escapeExpression(
        consultation.generalInstructions || "Ninguna"
      ).replace(/\r?\n/g, "<br>")
    );

    const requestedStudiesText =
      (consultation as any).requestedStudies ||
      (consultation as any).requestStudies ||
      "Ninguna";

    const context: any = {
      patientName: `${(patient.firstName || "").trim()} ${(patient.lastName || "").trim()}`.trim(),
      diagnosis: consultation.diagnosis || "No registrado",
      generalInstructions: generalInstructionsHtml,
      prescribedMedications,
      requestedStudies: requestedStudiesText,
      requestStudies: requestedStudiesText,
      currentDate: new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      logoPath,
      staffName,
      staffCedula,
    };

    if (consultation.nextAppointment) {
      context.nextAppointment = new Date(
        consultation.nextAppointment
      ).toLocaleString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    const htmlPath = path.join(__dirname, "..", "templates", "prescription.hbs");
    const source = fs.readFileSync(htmlPath, "utf8");
    const template = Handlebars.compile(source);
    const html = template(context);
    const pdfBuffer = await renderHtmlToPdf(html);

    const filename = `receta-${(patient.firstName || "").trim()}-${(patient.lastName || "").trim()}-${new Date().toISOString().split("T")[0]}.pdf`;

    return { buffer: pdfBuffer, filename };
  }

  async generatePodologyReportPdf(id: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
      relations: ["patient"],
    });

    if (!consultation) {
      throw new AppError(404, "Consulta no encontrada");
    }

    if (consultation.templateKey !== "podology") {
      throw new AppError(
        400,
        "Solo las consultas de podología generan este reporte"
      );
    }

    const patient = consultation.patient;
    if (!patient) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const staff = await this.staffRepo.findOneBy({
      id: consultation.doctorId,
    });

    const specialty = parseSpecialtyObject(consultation.specialtyData);
    const conditions =
      specialty.conditions && typeof specialty.conditions === "object"
        ? specialty.conditions
        : {};

    const markedConditions = PODOLOGY_CONDITION_LABELS.filter((item) => {
      const side = conditions[item.key];
      return Boolean(side?.left || side?.right);
    });

    const conditionRows: Array<{
      leftLabel: string;
      leftLeft: string;
      leftRight: string;
      rightLabel: string;
      rightLeft: string;
      rightRight: string;
    }> = [];

    for (let i = 0; i < PODOLOGY_CONDITION_LABELS.length; i += 2) {
      const left = PODOLOGY_CONDITION_LABELS[i];
      const right = PODOLOGY_CONDITION_LABELS[i + 1];
      const leftSide = conditions[left.key] || {};
      const rightSide = right ? conditions[right.key] || {} : {};

      conditionRows.push({
        leftLabel: left.label,
        leftLeft: markSide(leftSide.left),
        leftRight: markSide(leftSide.right),
        rightLabel: right?.label || "",
        rightLeft: right ? markSide(rightSide.left) : "",
        rightRight: right ? markSide(rightSide.right) : "",
      });
    }

    let referralText = "No registrada";
    if (specialty.hasReferral === true) {
      referralText = specialty.referralTo
        ? `Sí · ${specialty.referralTo}`
        : "Sí";
    } else if (specialty.hasReferral === false) {
      referralText = "No";
    }

    const logoPath = imageToBase64(
      path.resolve(__dirname, "../utils/assets/logo.png")
    );

    const context = {
      logoPath,
      patientName:
        `${(patient.firstName || "").trim()} ${(patient.lastName || "").trim()}`.trim() ||
        "Paciente",
      followUpDate: formatFollowUpDate(
        specialty.followUpDate || consultation.consultationDate
      ),
      staffName: staff?.name || "No registrado",
      staffCedula: staff?.cedula || "No registrada",
      initialObservations: specialty.initialObservations || "",
      conditions: markedConditions,
      conditionRows,
      footTypeRight:
        PODOLOGY_FOOT_TYPE_LABELS[specialty.footTypeRight] || "No registrado",
      footTypeLeft:
        PODOLOGY_FOOT_TYPE_LABELS[specialty.footTypeLeft] || "No registrado",
      feetDiagramDataUrl: specialty.feetDiagramDataUrl || "",
      explorationNotes: specialty.explorationNotes || "",
      referralText,
      therapeutics: specialty.therapeutics || "",
      treatment: specialty.treatment || "",
      consentAccepted: Boolean(specialty.consentAccepted),
      consentText: PODOLOGY_CONSENT_TEXT,
      patientSignatureDataUrl: specialty.patientSignatureDataUrl || "",
      podologistSignatureDataUrl: specialty.podologistSignatureDataUrl || "",
      generatedAt: new Date().toLocaleString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const htmlPath = path.join(
      __dirname,
      "..",
      "templates",
      "podology-report.hbs"
    );
    const source = fs.readFileSync(htmlPath, "utf8");
    const template = Handlebars.compile(source);
    const html = template(context);
    const pdfBuffer = await renderHtmlToPdf(html);

    const filename = `seguimiento-podologia-${(patient.firstName || "").trim()}-${(patient.lastName || "").trim()}-${new Date().toISOString().split("T")[0]}.pdf`;

    return { buffer: pdfBuffer, filename };
  }
}

export const consultationService = new ConsultationService();
