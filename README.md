# Servicios Médicos RISE — Backend

API Express + TypeORM + PostgreSQL para el panel clínico y el sitio público.

## Requisitos

- Node.js 20+
- PostgreSQL (local o en red)

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

## Despliegue a producción

El workflow `.github/workflows/main.yml` se ejecuta en cada push a `main` y también se puede lanzar manualmente desde GitHub Actions con **Run workflow**. Primero corre una verificación rápida en Ubuntu (`npm ci` y `npm run build`); si el build falla, no despliega.

Cuando el build pasa, el job de deploy se conecta por SSH al droplet de DigitalOcean, entra a `/var/www/rise`, ejecuta `git pull --ff-only origin main`, corre `npm ci` solo si cambió `package-lock.json` o falta `node_modules`, compila y reinicia PM2 con `pm2 restart rise --update-env`. El `.env` real vive en el servidor y el workflow no lo crea ni lo sobrescribe.

Secretos requeridos en el repositorio:

- `DROPLET_HOST`: IP del droplet.
- `DROPLET_USER`: usuario SSH del droplet, actualmente `root`.
- `DROPLET_SSH_KEY`: clave privada ed25519 autorizada para ese usuario.

Al final del deploy se valida `https://api.serviciosmedicosrise.com/`: debe responder HTTP 404 con `X-Robots-Tag: noindex, nofollow`.

## Variables de entorno

Ver `.env.example`.

| Variable | Uso |
|----------|-----|
| `DB_*` | Conexión PostgreSQL |
| `PORT` | Puerto HTTP (default `3000`) |
| `JWT_SECRET` | Firma de tokens del staff |
| `MAIL_*` | SMTP Gmail para notificar solicitudes web |

Opcional (por defecto no hace falta): `DB_SSL=true` si Postgres exige SSL; `DB_SYNC=true` solo en desarrollo para que TypeORM cree tablas solo.

Los adjuntos de pacientes se guardan en `public/uploads/` (URL `/uploads/...`). Esa carpeta está **fuera de `dist/`**, así que actualizar el build no borra los archivos.

En producción puedes fijar una ruta absoluta con `UPLOADS_DIR` (ej. `/var/lib/servicios-medicos/uploads`) para separar datos del código desplegado.

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
