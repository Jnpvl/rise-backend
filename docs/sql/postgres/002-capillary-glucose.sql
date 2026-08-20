-- Glucosa capilar (DxTx) en consulta general
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS "capillaryGlucose" VARCHAR(20);
