# Modelado General de Base de Datos PostgreSQL con Nuevas Funciones

Este documento presenta el diseño integral y unificado de la base de datos de la plataforma **CRM SIGN Medios**, combinando las entidades existentes en el backend con las nuevas tablas diseñadas para soportar la integración de **WhatsApp Business v4 (Registro Insertado & Coexistencia)**, la sincronización de historial en fases y la gestión avanzada de respaldos por agente.

---

## 1. Mapa de Coexistencia de Datos (Estructura de Tablas)

El sistema ahora unifica los siguientes dos mundos:
1. **El núcleo del CRM original:** Gestión de sesiones, auditoría, usuarios del sistema y agentes.
2. **El nuevo motor de WhatsApp v4 (Meta):** Registro insertado de múltiples cuentas de Meta, sincronización de historial por fases (ventana de 24 horas), almacenamiento de contactos locales por canal y control de ecos en tiempo real.

```
       +-------------------------------------------------------------+
       |                           USUARIOS                          |
       |  (Almacena credenciales de sesión, accesos y rol del CRM)   |
       +-------------------------------------------------------------+
                                      | 1
                                      |
                                      | 1:1 (Opcional para Agentes)
                                      v
       +-------------------------------------------------------------+
       |                       FICHAS_USUARIOS                       |
       |   (Perfil laboral: Foto, Nombre, Teléfono [compara] y Cargo)|
       +-------------------------------------------------------------+
                                      |
             +------------------------+------------------------+
             | 1:N (Por Teléfono de la Ficha)                  | 1:N (Respaldo)
             v                                                 v
+--------------------------+                      +--------------------------+
|    whatsapp_channels     |                      |     respaldos_agentes    |
| (Onboarding v4 / Meta)   |                      | (Copias de seguridad ZIP)|
+--------------------------+                      +--------------------------+
             |                                                 |
             | 1:N                                             |
             +------------------------+                        |
             |                        |                        |
             v                        v                        |
+--------------------------+  +--------------------------+     |
|   sync_history_phases    |  |        contactos         |     |
| (Sinc. Historial v4)     |  |       (Directorio)       |<----+ (Filtro Agente)
+--------------------------+  +--------------------------+
                                      | 1
                                      |
                                      | 1:N
                                      v
                              +--------------------------+
                              |      conversaciones      |
                              |  (Chats activos/espera)  |
                              +--------------------------+
                                      | 1
                                      |
                                      | 1:N
                                      v
                              +--------------------------+
                              |         mensajes         |
                              |    (Historial y Ecos)    |
                              +--------------------------+
```

---

## 2. DDL Unificado de Base de Datos PostgreSQL

A continuación se detalla la estructura SQL completa con claves foráneas, restricciones de unicidad e índices para optimizar las consultas del Dashboard en tiempo real.

