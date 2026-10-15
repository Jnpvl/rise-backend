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

  /** Cédula profesional federal (SEP/DGP). Columna histórica "cedula". */
  @Column({ type: "varchar", length: 30, nullable: true })
  cedula!: string;

  /** Cédula profesional estatal. */
  @Column({ type: "varchar", length: 30, nullable: true })
  cedulaEstatal?: string;

  /** Universidad que otorgó el título. */
  @Column({ type: "varchar", length: 150, nullable: true })
  universidad?: string;

  /** Permiso para ejercer (opcional). */
  @Column({ type: "varchar", length: 60, nullable: true })
  permisoEjercer?: string;

  /** Firma manuscrita en base64 (data URL) para documentos PDF */
  @Column({ type: "text", nullable: true })
  signatureDataUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
