# Modelado de Base de Datos PostgreSQL: Integración WhatsApp Business v4 (Registro Insertado & Coexistencia)

Este documento presenta el diseño relacional de la base de datos para soportar el flujo de onboarding v4, la coexistencia (Cloud API & WhatsApp Business App), la gestión de agentes, conversaciones, contactos sincronizados y respaldos de chats por agentes de acuerdo con los requerimientos funcionales y la guía de Meta.

---

## 1. Diagrama de Entidad-Relación Conceptual

```
  +------------------+         +------------------+         +--------------------------+
  |    usuarios      | 1     1 |  fichas_usuarios |         |   whatsapp_channels      |
  | (Agente/Admin)   |---------| (Ficha Personal) |         |  (Canal Meta Cloud API)  |
  +------------------+         +------------------+         +--------------------------+
           | 1                          | 1                               | 1
           |                            |                                 |
           | 1:N                        | 1:N (Compara número)            | 1:N
           v                            v                                 v
  +------------------+         +------------------+         +--------------------------+
  |  conversaciones  | 1     N |     contactos    | 1     N |     sync_history_phases  |
  |  (Chats Sinc)    |---------|  (Directorio)    |         | (Control Ventanas Tiempo)|
  +------------------+         +------------------+         +--------------------------+
           | 1                          | 1
           |                            |
           | 1:N                        | 1:N (Sincronizados)
           v                            v
  +------------------+         +------------------+
  |     mensajes     |         |     respaldos    |
  | (Ecos / Envíos)  |         | (Chats x Agente) |
  +------------------+         +------------------+
```

---

## 2. Definición DDL (Data Definition Language) de Tablas PostgreSQL

### 2.1. Canales de WhatsApp (`whatsapp_channels`)
Almacena el estado técnico del canal de WhatsApp Business v4, los tokens devueltos tras el Embedded Signup, el tipo de onboarding y las credenciales de la Cloud API.

```sql
CREATE TABLE whatsapp_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waba_id VARCHAR(100) UNIQUE NOT NULL, -- ID de la Cuenta de WhatsApp Business (WABA ID)
    phone_number_id VARCHAR(100) UNIQUE NOT NULL, -- ID único del número (Phone Number ID)
    phone_number VARCHAR(20) UNIQUE NOT NULL, -- Número telefónico registrado
    display_name VARCHAR(100), -- Nombre de marca
    system_access_token TEXT NOT NULL, -- Token de acceso de 60 días generado tras el intercambio en 30s
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Fecha de expiración (60 días máximo)
    flow_finish_type VARCHAR(100), -- Ej. "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"
    feature_type VARCHAR(100) DEFAULT 'whatsapp_business_app_onboarding', -- Identifica coexistencia
    throughput_mps INTEGER DEFAULT 20, -- Rendimiento limitado de coexistencia (20 mps)
    max_linked_devices INTEGER DEFAULT 4, -- Límite de dispositivos (máximo 4)
    sync_window_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Ventana crítica de 24 horas para sincronizar
    status VARCHAR(30) DEFAULT 'CONNECTED', -- 'CONNECTED', 'DISCONNECTED', 'OFFBOARDED'
    offboarded_at TIMESTAMP WITH TIME ZONE,
    offboarded_reason VARCHAR(100), -- Ej. 'PARTNER_REMOVED' (initiated_by user vs system)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2. Fichas de Usuarios (`fichas_usuarios`)
La ficha de datos reales de cada persona contratada en el equipo. Mapea la información personal, foto, teléfono y cargo.

```sql
CREATE TABLE fichas_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Relación con el usuario del sistema
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    foto_url TEXT, -- Imagen de avatar registrada en la ficha
    telefono VARCHAR(20) UNIQUE NOT NULL, -- Número para comparar contra whatsapp_channels.phone_number
    cargo VARCHAR(100) NOT NULL, -- Puesto o rol laboral del agente
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3. Control de Fases de Sincronización (`sync_history_phases`)
Registra las ventanas de sincronización de datos de la SMB App Data API (Fases de Historial hasta 180 días). Al poder ejecutarse solo una vez por canal, esta tabla audita el ciclo exacto.

```sql
CREATE TABLE sync_history_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    phase_number INT NOT NULL, -- 0 (Día 0-1), 1 (Día 1-90), 2 (Día 90-180)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    text_messages_count INTEGER DEFAULT 0,
    media_messages_count INTEGER DEFAULT 0, -- Nota: Multimedia válido solo últimos 14 días
    sync_status VARCHAR(30) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    error_message TEXT,
    CONSTRAINT unique_phase_per_channel UNIQUE(whatsapp_channel_id, phase_number)
);
```