```sql
-- =========================================================================
-- 1. CONTROL DE ACCESOS Y USUARIOS DE SESIÓN
-- =========================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL, -- 'admin', 'supervisor', 'agent'
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- 2. PERFILES LABORALES (FICHAS DE USUARIOS)
-- =========================================================================

CREATE TABLE IF NOT EXISTS fichas_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    foto_url TEXT, -- Foto cargada para la ficha
    telefono VARCHAR(30) UNIQUE NOT NULL, -- Servirá para mapear automáticamente el número del canal de Meta
    cargo VARCHAR(100) NOT NULL, -- Cargo laboral (ej. "Asesor de Ventas")
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 3. MOTOR DE CANALES WHATSAPP V4 (META CLOUD API)
-- =========================================================================

CREATE TABLE IF NOT EXISTS whatsapp_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waba_id VARCHAR(100) UNIQUE NOT NULL, -- ID de WhatsApp Business Account de Meta
    phone_number_id VARCHAR(100) UNIQUE NOT NULL, -- ID único del número provisto por Meta
    phone_number VARCHAR(30) UNIQUE NOT NULL, -- Número de teléfono asignado
    display_name VARCHAR(150),
    system_access_token TEXT NOT NULL, -- Token generado tras intercambio (60 días máximo de expiración)
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    flow_finish_type VARCHAR(100), -- Tipo de finalización (ej: "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING")
    feature_type VARCHAR(100) DEFAULT 'whatsapp_business_app_onboarding', -- Habilita coexistencia
    throughput_mps INT DEFAULT 20, -- Capacidad limitada a 20 mensajes por segundo en modo coexistencia
    max_linked_devices INT DEFAULT 4, -- Hasta 4 dispositivos conectados físicos
    sync_window_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Límite de 24 horas para sincronizar desde el onboarding
    status VARCHAR(30) DEFAULT 'CONNECTED', -- 'CONNECTED', 'DISCONNECTED', 'OFFBOARDED'
    offboarded_at TIMESTAMP WITH TIME ZONE,
    offboarded_reason VARCHAR(150), -- Ej. 'PARTNER_REMOVED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 4. CONTROL DE VENTANAS Y FASES DE SINCRONIZACIÓN DE HISTORIAL
-- =========================================================================

CREATE TABLE IF NOT EXISTS sync_history_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    phase_number INT NOT NULL, -- 0 (Día 0-1), 1 (Día 1-90), 2 (Día 90-180)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    text_messages_count INT DEFAULT 0,
    media_messages_count INT DEFAULT 0, -- IDs de recursos multimedia (válidos solo últimos 14 días)
    sync_status VARCHAR(30) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    error_message TEXT,
    CONSTRAINT unique_phase_per_channel UNIQUE (whatsapp_channel_id, phase_number)
);

-- =========================================================================
-- 5. DIRECTORIO CENTRALIZADO DE CONTACTOS (SINCRONIZACIÓN)
-- =========================================================================

CREATE TABLE IF NOT EXISTS contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_telefono_per_channel UNIQUE (whatsapp_channel_id, telefono)
);

-- =========================================================================
-- 6. CONVERSACIONES Y CHATS
-- =========================================================================

CREATE TABLE IF NOT EXISTS conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
    external_chat_id VARCHAR(150), -- ID del chat entregado por Meta Webhook
    topic VARCHAR(150),
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'closed', 'waiting'
    unread_count INT DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 7. MENSAJERÍA, HISTORIAL Y ECOS EN TIEMPO REAL
-- =========================================================================

CREATE TABLE IF NOT EXISTS mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
    external_message_id VARCHAR(150) UNIQUE, -- ID devuelto por Meta para evitar procesamiento duplicado
    sender VARCHAR(50) NOT NULL, -- 'agent', 'client', 'supervisor', 'supervisor_as_agent'
    sender_name VARCHAR(150),
    text_content TEXT,
    media_url TEXT,
    media_type VARCHAR(50), -- 'image/png', 'video/mp4', 'text', etc.
    source VARCHAR(50) DEFAULT 'whatsapp', -- 'whatsapp' (Eco de app física), 'dashboard' (Cloud API), 'internal'
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 8. COPÍAS DE SEGURIDAD Y RESPALDOS POR AGENTES
-- =========================================================================

CREATE TABLE IF NOT EXISTS respaldos_agentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL, -- Agente del cual se respaldaron los chats
    descargado_por_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL, -- Quién gatilló la descarga
    whatsapp_channel_id UUID REFERENCES whatsapp_channels(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL, -- Nombre descriptivo (ej: "Backup_LauraGomez_2026-11-20")
    file_url TEXT NOT NULL, -- Enlace o ruta segura para la descarga del archivo comprimido
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 9. AUDITORÍA GENERAL DEL CRM
-- =========================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 10. ÍNDICES DE RENDIMIENTO RECOMENDADOS
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_fichas_telefono ON fichas_usuarios(telefono);
CREATE INDEX IF NOT EXISTS idx_channels_phone ON whatsapp_channels(phone_number);
CREATE INDEX IF NOT EXISTS idx_contactos_channel ON contactos(whatsapp_channel_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_channel ON conversaciones(whatsapp_channel_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
```

---

## 3. Beneficios Técnicos del Diseño General Unificado

1. **Desacoplamiento mediante ID de Canales (`whatsapp_channels`):**
   A diferencia del CRM heredado, donde las conversaciones se mapeaban directamente a un string plano del agente, ahora las conversaciones y mensajes se asocian a un `whatsapp_channel_id`. Esto permite que una cuenta de WhatsApp sea compartida, transferida o auditada por supervisores de forma limpia.

2. **Vinculación Inteligente (Matching Teléfono - Ficha):**
   El número de teléfono (`phone_number`) registrado en la cuenta de WhatsApp se cruza de inmediato con la tabla `fichas_usuarios`. De este modo, si hay coincidencia, el Dashboard genera de forma dinámica y automática la tarjeta con foto, cargo y nombres sin intervención manual del usuario.

3. **Control Estricto de Unicidad y Duplicidad en Webhooks:**
   Meta reenvía webhooks constantemente si el servidor no responde un código HTTP `200` inmediato. La restricción de clave única `external_message_id UNIQUE` en la tabla `mensajes` garantiza de manera transparente que no existan mensajes duplicados en la base de datos de chats históricos.

4. **Soporte de Ecos en Tiempo Real (Coexistencia):**
   La columna `source` de la tabla `mensajes` permite discernir si un mensaje provino de la aplicación física de WhatsApp en el dispositivo (`source = 'whatsapp'`) o si fue enviado a través de la interfaz del CRM en la Cloud API (`source = 'dashboard'`), lo cual es indispensable para la coexistencia de ambos canales de chat de forma sincronizada.
