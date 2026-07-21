import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Staff } from "../entities/Staff.entity";
import { Patient } from "../entities/Patient.entity";
import { Consultation } from "../entities/consultations.entity";
import { Appointment } from "../entities/Appointment.entity";
import { ClinicSettings } from "../entities/ClinicSettings.entity";
import { WebInquiry } from "../entities/WebInquiry.entity";
import { LabResult } from "../entities/LabResult.entity";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "postgres",
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
  synchronize: process.env.DB_SYNC === "true",
  entities: [
    Staff,
    Patient,
    Consultation,
    Appointment,
    ClinicSettings,
    WebInquiry,
    LabResult,
  ],
});

export const initializeDatabases = async () => {
  try {
    await AppDataSource.initialize();
    console.log("PostgreSQL conectado");
  } catch (error) {
    console.error("Error conectando a las bases de datos:", error);
    throw error;
  }
};
