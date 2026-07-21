import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type WebInquiryType = "appointment" | "contact";
export type WebInquiryStatus =
  | "pending"
  | "scheduled"
  | "cancelled"
  | "resolved";

@Entity("web_inquiries")
export class WebInquiry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20 })
  type!: WebInquiryType;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  email!: string | null;

  @Column({ type: "datetime", nullable: true })
  preferredDate!: Date | null;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: WebInquiryStatus;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;
}
