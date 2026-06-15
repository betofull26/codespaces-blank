
-- Esquema PostgreSQL derivado del frontend de crm_sign_medios01
-- Contiene tablas: roles, permissions, usuarios, clientes, conversaciones, mensajes,
-- adjuntos, notas, tickets, fichas_usuarios, respaldos y tablas puente.

/* --------------------------------------------------
   Tabla: roles
   Roles del sistema (Administrador, Agente, Supervisor, etc.)
-------------------------------------------------- */
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

/* --------------------------------------------------
   Tabla: permissions
   Permisos finos asignables a roles
-------------------------------------------------- */
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

/* --------------------------------------------------
   Tabla: role_permissions (N:N)
-------------------------------------------------- */
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
);

/* --------------------------------------------------
   Tabla: usuarios
   Agentes y administradores que operan en el frontend
-------------------------------------------------- */
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  nombre TEXT,
  titulo TEXT,
  telefono TEXT,
  role_id INTEGER REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  last_login_at TIMESTAMP
);
CREATE INDEX idx_usuarios_email ON usuarios(email);

/* --------------------------------------------------
   Tabla: clientes
   Contactos/Clientes asignables a agentes (mantiene agente_id)
-------------------------------------------------- */
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT,
  numero TEXT,
  agente_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_clientes_numero ON clientes(numero);

/* --------------------------------------------------
   Tabla: conversaciones
   Conversaciones o threads entre cliente y agente
-------------------------------------------------- */
CREATE TABLE conversaciones (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  agente_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  topic TEXT,
  status TEXT,
  start_time TIMESTAMP,
  last_message TEXT,
  last_time TIMESTAMP,
  unread_count INTEGER DEFAULT 0
);
CREATE INDEX idx_conversaciones_cliente ON conversaciones(cliente_id);

/* --------------------------------------------------
   Tabla: adjuntos
   Archivos asociados a mensajes o conversaciones
-------------------------------------------------- */
CREATE TABLE adjuntos (
  id SERIAL PRIMARY KEY,
  nombre TEXT,
  url TEXT,
  is_image BOOLEAN DEFAULT FALSE,
  tamano TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now()
);

/* --------------------------------------------------
   Tabla: mensajes
   Mensajes en una conversación (whatsapp_in/out, internal_note, etc.)
-------------------------------------------------- */
CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  conversacion_id INTEGER REFERENCES conversaciones(id) ON DELETE CASCADE,
  tipo TEXT, -- 'whatsapp_in', 'whatsapp_out', 'internal_note', etc.
  texto TEXT,
  tiempo TIMESTAMP,
  autor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  autor_nombre TEXT,
  status TEXT, -- 'sent', 'delivered', 'read'
  adjunto_id INTEGER REFERENCES adjuntos(id) ON DELETE SET NULL
);
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id);

/* --------------------------------------------------
   Tabla: notas
   Notas internas asociadas a conversaciones
-------------------------------------------------- */
CREATE TABLE notas (
  id SERIAL PRIMARY KEY,
  conversacion_id INTEGER REFERENCES conversaciones(id) ON DELETE CASCADE,
  autor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  texto TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT now(),
  pinned BOOLEAN NOT NULL DEFAULT FALSE
);

/* --------------------------------------------------
   Tabla: tickets (fichas)
   Gestión de fichas / tickets de soporte
-------------------------------------------------- */
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  creado_en TIMESTAMP NOT NULL DEFAULT now(),
  estado TEXT, -- 'new','in-progress','pending','completed'
  asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  prioridad TEXT, -- 'low','medium','high'
  titulo TEXT,
  descripcion TEXT,
  cerrado_en TIMESTAMP
);
CREATE INDEX idx_tickets_cliente ON tickets(cliente_id);

/* --------------------------------------------------
   Tabla: fichas_usuarios
   Registros de equipo / fichas de usuarios (UserRecord)
-------------------------------------------------- */
CREATE TABLE fichas_usuarios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT,
  puesto TEXT,
  telefono_asignado TEXT,
  modelo_dispositivo TEXT,
  numero_dispositivo TEXT,
  serial_number TEXT,
  foto TEXT,
  fecha_ingreso DATE,
  creado_en TIMESTAMP NOT NULL DEFAULT now()
);

/* --------------------------------------------------
   Tabla: respaldos
   Registros de exportes / backups (JSON/CSV) generados desde Settings
-------------------------------------------------- */
CREATE TABLE respaldos (
  id SERIAL PRIMARY KEY,
  creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo TEXT, -- 'chats','contacts','full'
  etiqueta TEXT,
  file_url TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT now()
);

