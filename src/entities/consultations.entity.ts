import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Patient } from "./Patient.entity";

@Entity("consultations")
export class Consultation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  patientId!: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patientId" })
  patient!: Patient;

  @Column({ type: "varchar", length: 36 })
  doctorId!: string;

  /** Free-text consultation type (formerly linked to procedure catalog). */
  @Column({ type: "varchar", length: 200 })
  consultationTypeId!: string;

  /** Static form/PDF template: general | podology */
  @Column({ type: "varchar", length: 30, default: "general" })
  templateKey!: string;

  /** Template-specific payload (e.g. podology follow-up form) as JSON string */
  @Column({ type: "text", nullable: true })
  specialtyData?: string;

  @CreateDateColumn({ type: "timestamptz" })
  consultationDate!: Date;

  @Column({ type: "text" })
  reasonForConsultation!: string;

  @Column({ type: "text", nullable: true })
  initialObservations?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  bloodPressure?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  heartRate?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  respiratoryRate?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  temperature?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  oxygenSaturation?: string;

  /** DxTx — glucosa capilar (consulta general) */
  @Column({ type: "varchar", length: 20, nullable: true })
  capillaryGlucose?: string;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  height?: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  bmi?: number;

  @Column({ type: "text", nullable: true })
  physicalExam?: string;

  @Column({ type: "text", nullable: true })
  currentCondition?: string;

  @Column({ type: "text", nullable: true })
  systemReview?: string;

  @Column({ type: "text" })
  diagnosis!: string;

  @Column({ type: "text", nullable: true })
  generalInstructions?: string;

  @Column({ type: "text", nullable: true })
  prescribedMedications?: string;

  @Column({ type: "text", nullable: true })
  requestedStudies?: string;

  @Column({ type: "timestamptz", nullable: true })
  nextAppointment?: Date;

  @Column({ type: "text", nullable: true })
  additionalNotes?: string;

  @Column({ type: "text", nullable: true })
  attachedDocuments?: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
