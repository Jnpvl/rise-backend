import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("clinic_settings")
export class ClinicSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  horario!: string;

  @Column({ type: "varchar", length: 50, default: "" })
  telefono!: string;

  @Column({ type: "varchar", length: 50, default: "" })
  whatsapp!: string;

  @Column({ type: "varchar", length: 255, default: "" })
  ubicacion!: string;

  @Column({ type: "varchar", length: 500, default: "" })
  facebookUrl!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
