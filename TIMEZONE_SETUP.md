# Configuración de Zona Horaria - Sistema de Citas Médicas

## Problema Identificado

El sistema tenía inconsistencias en el manejo de fechas entre el backend y frontend:
- **Backend**: Guardaba las fechas correctamente (ej: 7:30 AM)
- **Frontend**: Mostraba las fechas con 7 horas de diferencia (ej: 2:30 PM)
- **Causa**: Conversión automática de UTC a zona horaria local

## Solución Implementada

### 1. Configuración de Base de Datos

Se configuró SQL Server para trabajar con la zona horaria local:

```typescript
// src/config/database.ts
extra: {
    options: {
        encrypt: true,
        trustServerCertificate: true,
        timezone: 'America/Mexico_City', // Ajusta según tu zona horaria
    },
}
```

### 2. Configuración Centralizada de Zona Horaria

Se creó un archivo de configuración centralizada:

```typescript
// src/config/timezone.ts
export const TIMEZONE_CONFIG = {
  DEFAULT_TIMEZONE: 'America/Mexico_City',
  DEFAULT_OFFSET: -6,
  
  formatDateForLocal(date: Date): string {
    return date.toISOString().replace('Z', '');
  },
  
  parseDateFromLocal(dateString: string): Date {
    if (!dateString.endsWith('Z')) {
      return new Date(dateString);
    }
    return new Date(dateString);
  }
};
```

### 3. Modificación de Controladores

Todos los controladores ahora formatean las fechas correctamente:

```typescript
// Antes
scheduledDate: appointment.scheduledDate.toISOString()

// Después
scheduledDate: TIMEZONE_CONFIG.formatDateForLocal(appointment.scheduledDate)
```

### 4. Modificación del Frontend

El frontend ahora maneja las fechas sin conversión UTC:

```typescript
// Antes
scheduledDate: new Date(formValues.scheduledDate).toISOString()

// Después
scheduledDate: formValues.scheduledDate // El servicio se encarga del formato
```

## Zonas Horarias Soportadas

El sistema incluye soporte para las principales zonas horarias de México:

- `America/Mexico_City` - Hora del Centro (CST/CDT) - **Recomendada**
- `America/Tijuana` - Hora del Pacífico (PST/PDT)
- `America/Mazatlan` - Hora del Pacífico (PST/PDT)
- `America/Hermosillo` - Hora del Pacífico (PST)
- `America/Chihuahua` - Hora del Centro (CST/CDT)
- `America/Monterrey` - Hora del Centro (CST/CDT)
- `America/Matamoros` - Hora del Centro (CST/CDT)
- `America/Merida` - Hora del Centro (CST/CDT)
- `America/Cancun` - Hora del Este (EST/EDT)

## Configuración del Sistema

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Configuración de Zona Horaria
TZ=America/Mexico_City

# Otras configuraciones...
DB_HOST=database
DB_PORT=50970
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
PORT=8080
```

### Configuración del Sistema Operativo

#### Linux/macOS
```bash
# Ver zona horaria actual
timedatectl

# Cambiar zona horaria
sudo timedatectl set-timezone America/Mexico_City

# O exportar variable de entorno
export TZ=America/Mexico_City
```

#### Windows
```cmd
# Ver zona horaria actual
tzutil /g

# Cambiar zona horaria
tzutil /s "Central Standard Time"
```

## Verificación

### 1. Crear una Cita
- Programar una cita para las 7:30 AM
- Verificar que se guarde correctamente en la base de datos

### 2. Verificar en el Frontend
- La cita debe aparecer a las 7:30 AM, no a las 2:30 PM
- No debe haber diferencia de 7 horas

### 3. Verificar en la Base de Datos
```sql
SELECT 
    id,
    patientName,
    scheduledDate,
    CONVERT(VARCHAR, scheduledDate, 120) as formattedDate
FROM appointments 
WHERE scheduledDate >= GETDATE()
ORDER BY scheduledDate DESC;
```

## Troubleshooting

### Problema: Las fechas siguen apareciendo con diferencia horaria

**Solución 1**: Verificar configuración de SQL Server
```sql
-- Verificar configuración de zona horaria
SELECT @@SERVERNAME as ServerName,
       SERVERPROPERTY('MachineName') as MachineName,
       SERVERPROPERTY('InstanceName') as InstanceName,
       GETDATE() as CurrentDateTime,
       GETUTCDATE() as CurrentUTCDateTime;
```

**Solución 2**: Verificar variable de entorno TZ
```bash
echo $TZ
# Debe mostrar: America/Mexico_City
```

**Solución 3**: Reiniciar el servidor después de cambios
```bash
npm run dev
```

### Problema: Diferentes zonas horarias en el equipo

**Solución**: Asegurar que todos los equipos usen la misma zona horaria
```bash
# En cada equipo
export TZ=America/Mexico_City
```

## Notas Importantes

1. **Cambio de Horario de Verano**: El sistema maneja automáticamente el cambio de horario
2. **Base de Datos**: SQL Server debe estar configurado para la zona horaria correcta
3. **Frontend**: Angular interpreta las fechas según la zona horaria del navegador
4. **Backend**: Node.js usa la zona horaria del sistema operativo

## Próximos Pasos

1. **Monitoreo**: Verificar que las fechas se muestren correctamente
2. **Testing**: Probar con diferentes zonas horarias
3. **Documentación**: Actualizar la documentación de la API
4. **Logs**: Agregar logs para debugging de fechas
