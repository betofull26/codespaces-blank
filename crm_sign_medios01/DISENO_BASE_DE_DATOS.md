# Nuevo Diseño Unificado de Base de Datos - CRM SIGN Medios

Este documento presenta el diseño unificado de la base de datos para el sistema. El objetivo de este diseño es consolidar los perfiles de agentes y usuarios en una única tabla, además de normalizar la asignación de hardware mediante una tabla independiente de dispositivos, eliminando redundancias y campos innecesarios como `assigned_at`.

---

## 1. Arquitectura de las Tablas

### 1.1 Tabla Unificada: `users` (El Personal)
Esta tabla representa a todas las personas que forman parte de la organización (Administradores, Supervisores y Agentes). Los agentes no cuentan con credenciales de acceso, por lo que sus campos de login aceptan valores nulos (`NULL`).

*   `id` (TEXT, PRIMARY KEY): Identificador único de la persona (ej: `user_123` o UUID).
*   `full_name` (TEXT, NOT NULL): Nombre y apellido de la persona.
*   `username` (TEXT, UNIQUE): Nombre de usuario para el inicio de sesión. **(Permite NULL para agentes sin acceso)**.
*   `password_hash` (TEXT): Contraseña encriptada de forma segura. **(Permite NULL para agentes sin acceso)**.
*   `role` (TEXT, NOT NULL): El rol dentro de la empresa, que puede ser `'admin'`, `'supervisor'` o `'agent'`.
*   `status` (TEXT, NOT NULL DEFAULT 'active'): Estado de la cuenta o ficha (`'active'`, `'inactive'`, `'suspended'`).
*   `access_to_panel` (BOOLEAN, NOT NULL DEFAULT FALSE): Flag para control rápido de acceso al panel de administración.
*   `position` (TEXT): Cargo o puesto de trabajo (ej: *"Agente de Ventas"*, *"Coordinador"*).
*   `entry_date` (TEXT): Fecha de ingreso del empleado a la organización.
*   `avatar` (TEXT): URL o ruta de la foto de perfil del usuario.
*   `initials` (TEXT): Iniciales para la visualización rápida en la interfaz (ej: `"CM"`).
*   `online` (BOOLEAN, NOT NULL DEFAULT FALSE): Estado de presencia / conexión en tiempo real del usuario.
*   `created_at` (TEXT, NOT NULL): Fecha de registro de la ficha en el sistema.
*   `updated_at` (TEXT, NOT NULL): Fecha de última actualización de los datos.

### 1.2 Tabla Separada: `dispositivos` (Equipos Asignados)
Esta tabla almacena la información física y técnica de los dispositivos utilizados por el personal para la operación del CRM. Se relaciona con la tabla `users` mediante una llave foránea (`user_id`). **Se ha omitido el campo `assigned_at` según las especificaciones**.

*   `id` (TEXT, PRIMARY KEY): Identificador único del dispositivo.
*   `user_id` (TEXT, UNIQUE): Llave foránea que referencia a `users(id)`. Vincula el dispositivo al miembro del personal asignado. **(Permite NULL si el dispositivo está libre en inventario)**.
*   `brand_model` (TEXT, NOT NULL): Marca y modelo del dispositivo (ej: *"Samsung Galaxy S23"*, *"Xiaomi Redmi Note 12"*).
*   `serial_number_1` (TEXT, NOT NULL): Número de serie principal del dispositivo.
*   `serial_number_2` (TEXT): Número de serie secundario o IMEI 2 (opcional).
*   `assigned_phone` (TEXT, NOT NULL): Número de línea telefónica de la empresa asociada al dispositivo.

---

## 2. Diagrama de Relaciones Conceptual

```
  +--------------------------------+             +-------------------------------+
  |             USERS              |             |         DISPOSITIVOS          |
  +--------------------------------+             +-------------------------------+
  | PK | id                        |<------------| PK | id                       |
  |    | full_name                 |             | FK | user_id (UNIQUE, NULL)   |
  |    | username (NULL)           |             |    | brand_model              |
  |    | password_hash (NULL)      |             |    | serial_number_1          |
  |    | role                      |             |    | serial_number_2 (NULL)   |
  |    | status                    |             |    | assigned_phone           |
  |    | access_to_panel           |             +-------------------------------+
  |    | position                  |
  |    | entry_date                |             +-------------------------------+
  |    | phone                     |             |         CONVERSATIONS         |
  |    | avatar                    |             +-------------------------------+
  |    | initials                  |             | PK | id                       |
  |    | online                    |             | FK | agent_id (-> users.id)   |
  |    | created_at                |             |    | client_name              |
  |    | updated_at                |             |    | topic                    |
  +--------------------------------+             +-------------------------------+
```

---

## 3. Beneficios Técnicos y Operativos de este Diseño

1.  **Cero Duplicación de Datos:** Toda la información personal de los agentes, supervisores y administradores reside únicamente en `users`. No existe riesgo de discrepancia de nombres, fotos o iniciales.
2.  **Manejo Elegante de Roles y Accesos:**
    *   Para dar de alta un **agente**, se registra en la tabla `users` con rol `'agent'` y sus campos de inicio de sesión (`username`, `password_hash`) se dejan vacíos.
    *   Si se decide **promover al agente** a administrador o supervisor, simplemente se le cambia el rol en `users` y se le asignan un `username` y `password_hash`. ¡Todo su historial de chats, contactos y dispositivo asignado permanece idéntico!
3.  **Independencia del Hardware:** La tabla `dispositivos` permite que los equipos existan de forma independiente de las personas. Se puede registrar un nuevo teléfono móvil en stock (`user_id = NULL`) antes de ser entregado.
4.  **Cumplimiento Estricto de Reglas de Negocio:** Al eliminar campos innecesarios como `assigned_at`, se simplifica el modelo físico facilitando consultas de base de datos más ágiles e intuitivas.
