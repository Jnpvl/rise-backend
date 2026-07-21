import { AppDataSource } from "../config/database";
import { Patient } from "../entities/Patient.entity";
import { Appointment } from "../entities/Appointment.entity";
import { Consultation } from "../entities/consultations.entity";
import { Staff } from "../entities/Staff.entity";

export type DashboardSummary = {
  patientsTotal: number;
  patientsActive: number;
  appointmentsToday: number;
  consultationsTotal: number;
  staffActive: number;
  upcomingAppointments: Array<{
    id: string;
    patientName: string;
    doctorName: string;
    scheduledDate: string;
    status: string;
    createdByName?: string;
  }>;
};

export class DashboardService {
  private patientRepo = AppDataSource.getRepository(Patient);
  private appointmentRepo = AppDataSource.getRepository(Appointment);
  private consultationRepo = AppDataSource.getRepository(Consultation);
  private staffRepo = AppDataSource.getRepository(Staff);

  private getTodayRange(): { start: string; end: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const start = `${y}-${m}-${d}T00:00`;
    const end = `${y}-${m}-${d}T23:59`;
    return { start, end };
  }

  async getSummary(): Promise<DashboardSummary> {
    const { start, end } = this.getTodayRange();

    const [
      patientsTotal,
      patientsActive,
      appointmentsToday,
      consultationsTotal,
      staffActive,
      upcoming,
    ] = await Promise.all([
      this.patientRepo.count(),
      this.patientRepo.count({ where: { isActive: true } }),
      this.appointmentRepo
        .createQueryBuilder("appointment")
        .where("appointment.scheduledDate >= :start", { start })
        .andWhere("appointment.scheduledDate <= :end", { end })
        .andWhere("appointment.status IN (:...statuses)", {
          statuses: ["scheduled", "confirmed"],
        })
        .getCount(),
      this.consultationRepo.count(),
      this.staffRepo.count({ where: { isActive: true } }),
      this.appointmentRepo
        .createQueryBuilder("appointment")
        .where("appointment.scheduledDate >= :start", { start })
        .andWhere("appointment.status IN (:...statuses)", {
          statuses: ["scheduled", "confirmed"],
        })
        .orderBy("appointment.scheduledDate", "ASC")
        .take(5)
        .getMany(),
    ]);

    return {
      patientsTotal,
      patientsActive,
      appointmentsToday,
      consultationsTotal,
      staffActive,
      upcomingAppointments: upcoming.map((a) => ({
        id: a.id,
        patientName: a.patientName,
        doctorName: a.doctorName,
        scheduledDate: a.scheduledDate,
        status: a.status,
        createdByName: a.createdByName,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
