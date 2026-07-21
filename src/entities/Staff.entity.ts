import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type StaffRole = "admin" | "auxiliar";

@Entity("staff")
export class Staff {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 100 })
  password!: string;

  @Column({ type: "varchar", length: 20, default: "admin" })
  role!: StaffRole;

  @Column({ type: "varchar", length: 30, nullable: true })
  cedula!: string;

  /** Firma manuscrita en base64 (data URL) para documentos PDF */
  @Column({ type: "longtext", nullable: true })
  signatureDataUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
