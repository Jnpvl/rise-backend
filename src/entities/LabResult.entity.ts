import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { Patient } from "./Patient.entity";
import { Staff } from "./Staff.entity";

@Entity("lab_results")
export class LabResult {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  patientId!: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patientId" })
  patient!: Patient;

  @Column({ type: "uuid" })
  createdById!: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: "createdById" })
  createdBy!: Staff;

  @Column({ type: "date" })
  studyDate!: string;

  @Column({ type: "text", nullable: true })
  generalNotes?: string;

  /** Panels + rows payload as JSON string */
  @Column({ type: "text" })
  panels!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
