import { AppDataSource } from "../config/database";
import { Appointment } from "../entities/Appointment.entity";
import { Patient } from "../entities/Patient.entity";
import { Staff } from "../entities/Staff.entity";
import { AppError } from "../utils/app-error";

function mapConflict(apt: Appointment) {
  return {
    id: apt.id,
    scheduledDate: apt.scheduledDate,
    durationMinutes: apt.durationMinutes,
    patientName: apt.patientName,
  };
}

/** Normalize to `YYYY-MM-DDTHH:mm` for calendar / datetime-local compatibility. */
export function toLocalDateTimeValue(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) {
    throw new AppError(400, "Fecha de cita inválida");
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export class AppointmentService {
  private appointmentRepo = AppDataSource.getRepository(Appointment);
  private patientRepo = AppDataSource.getRepository(Patient);
  private staffRepo = AppDataSource.getRepository(Staff);

  private async resolveCreator(user?: { id: string; role: string }) {
    if (!user?.id) {
      return { createdById: undefined as string | undefined, createdByName: undefined as string | undefined };
    }
    const staff = await this.staffRepo.findOneBy({ id: user.id });
    return {
      createdById: user.id,
      createdByName: staff?.name || "Usuario",
    };
  }

  private async findConflicts(
    doctorId: string,
    start: Date,
    end: Date,
    excludeId?: string
  ) {
    const qb = this.appointmentRepo
      .createQueryBuilder("appointment")
      .where("appointment.doctorId = :doctorId", { doctorId })
      .andWhere("appointment.status IN (:...statuses)", {
        statuses: ["scheduled", "confirmed"],
      })
      .andWhere("appointment.scheduledDate BETWEEN :startTime AND :endTime", {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

    if (excludeId) {
      qb.andWhere("appointment.id != :currentId", { currentId: excludeId });
    }

    return qb.getMany();
  }

  async create(data: any, user?: { id: string; role: string }) {
    if (!data.patientId || !data.doctorId || !data.scheduledDate) {
      throw new AppError(
        400,
        "Faltan campos obligatorios: patientId, doctorId, scheduledDate"
      );
    }

    const patient = await this.patientRepo.findOneBy({ id: data.patientId });
    if (!patient || !patient.isActive) {
      throw new AppError(
        404,
        "El paciente especificado no existe o está inactivo"
      );
    }

    const doctor = await this.staffRepo.findOneBy({ id: data.doctorId });
    if (!doctor || !doctor.isActive) {
      throw new AppError(
        404,
        "El doctor especificado no existe o está inactivo"
      );
    }

    const scheduledDate = toLocalDateTimeValue(data.scheduledDate);
    const scheduledDateObj = new Date(scheduledDate);
    if (scheduledDateObj <= new Date()) {
      throw new AppError(400, "La fecha de la cita no puede ser en el pasado");
    }

    const duration = data.durationMinutes || 30;
    const endTime = new Date(scheduledDateObj.getTime() + duration * 60000);
    const conflicting = await this.findConflicts(
      data.doctorId,
      scheduledDateObj,
      endTime
    );

    if (conflicting.length > 0) {
      throw new AppError(
        409,
        "El doctor ya tiene una cita programada en ese horario",
        { conflictingAppointments: conflicting.map(mapConflict) }
      );
    }

    const { createdById, createdByName } = await this.resolveCreator(user);

    const appointment = this.appointmentRepo.create({
      patientId: data.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: data.doctorId,
      doctorName: doctor.name,
      scheduledDate,
      durationMinutes: duration,
      notes: data.notes || null,
      status: "scheduled",
      createdById,
      createdByName,
      consultationId: data.consultationId || null,
    });

    await this.appointmentRepo.save(appointment);

    return {
      message: "Cita programada correctamente",
      appointment: { ...appointment, scheduledDate: appointment.scheduledDate },
    };
  }

  /**
   * Creates or updates the calendar appointment linked to a consultation's next visit.
   */
  async ensureFromConsultation(
    opts: {
      consultationId: string;
      patientId: string;
      doctorId: string;
      scheduledDate: Date | string;
      consultationType?: string;
    },
    user?: { id: string; role: string }
  ) {
    const scheduledDate = toLocalDateTimeValue(opts.scheduledDate);

    const existingList = await this.appointmentRepo.find({
      where: { consultationId: opts.consultationId },
      order: { createdAt: "DESC" },
      take: 1,
    });
    const existing = existingList[0];

    if (
      existing &&
      (existing.status === "scheduled" || existing.status === "confirmed")
    ) {
      return this.update(existing.id, {
        patientId: opts.patientId,
        doctorId: opts.doctorId,
        scheduledDate,
      });
    }

    return this.create(
      {
        patientId: opts.patientId,
        doctorId: opts.doctorId,
        scheduledDate,
        durationMinutes: 30,
        consultationId: opts.consultationId,
      },
      user
    );
  }

  async list(filters: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const pageNumber = parseInt(String(filters.page ?? "1"), 10);
    const limitNumber = parseInt(String(filters.limit ?? "500"), 10);
    const skip = (pageNumber - 1) * limitNumber;

    let query = this.appointmentRepo.createQueryBuilder("appointment");

    if (filters.doctorId) {
      query = query.andWhere("appointment.doctorId = :doctorId", {
        doctorId: filters.doctorId,
      });
    }
    if (filters.patientId) {
      query = query.andWhere("appointment.patientId = :patientId", {
        patientId: filters.patientId,
      });
    }
    if (filters.status) {
      query = query.andWhere("appointment.status = :status", {
        status: filters.status,
      });
    }
    if (filters.startDate && filters.endDate) {
      query = query.andWhere(
        "appointment.scheduledDate >= :startDate AND appointment.scheduledDate < :endDate",
        { startDate: filters.startDate, endDate: filters.endDate }
      );
    }

    const [appointments, total] = await query
      .orderBy("appointment.scheduledDate", "ASC")
      .skip(skip)
      .take(limitNumber)
      .getManyAndCount();

    return {
      total,
      page: pageNumber,
      limit: limitNumber,
      appointments: appointments.map((a) => ({
        ...a,
        scheduledDate: a.scheduledDate,
      })),
    };
  }

  async getById(id: string) {
    const appointment = await this.appointmentRepo.findOneBy({ id });
    if (!appointment) {
      throw new AppError(404, "Cita no encontrada");
    }
    return { ...appointment, scheduledDate: appointment.scheduledDate };
  }

  async update(id: string, data: any) {
    const appointment = await this.appointmentRepo.findOneBy({ id });
    if (!appointment) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (
      appointment.status === "completed" ||
      appointment.status === "cancelled"
    ) {
      throw new AppError(
        400,
        "No se puede modificar una cita completada o cancelada"
      );
    }

    if (data.patientId && data.patientId !== appointment.patientId) {
      const patient = await this.patientRepo.findOneBy({ id: data.patientId });
      if (!patient || !patient.isActive) {
        throw new AppError(
          404,
          "El paciente especificado no existe o está inactivo"
        );
      }
      appointment.patientId = data.patientId;
      appointment.patientName = `${patient.firstName} ${patient.lastName}`;
    }

    if (data.doctorId && data.doctorId !== appointment.doctorId) {
      const doctor = await this.staffRepo.findOneBy({ id: data.doctorId });
      if (!doctor || !doctor.isActive) {
        throw new AppError(
          404,
          "El doctor especificado no existe o está inactivo"
        );
      }
      appointment.doctorId = data.doctorId;
      appointment.doctorName = doctor.name;
    }

    if (data.scheduledDate) {
      const newScheduledDateObj = new Date(data.scheduledDate);
      if (newScheduledDateObj <= new Date()) {
        throw new AppError(400, "La fecha de la cita no puede ser en el pasado");
      }

      const duration =
        data.durationMinutes || appointment.durationMinutes || 30;
      const endTime = new Date(
        newScheduledDateObj.getTime() + duration * 60000
      );
      const conflicting = await this.findConflicts(
        appointment.doctorId,
        newScheduledDateObj,
        endTime,
        id
      );

      if (conflicting.length > 0) {
        throw new AppError(
          409,
          "El doctor ya tiene una cita programada en ese horario",
          { conflictingAppointments: conflicting.map(mapConflict) }
        );
      }

      appointment.scheduledDate = data.scheduledDate;
    }

    if (data.durationMinutes !== undefined) {
      appointment.durationMinutes = data.durationMinutes;
    }
    if (data.notes !== undefined) {
      appointment.notes = data.notes;
    }
    if (
      data.status &&
      ["scheduled", "confirmed", "cancelled", "completed", "no_show"].includes(
        data.status
      )
    ) {
      appointment.status = data.status;
      if (data.status === "cancelled" && data.cancellationReason) {
        appointment.cancellationReason = data.cancellationReason;
      }
    }

    await this.appointmentRepo.save(appointment);

    return {
      message: "Cita actualizada correctamente",
      appointment: {
        ...appointment,
        scheduledDate: appointment.scheduledDate,
      },
    };
  }

  async remove(id: string) {
    const appointment = await this.appointmentRepo.findOneBy({ id });
    if (!appointment) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (new Date(appointment.scheduledDate) <= new Date()) {
      throw new AppError(400, "No se puede eliminar una cita que ya pasó");
    }

    await this.appointmentRepo.remove(appointment);
    return { message: "Cita eliminada correctamente" };
  }

  async getDoctorSchedule(doctorId: string, date: string) {
    if (!doctorId || !date) {
      throw new AppError(400, "Se requiere doctorId y date");
    }

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointments = await this.appointmentRepo
      .createQueryBuilder("appointment")
      .where("appointment.doctorId = :doctorId", { doctorId })
      .andWhere(
        "appointment.scheduledDate >= :startDate AND appointment.scheduledDate < :endDate",
        {
          startDate: targetDate.toISOString(),
          endDate: nextDay.toISOString(),
        }
      )
      .andWhere("appointment.status IN (:...statuses)", {
        statuses: ["scheduled", "confirmed"],
      })
      .orderBy("appointment.scheduledDate", "ASC")
      .getMany();

    return {
      doctorId,
      date: targetDate,
      appointments: appointments.map((a) => ({
        ...a,
        scheduledDate: a.scheduledDate,
      })),
    };
  }
}

export const appointmentService = new AppointmentService();
