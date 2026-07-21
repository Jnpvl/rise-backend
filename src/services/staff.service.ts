import bcrypt from "bcrypt";
import { AppDataSource } from "../config/database";
import { Staff } from "../entities/Staff.entity";
import { generateJWT } from "../utils/jwt.utils";
import { AppError } from "../utils/app-error";

function normalizeSignature(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return "";
  if (!raw.startsWith("data:image/")) {
    throw new AppError(400, "La firma debe ser una imagen válida");
  }
  return raw;
}

function toPublicStaff(staff: Staff) {
  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    cedula: staff.cedula || "",
    signatureDataUrl: staff.signatureDataUrl || "",
    isActive: staff.isActive,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
}

export class StaffService {
  private staffRepo = AppDataSource.getRepository(Staff);

  async register(data: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    cedula?: string;
    signatureDataUrl?: string;
  }) {
    const { name, email, password, role, cedula } = data;
    if (!name || !email || !password || !role) {
      throw new AppError(400, "Faltan campos obligatorios");
    }

    const exists = await this.staffRepo.findOneBy({ email });
    if (exists) {
      throw new AppError(400, "Email ya registrado");
    }

    const signatureDataUrl = normalizeSignature(data.signatureDataUrl);

    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = this.staffRepo.create({
      name,
      email,
      password: hashedPassword,
      role: role as any,
      cedula: cedula || undefined,
      signatureDataUrl: signatureDataUrl || undefined,
    });
    await this.staffRepo.save(staff);

    return {
      message: "Staff registrado exitosamente",
      ...toPublicStaff(staff),
    };
  }

  async login(data: { email?: string; password?: string }) {
    const { email, password } = data;
    if (!email || !password) {
      throw new AppError(400, "Email y password son obligatorios");
    }

    const staff = await this.staffRepo.findOneBy({ email });
    if (!staff) {
      throw new AppError(400, "Email no registrado");
    }

    if (!staff.isActive) {
      throw new AppError(403, "Cuenta inactiva. Contacte al administrador.");
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      throw new AppError(400, "Contraseña incorrecta");
    }

    const token = generateJWT({ id: staff.id, role: staff.role });

    return {
      message: "Login exitoso",
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        cedula: staff.cedula || "",
        signatureDataUrl: staff.signatureDataUrl || "",
      },
      token,
    };
  }

  async getAll() {
    const staff = await this.staffRepo.find({
      order: { name: "ASC" },
    });
    return staff.map(toPublicStaff);
  }

  async getById(id: string) {
    const staff = await this.staffRepo.findOneBy({ id });
    if (!staff) {
      throw new AppError(404, "Staff no encontrado");
    }
    return toPublicStaff(staff);
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
      cedula?: string;
      signatureDataUrl?: string;
    }
  ) {
    const staff = await this.staffRepo.findOneBy({ id });
    if (!staff) {
      throw new AppError(404, "Staff no encontrado");
    }

    const { name, email, password, role, isActive, cedula } = data;
    if (
      !name &&
      !email &&
      !password &&
      !role &&
      isActive === undefined &&
      cedula === undefined &&
      data.signatureDataUrl === undefined
    ) {
      throw new AppError(400, "Debe enviar al menos un campo para actualizar.");
    }

    if (email && email !== staff.email) {
      const emailExist = await this.staffRepo.findOneBy({ email });
      if (emailExist) {
        throw new AppError(400, "Email ya registrado por otro usuario.");
      }
      staff.email = email;
    }

    if (name) staff.name = name;
    if (role) staff.role = role as any;
    if (isActive !== undefined) staff.isActive = isActive;
    if (cedula !== undefined) staff.cedula = cedula;
    if (password) {
      staff.password = await bcrypt.hash(password, 10);
    }
    if (data.signatureDataUrl !== undefined) {
      const signatureDataUrl = normalizeSignature(data.signatureDataUrl);
      staff.signatureDataUrl = signatureDataUrl || undefined;
    }

    await this.staffRepo.save(staff);

    return {
      message: "Staff actualizado correctamente",
      ...toPublicStaff(staff),
    };
  }

  async deactivate(id: string) {
    const staff = await this.staffRepo.findOneBy({ id });
    if (!staff) {
      throw new AppError(404, "Staff no encontrado");
    }

    staff.isActive = false;
    await this.staffRepo.save(staff);

    return { message: "Staff desactivado correctamente" };
  }
}

export const staffService = new StaffService();
