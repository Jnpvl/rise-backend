-- Servicios Médicos RISE — esquema PostgreSQL
-- Ejecutar en pgAdmin Query Tool o psql (todo el archivo).
-- Nombres de tablas/columnas alineados con las entidades TypeORM (camelCase).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  cedula VARCHAR(30),
  "signatureDataUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  "birthDate" DATE NOT NULL,
  curp VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  address TEXT NOT NULL,
  occupation VARCHAR(100) NOT NULL,
  "educationLevel" VARCHAR(100) NOT NULL,
  "maritalStatus" VARCHAR(100),
  "guardianName" VARCHAR(150),
  "bloodType" VARCHAR(5) NOT NULL,
  allergies TEXT,
  "medicalConditions" TEXT,
  "currentMedications" TEXT,
  patologicos TEXT,
  "noPatologicos" TEXT,
  "initialNotes" TEXT,
  "createdById" VARCHAR(36),
  "createdByName" VARCHAR(150),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- consultations
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "doctorId" VARCHAR(36) NOT NULL,
  "consultationTypeId" VARCHAR(200) NOT NULL,
  "templateKey" VARCHAR(30) NOT NULL DEFAULT 'general',
  "specialtyData" TEXT,
  "consultationDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reasonForConsultation" TEXT NOT NULL,
  "initialObservations" TEXT,
  "bloodPressure" VARCHAR(20),
  "heartRate" VARCHAR(20),
  "respiratoryRate" VARCHAR(20),
  temperature VARCHAR(20),
  "oxygenSaturation" VARCHAR(20),
  weight DECIMAL(5, 2),
  height DECIMAL(5, 2),
  bmi DECIMAL(5, 2),
  "physicalExam" TEXT,
  "currentCondition" TEXT,
  "systemReview" TEXT,
  diagnosis TEXT NOT NULL,
  "generalInstructions" TEXT,
  "prescribedMedications" TEXT,
  "requestedStudies" TEXT,
  "nextAppointment" TIMESTAMPTZ,
  "additionalNotes" TEXT,
  "attachedDocuments" TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations ("patientId");

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" VARCHAR(36) NOT NULL,
  "patientName" VARCHAR(200) NOT NULL,
  "doctorId" VARCHAR(36) NOT NULL,
  "doctorName" VARCHAR(200) NOT NULL,
  "scheduledDate" VARCHAR(50) NOT NULL,
  "durationMinutes" INT DEFAULT 30,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  "cancellationReason" TEXT,
  "createdById" VARCHAR(36),
  "createdByName" VARCHAR(200),
  "consultationId" VARCHAR(36),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments ("patientId");
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments ("doctorId");
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments ("scheduledDate");

-- clinic_settings
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horario VARCHAR(255) NOT NULL DEFAULT '',
  telefono VARCHAR(50) NOT NULL DEFAULT '',
  whatsapp VARCHAR(50) NOT NULL DEFAULT '',
  ubicacion VARCHAR(255) NOT NULL DEFAULT '',
  "facebookUrl" VARCHAR(500) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- web_inquiries
CREATE TABLE IF NOT EXISTS web_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(150),
  "preferredDate" TIMESTAMPTZ,
  reason TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_inquiries_status ON web_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_web_inquiries_type ON web_inquiries (type);

-- lab_results
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "studyDate" DATE NOT NULL,
  "generalNotes" TEXT,
  panels TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results ("patientId");
