# SQL — PostgreSQL

Script para crear el esquema en PostgreSQL local (pgAdmin o psql).

## Uso

1. Crear la base de datos vacía (ej. `servicios_medicos`).
2. Ejecutar `postgres/001-schema.sql` en Query Tool.
3. Si la BD ya existía, aplicar también los scripts `002-*.sql` y `003-*.sql` pendientes.

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

Los adjuntos de pacientes se guardan en `public/uploads/` (servidos en `/uploads/...`).

No uses `DB_SYNC=true` en producción si ya aplicaste este script.
