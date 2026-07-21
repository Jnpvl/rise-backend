-- Fix: FKs que TypeORM une a PKs UUID (evita uuid = varchar)
-- Ejecutar en SQL Editor de Supabase

ALTER TABLE consultations
  ALTER COLUMN "patientId" TYPE UUID USING "patientId"::uuid;

ALTER TABLE lab_results
  ALTER COLUMN "patientId" TYPE UUID USING "patientId"::uuid;

ALTER TABLE lab_results
  ALTER COLUMN "createdById" TYPE UUID USING "createdById"::uuid;
