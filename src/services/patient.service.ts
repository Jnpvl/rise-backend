import { AppDataSource } from "../config/database";
import { Patient } from "../entities/Patient.entity";
import { Staff } from "../entities/Staff.entity";
import { AppError } from "../utils/app-error";

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

    const patient = this.patientRepo.create({
      ...data,
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

  async update(id: string, data: any) {
    const patient = await this.patientRepo.findOneBy({ id });
    if (!patient || !patient.isActive) {
      throw new AppError(404, "Paciente no encontrado");
    }

    const { createdById, createdByName, ...rest } = data;
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
