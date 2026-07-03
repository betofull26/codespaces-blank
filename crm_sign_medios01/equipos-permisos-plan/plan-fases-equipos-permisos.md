# Plan de Fases para Implementar la Lógica de Equipos y Permisos

## 1. Propósito
Este documento define un plan de implementación completo para la pantalla de "Equipo y permisos" del módulo de Ajustes en CRM SIGN Medios.

El objetivo es cubrir la lógica de negocio, el backend, la base de datos y la integración con el frontend para gestionar usuarios, roles, credenciales de acceso y permisos del panel.

---

## 2. Reglas de Negocio Transversales

- El acceso al panel está restringido por rol.
- El rol de `agent` se usa para identificar a los agentes dentro del sistema, pero no da acceso al panel de administración.
- Para que un usuario agente pueda ingresar al panel, primero se debe cambiar su rol a `supervisor` o `admin`.
- Si un usuario nuevo va a tener acceso al panel, se debe crear su ficha con rol de `admin` o `supervisor` y asignarle credenciales de acceso.
- Si un usuario no va a tener acceso al panel, se debe crear su ficha con rol de `agent`.
- Solo un usuario con rol `admin` puede crear, modificar, suspender o eliminar fichas y cambiar roles críticos.
- Los cambios de rol y permisos deben quedar registrados para auditoría.
- El sistema debe impedir que un usuario con rol `agent` acceda a secciones administrativas.

---

## 3. Alcance Funcional

### 3.1 Funcionalidades del módulo
- Crear fichas de usuarios.
- Editar datos de usuario y rol.
- Cambiar el rol entre `agent`, `supervisor` y `admin`.
- Crear credenciales de acceso cuando el usuario tenga acceso al panel.
- Suspender o activar cuentas.
- Consultar usuarios por rol y estado.
- Restringir el acceso al panel según el rol.

### 3.2 Reglas de negocio específicas
- Un usuario con rol `agent` no puede ver ni usar módulos administrativos.
- Un usuario con rol `supervisor` puede ver módulos de supervisión y gestión limitada.
- Un usuario con rol `admin` tiene acceso total a la administración del sistema.
- Si un usuario cambia de `agent` a `supervisor` o `admin`, el sistema debe habilitar su acceso al panel y crear o activar sus credenciales.

---

## 4. Historias de Usuario

### Historia 1: Crear ficha de usuario
Como administrador,
quiero crear una ficha de usuario,
para registrar a un colaborador y definir si tendrá acceso al panel o será solo un agente del sistema.

Criterios de aceptación:
- Se ingresa nombre, rol, estado, correo y demás datos requeridos.
- Si el usuario tendrá acceso al panel, se crean usuario y contraseña.
- Si no tendrá acceso, se asigna el rol `agent`.

### Historia 2: Cambiar rol de usuario
Como administrador,
quiero cambiar el rol de un usuario,
para habilitar o restringir su acceso al panel según la necesidad del negocio.

Criterios de aceptación:
- Se valida que el cambio de rol sea permitido.
- Si el rol cambia a `agent`, se bloquea el acceso al panel.
- Si el rol cambia a `supervisor` o `admin`, se habilita el acceso y se crean o activan credenciales.

### Historia 3: Gestionar credenciales
Como administrador,
quiero crear y administrar credenciales de acceso,
para permitir el ingreso al panel solo a usuarios autorizados.

Criterios de aceptación:
- Se genera un usuario único.
- Se genera una contraseña segura.
- La contraseña se almacena de forma segura mediante hash.

### Historia 4: Consultar y filtrar usuarios
Como administrador o supervisor,
quiero visualizar usuarios y filtrar por rol y estado,
para administrar equipos y permisos con control.

Criterios de aceptación:
- Se colocan una etiqueta usuarios activos, suspendidos y pendientes.
- Se filtra por rol y estado.
- Solo los usuarios autorizados pueden ver esta información.

---

## 5. Fases de Implementación

### Fase 1: Análisis y definición del alcance del backend
- Validar que los formularios, campos y reglas de negocio ya están definidos en la solución actual.
- Mantener el frontend sin cambios funcionales, salvo ajustes mínimos de integración si fueran necesarios.
- Definir el contrato de negocio que debe implementar el backend para creación, edición, cambio de rol, estados y acceso al panel.
- Definir los casos de uso que deben cubrirse en backend, incluyendo validaciones, permisos y auditoría.
- Establecer los datos mínimos que deben persistirse para cada usuario: nombre, correo, rol, estado, acceso al panel y credenciales cuando aplique.
- Determinar qué acciones quedan restringidas a `admin` y cuáles pueden ser ejecutadas por `supervisor`.
- Documentar los escenarios de error esperados: rol inválido, usuario inexistente, intento de acceso no autorizado y cambio de estado no permitido.

Entregables:
- Documento de requisitos del backend y reglas de negocio.
- Mapa de roles, permisos y acciones admitidas por cada rol.
- Lista de casos de uso de negocio que debe cubrir la implementación backend.

