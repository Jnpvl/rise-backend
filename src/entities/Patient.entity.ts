import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("patients")
export class Patient {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  firstName!: string;

  @Column({ type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "varchar", length: 10 })
  gender!: string;

  @Column({ type: "date" })
  birthDate!: Date;

  @Column({ type: "varchar", length: 20, nullable: true })
  curp?: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  email?: string;

  @Column({ type: "text" })
  address!: string;

  @Column({ type: "varchar", length: 100 })
  occupation!: string;

  @Column({ type: "varchar", length: 100 })
  educationLevel!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  maritalStatus?: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  guardianName?: string;

  @Column({ type: "varchar", length: 5 })
  bloodType!: string;

  @Column({ type: "text", nullable: true })
  allergies?: string;

  @Column({ type: "text", nullable: true })
  medicalConditions?: string;

  @Column({ type: "text", nullable: true })
  currentMedications?: string;

  @Column({ type: "text", nullable: true })
  patologicos?: string;

  @Column({ type: "text", nullable: true })
  noPatologicos?: string;

  @Column({ type: "text", nullable: true })
  initialNotes?: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  createdById?: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  createdByName?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