### 2.4. Directorio de Contactos (`contactos`)
Guarda todos los contactos sincronizados a través de `smb_app_state_sync`. Estos contactos son asignados y pertenecen al canal asociado.

```sql
CREATE TABLE contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_telefono_per_channel UNIQUE(whatsapp_channel_id, telefono)
);
```

### 2.5. Conversaciones (Chats Sincronizados) (`conversaciones`)
Guarda los hilos de conversaciones creados o recuperados desde la app de WhatsApp.

```sql
CREATE TABLE conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
    external_chat_id VARCHAR(100), -- ID único de chat del webhook de WhatsApp
    topic VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'waiting'
    unread_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6. Mensajes (`mensajes`)
Almacena el historial y los ecos procedentes de `smb_message_echoes` (cuando escriben en el teléfono) o el flujo interactivo de la Cloud API.

```sql
CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
    external_message_id VARCHAR(150) UNIQUE, -- ID devuelto por Meta (evita duplicidad)
    sender VARCHAR(30) NOT NULL, -- 'agent', 'client', 'supervisor', 'supervisor_as_agent'
    sender_name VARCHAR(100),
    text_content TEXT,
    media_url TEXT, -- Url de archivos/fotos (dentro del rango de 14 días de Meta)
    media_type VARCHAR(50), -- 'image/png', 'video/mp4', 'text', etc.
    source VARCHAR(30) DEFAULT 'whatsapp', -- 'whatsapp' (Echo), 'dashboard' (Cloud API), 'internal'
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Timestamp real del evento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.7. Respaldos por Agentes (`respaldos_agentes`)
Almacena las copias de seguridad de los chats descargados por los agentes y supervisores bajo demanda.

```sql
CREATE TABLE respaldos_agentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Agente titular
    descargado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Quién gatilló la descarga
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL, -- Ejemplo: "Backup_Chats_Agente_Juan_Perez_2024-11-20"
    file_url TEXT NOT NULL, -- Ruta segura de almacenamiento en el sistema
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Lógica de Negocio y Mapeo contra Requisitos Funcionales

### A. Conexión Exitosa y Generación de Tarjeta en Dashboard
Cuando se dispara el webhook `account_update` o el flujo del JavaScript SDK finaliza con éxito:
1. El backend inserta un registro en `whatsapp_channels`.
2. Se realiza una consulta SQL cruzando el número del canal con las fichas de usuario:
   ```sql
   SELECT f.foto_url, f.nombre, f.apellido, f.telefono, f.cargo
   FROM fichas_usuarios f
   WHERE f.telefono = :nuevo_numero_whatsapp;
   ```
3. **Mapeo en Dashboard:** Si devuelve un registro, el Dashboard renderiza dinámicamente la tarjeta del agente utilizando estos datos. Si la consulta retorna vacía, el backend envía un evento websocket o responde con un indicador que desencadena el diálogo: *"El número de la cuenta de WhatsApp Business App registrado no tiene Ficha de Usuario"*.

### B. Ventana Crítica de 24 horas y Fases de Sincronización
La ventana para iniciar la restauración de chats e historial es restrictiva (24 horas).
* El backend calcula y guarda `sync_window_expires_at = NOW() + INTERVAL '24 hours'`.
* La solicitud se procesa de manera secuencial para rellenar `sync_history_phases` (Fases 0, 1 y 2). Solo se permite **una única ejecución** de sincronización de historial por canal.

### C. Coexistencia (20 mps) y Webhooks de Ecos (`smb_message_echoes`)
* Cada mensaje saliente enviado desde la aplicación móvil de WhatsApp es detectado por el webhook en tiempo real y mapeado a `mensajes` con `source = 'whatsapp'`.
* El frontend del supervisor/administrador se suscribe a los websockets del backend y renderiza los globos de texto al instante, permitiéndole "intervenir" enviando un mensaje directo mediante la Cloud API (`source = 'dashboard'`).

### D. Directorio de Contactos y Filtro por Agentes Conectados
El filtrado del Directorio por agente requiere la asociación del contacto con el canal y este a su vez con la ficha de usuario correspondiente:
```sql
SELECT c.*
FROM contactos c
JOIN whatsapp_channels wc ON c.whatsapp_channel_id = wc.id
JOIN fichas_usuarios f ON wc.phone_number = f.telefono
WHERE f.usuario_id = :agente_id;
```

### E. Descarga de Chats por Agentes (Ajustes / Copias de Seguridad)
El sistema genera archivos estructurados agrupando los registros de las tablas `conversaciones` y `mensajes` que corresponden al canal del agente y genera un registro en la tabla `respaldos_agentes` vinculándolo al usuario solicitante.