### Fase 2: Diseño de la lógica de negocio
- Modelar el flujo de creación de usuario desde la ficha de administración hasta su persistencia en base de datos.
- Modelar el flujo de cambio de rol, incluyendo la transición entre `agent`, `supervisor` y `admin`.
- Definir cuándo se crean o activan credenciales de acceso al panel: solo cuando el usuario tenga rol `supervisor` o `admin` y su estado sea activo.
- Definir reglas para bloquear acceso al panel si el rol es `agent`, incluyendo la revocación automática de acceso cuando se asigna ese rol.
- Definir reglas para suspender usuarios y revocar acceso, considerando que la suspensión inhabilita el ingreso aunque la cuenta siga existiendo.
- Establecer la regla de negocio de que un usuario nuevo sin acceso al panel debe registrarse como `agent`.
- Establecer la regla de negocio de que un cambio de `agent` a `supervisor` o `admin` debe habilitar acceso al panel y generar o activar credenciales.
- Definir los eventos que deben quedar registrados: creación de usuario, cambio de rol, activación o suspensión, creación de credenciales y revocación de acceso.

Entregables:
- Documento de reglas de negocio consolidado.
- Diagrama de flujo del proceso de alta, cambio de rol, activación de credenciales y suspensión de acceso.

### Fase 3: Diseño de base de datos
Definir y dejar listo el modelo persistente que soportará la lógica de negocio, la seguridad y la trazabilidad del módulo.

#### 3.1 Entidad `users`
Campos recomendados:
- `id` (UUID, primary key)
- `full_name` (nombre completo)
- `email` (único)
- `username` (único, para acceso al panel)
- `password_hash` (almacenado de forma segura)
- `role` (`admin`, `supervisor`, `agent`)
- `status` (`active`, `inactive`, `suspended`)
- `access_to_panel` (booleano)
- `created_at`
- `updated_at`

Reglas de diseño:
- `email` y `username` deben ser únicos.
- `role` debe validarse contra los valores permitidos.
- `access_to_panel` debe derivarse del rol y del estado del usuario.
- `status` debe permitir distinguir entre usuarios activos, inactivos y suspendidos.

#### 3.2 Entidad `user_credentials`
Campos recomendados:
- `id` (UUID, primary key)
- `user_id` (foreign key a `users.id`)
- `username` (único)
- `password_hash`
- `created_at`
- `updated_at`

Reglas de diseño:
- Cada usuario puede tener una sola credencial activa para acceder al panel.
- `user_id` debe ser único si se quiere asegurar una relación 1:1.
- La contraseña debe almacenarse solo como hash.

#### 3.3 Entidad `role_history`
Campos recomendados:
- `id` (UUID, primary key)
- `user_id` (foreign key a `users.id`)
- `previous_role`
- `new_role`
- `changed_by` (quién realizó el cambio)
- `changed_at`
- `reason`

Reglas de diseño:
- Sirve para auditar cambios de permisos y rol.
- Debe registrar siempre el cambio previo y el nuevo valor.
- Debe existir para soportar trazabilidad de accesos y cambios de autoridad.

#### 3.4 Entidad `audit_log`
Campos recomendados:
- `id` (UUID, primary key)
- `entity_type` (por ejemplo: `user`, `role`, `credential`)
- `entity_id` (identificador de la entidad afectada)
- `action` (crear, editar, cambiar_rol, suspender, revocar_acceso, etc.)
- `performed_by` (usuario que ejecutó la acción)
- `details` (json o texto con información relevante)
- `created_at`

Reglas de diseño:
- Debe registrar eventos sensibles para trazabilidad.
- Puede almacenarse como texto o JSON para mayor flexibilidad.
- Es la base para auditoría y revisión de operaciones críticas.

#### 3.5 Consideraciones adicionales de diseño
- Agregar índices sobre `email`, `username`, `role`, `status` y `access_to_panel`.
- Asegurar integridad referencial entre `user_credentials.user_id` y `role_history.user_id` con `users.id`.
- Definir restricciones de valores para `role` y `status` en la capa de base de datos si es posible.
- Establecer reglas para que el acceso al panel se derive correctamente de rol, estado y credenciales.

Entregables:
- Script SQL o migración para crear las tablas y relaciones.
- Índices para búsquedas por rol, estado, usuario y acceso al panel.
- Especificación de restricciones y reglas de integridad del modelo de datos.
- Definición clara de la estructura de persistencia para las siguientes fases de backend.

### Fase 4: Implementación de backend
Implementar el backend para cubrir el ciclo completo de administración de usuarios y permisos, manteniendo el frontend sin cambios funcionales y utilizando la lógica definida en las fases previas.

#### 4.1 Endpoints a desarrollar
- `GET /api/v1/users` para listar usuarios.
- `GET /api/v1/users/:id` para consultar un usuario.
- `POST /api/v1/users` para crear una ficha de usuario.
- `PUT /api/v1/users/:id` para editar la ficha.
- `PATCH /api/v1/users/:id/role` para cambiar el rol y controlar acceso al panel.
- `PATCH /api/v1/users/:id/status` para activar o suspender.
- `POST /api/v1/users/:id/credentials` para crear o actualizar credenciales.
- `POST /api/v1/auth/login` para autenticar usuarios del panel.

