# SQL para Supabase (PostgreSQL)

Scripts listos para pegar en **Supabase → SQL Editor**. No modifican el código TypeORM del backend.

## Orden

1. `postgres/001-schema.sql` — tablas del API
2. `postgres/002-storage.sql` — bucket de adjuntos `rise-uploads`
3. `postgres/003-fix-fk-uuid.sql` — solo si corriste el 001 antes del fix (FKs a UUID)

## Tablas

| Tabla | Entidad |
|-------|---------|
| `staff` | Staff |
| `patients` | Patient |
| `consultations` | Consultation |
| `appointments` | Appointment |
| `clinic_settings` | ClinicSettings |
| `web_inquiries` | WebInquiry |
| `lab_results` | LabResult |

Las columnas van en **camelCase** (`"firstName"`, `"createdAt"`, …) para coincidir con TypeORM sin `SnakeNamingStrategy`.

## Storage

Tras `002-storage.sql`, configura en el `.env` del backend:

- `SUPABASE_URL` — Project URL (Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` — `service_role` (secreto; no uses `anon`)
- `SUPABASE_STORAGE_BUCKET` — `rise-uploads`

Sin esas vars, los uploads caen a disco local.

## Notas

- No actives `DB_SYNC=true` en producción si ya corriste estos scripts a mano.
