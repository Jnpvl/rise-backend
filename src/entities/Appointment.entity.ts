import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("appointments")
export class Appointment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  patientId!: string;

  @Column({ type: "varchar", length: 200 })
  patientName!: string;

  @Column({ type: "varchar", length: 36 })
  doctorId!: string;

  @Column({ type: "varchar", length: 200 })
  doctorName!: string;

  @Column({ type: "varchar", length: 50 })
  scheduledDate!: string;

  @Column({ type: "int", default: 30, nullable: true })
  durationMinutes?: number;

  @Column({ type: "varchar", length: 20, default: "scheduled" })
  status!: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "text", nullable: true })
  cancellationReason?: string;

  /** Staff who scheduled the appointment */
  @Column({ type: "varchar", length: 36, nullable: true })
  createdById?: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  createdByName?: string;

  /** When created from a consultation's "próxima cita" */
  @Column({ type: "varchar", length: 36, nullable: true })
  consultationId?: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
