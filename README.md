# Servicios Médicos RISE — Backend

API Express + TypeORM + PostgreSQL (Supabase) para el panel clínico y el sitio público.

## Requisitos

- Node.js 20+
- PostgreSQL (Supabase u otra instancia)

## Arranque

```bash
cp .env.example .env
npm install
npm run dev
```

Build producción:

```bash
npm run build
npm start
```

## Variables de entorno

Ver `.env.example`.

| Variable | Uso |
|----------|-----|
| `DB_*` | Conexión PostgreSQL |
| `DB_SSL` | `true` para Supabase |
| `DB_SYNC` | `true` solo si quieres que TypeORM cree/altere tablas |
| `SUPABASE_URL` | Project URL (Storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` para subir/borrar adjuntos |
| `SUPABASE_STORAGE_BUCKET` | Bucket (`rise-uploads`) |
| `PORT` | Puerto HTTP (default `3000`) |
| `JWT_SECRET` | Firma de tokens del staff |
| `MAIL_*` | SMTP Gmail para notificar solicitudes web |

### Correo (ya implementado)

Las solicitudes de **cita** y **duda** desde la landing:

1. Se guardan en BD (`web_inquiries`)
2. Se listan en el panel (`/admin/solicitudes`)
3. Se envía un correo a `MAIL_TO` (Gmail + **contraseña de aplicación**, sin espacios)

Si `MAIL_PASS` está vacío, la solicitud igual se guarda; solo se omite el correo.

---

## WhatsApp masivo (evaluación futura — no implementado)

Idea: avisar o enviar mensajes a pacientes (recordatorios, avisos generales) por WhatsApp, similar al flujo de correo pero masivo.

### ¿Twilio manda por WhatsApp?

**Sí.** Twilio actúa como proveedor de la **WhatsApp Business API** oficial de Meta. También ofrece SMS.

### ¿Se paga?

**Sí.** No es gratis como el SMTP de Gmail con app password.

Costos típicos:

- Cuenta / número o sender de WhatsApp aprobado
- Cobro por mensaje o conversación (varía por país y tipo de plantilla)
- Hay crédito de prueba en Twilio; luego se recarga

Cotizar en: [https://www.twilio.com/whatsapp](https://www.twilio.com/whatsapp) / pricing de WhatsApp.

### Reglas importantes (Meta / WhatsApp)

1. El paciente debe haber **aceptado** recibir mensajes (opt-in).
2. Los envíos masivos o el primer mensaje saliente usan **plantillas aprobadas** por Meta.
3. No usar bots no oficiales (WhatsApp Web scrapers): se banean y violan términos.

### Casos de uso útiles para la clínica

| Caso | ¿Conviene WhatsApp API? |
|------|-------------------------|
| Recordatorio de cita | Alto valor, buen primer paso |
| Aviso de cierre / horario | Sí, con plantilla + lista opt-in |
| Marketing masivo genérico | Solo a quienes dieron permiso |
| Abrir chat manual (`wa.me`) | Gratis; ya existe en la landing, no es masivo automático |

### Qué habría que agregar en el sistema (si se decide)

1. **Cuenta Twilio** + WhatsApp sender aprobado + plantillas.
2. Campos en paciente: teléfono E.164, `whatsappOptIn`, fecha de consentimiento.
3. Backend: servicio `whatsapp.service.ts` (Twilio SDK), envío de plantillas.
4. Admin: pantalla “Enviar aviso” (filtros de pacientes + plantilla + historial).
5. Variables sugeridas (cuando se implemente):

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Alternativas más baratas / simples

- **Correo masivo** (ya hay base SMTP)
- **SMS** vía Twilio (a veces más simple que WhatsApp, también de pago)
- **Telegram bot** (barato, pero pocos pacientes lo usan)
- Botón **Abrir WhatsApp** en Solicitudes (manual, $0)

### Decisión pendiente

Dejar WhatsApp API para cuando:

- Haya volumen real de recordatorios/avisos
- Esté claro el presupuesto mensual
- Se pueda pedir opt-in al dar de alta pacientes

Hasta entonces: panel de solicitudes + correo es suficiente.

---

## API relevante (sitio público / panel)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/clinic-settings` | No | Datos públicos (horario, tel, FB…) |
| `PUT` | `/api/v1/clinic-settings` | Staff | Editar configuración pública |
| `POST` | `/api/v1/web-inquiries/appointments` | No | Solicitud de cita |
| `POST` | `/api/v1/web-inquiries/contacts` | No | Duda / contacto |
| `GET` | `/api/v1/web-inquiries` | Staff | Listar solicitudes |
| `PATCH` | `/api/v1/web-inquiries/:id/status` | Staff | Cambiar estado |

---

## Plantillas de consulta (estáticas)

Al crear una consulta, el staff elige plantilla:

| `templateKey` | Estado |
|---------------|--------|
| `general` | Lista (formulario + receta actuales) |
| `podology` | Lista (seguimiento SEGUIMIENTO: exploración, tipo de pie, diagrama, firmas) |

Campo guardado en `consultations.templateKey`.

o whasapp cloud meta
