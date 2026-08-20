-- Datos físicos y contacto de emergencia en expediente del paciente
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS weight DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS height DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "shoeSize" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "emergencyContactName" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "emergencyContactPhone" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "emergencyContactAddress" TEXT;