#### 4.2 Reglas de backend
- Validar permisos antes de ejecutar acciones administrativas.
- Solo `admin` puede crear o modificar roles críticos.
- Solo `admin` y `supervisor` pueden consultar listados de usuarios y fichas.
- Si el rol es `agent`, no debe permitir acceso a rutas administrativas.
- Si un usuario cambia a `agent`, debe revocarse automáticamente el acceso al panel.
- Si un usuario cambia a `supervisor` o `admin`, debe habilitarse el acceso al panel y generarse o activarse su credencial.
- Guardar hash de contraseña con `bcrypt` o `argon2`.
- Registrar cambios de rol, estado y credenciales en auditoría.
- Rechazar operaciones si el usuario autenticado no tiene permisos suficientes.

#### 4.3 Comportamiento esperado por endpoint
- Crear usuario: validar datos obligatorios, asignar rol y estado inicial, crear credenciales si corresponde y registrar auditoría.
- Editar usuario: actualizar datos permitidos, mantener reglas de consistencia y registrar cambios.
- Cambiar rol: validar transición, actualizar `access_to_panel`, crear o revocar credenciales según corresponda y registrar historial.
- Cambiar estado: permitir activar o suspender, y bloquear acceso si el estado es suspendido.
- Crear o actualizar credenciales: generar usuario y contraseña segura, almacenar hash y registrar evento.
- Login: autenticar solo usuarios con acceso al panel, estado activo y credenciales válidas.

#### 4.4 Entregables
- API funcional para gestión de usuarios y permisos.
- Middleware de autorización por rol.
- Validaciones de entrada y manejo de errores.
- Registro de auditoría para cambios sensibles.
- Pruebas básicas de los flujos de negocio principales.

### Fase 5: Integración con frontend
- Conectar la pantalla de fichas de usuarios al backend sin modificar la estructura funcional ya definida del frontend.
- Mostrar usuarios, roles y estados reales obtenidos desde la base de datos mediante los endpoints correspondientes.
- Implementar la creación, edición, cambio de rol y cambio de estado a través de la capa de integración con el backend.
- Mostrar mensajes de éxito y error según el resultado de cada operación para mejorar la experiencia del usuario.
- Bloquear visualmente y por ruta el acceso al panel para usuarios `agent`, alineando la interfaz con la lógica de negocio ya definida.
- Asegurar que las acciones sensibles solo se habiliten para usuarios con permisos suficientes según el rol.
- Garantizar que los formularios del frontend envíen los datos esperados por el backend y que la interfaz refleje el estado real del sistema.

Entregables:
- Pantalla funcional con datos reales y persistencia backend.
- Flujo completo de creación, edición y gestión de usuarios conectado al sistema.
- Validación visual y funcional de los permisos por rol desde la interfaz.

### Fase 6: Pruebas y validación
- Ejecutar pruebas unitarias sobre la lógica de negocio para creación de usuarios, cambio de rol, activación y suspensión.
- Ejecutar pruebas de integración de los endpoints del backend para verificar creación, edición, consulta, cambio de estado y credenciales.
- Validar el flujo completo de cambio de rol y acceso al panel, incluyendo el bloqueo para usuarios `agent`.
- Validar la creación de credenciales, el almacenamiento seguro de contraseñas y el comportamiento del login autorizado.
- Verificar que los cambios sensibles queden registrados en auditoría y que las acciones no autorizadas sean rechazadas.
- Validar la seguridad del sistema frente a accesos no permitidos, roles inválidos y operaciones fuera de contexto.

Entregables:
- Casos de prueba ejecutados y documentados.
- Corrección de errores detectados y evidencias de validación.
- Reporte de cumplimiento de reglas de negocio y seguridad.

---

## 6. Modelo de Seguridad

- Usar sesiones seguras o tokens con expiración.
- Almacenar contraseñas con hash seguro.
- Proteger rutas del panel con middleware de autorización.
- Evitar que un usuario `agent` pueda consumir endpoints administrativos.
- Registrar cambios sensibles para trazabilidad.

---

## 7. Resultado Esperado

Al finalizar este plan, la pantalla de equipos y permisos deberá:
- Crear y administrar fichas de usuarios de forma consistente con la lógica de negocio definida.
- Diferenciar claramente entre usuarios de panel y agentes del sistema.
- Permitir acceso al panel solo cuando el rol sea `supervisor` o `admin` y el usuario esté activo.
- Crear o activar credenciales desde la ficha de usuario cuando el acceso al panel sea requerido.
- Mantener trazabilidad completa de cambios de rol, estado y permisos mediante auditoría.
- Operar con datos reales y persistidos en base de datos, sin depender de lógica mockeada.

---

## 8. Siguientes Pasos

1. Validar y aprobar este plan con el equipo de producto y negocio.
2. Crear las tablas y restricciones de base de datos para usuarios, credenciales, historial de roles y auditoría.
3. Implementar los endpoints del backend con reglas de autorización, validaciones y registro de auditoría.
4. Integrar la UI con el backend y validar los flujos completos de creación, edición, cambio de rol, acceso y seguridad.
