-- Receta: cédula estatal, universidad y permiso para ejercer del médico.
-- La columna existente "cedula" se conserva como cédula FEDERAL (sin mover datos).
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS "cedulaEstatal" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS universidad VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "permisoEjercer" VARCHAR(60);
