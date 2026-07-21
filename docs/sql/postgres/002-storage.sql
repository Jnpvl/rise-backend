-- Servicios Médicos RISE — Storage (opcional)
-- Ejecutar en SQL Editor DESPUÉS de 001-schema.sql
-- Solo si vas a guardar adjuntos de pacientes en Supabase Storage
-- (en lugar del disco local `uploads/` de Render).

INSERT INTO storage.buckets (id, name, public)
VALUES ('rise-uploads', 'rise-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Lectura pública de objetos del bucket
DROP POLICY IF EXISTS "rise-uploads public read" ON storage.objects;
CREATE POLICY "rise-uploads public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rise-uploads');

-- El API sube con SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- No hace falta policy de INSERT para anon.
