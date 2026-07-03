# Plan de Fases para la Pantalla de Login

## 1. Propósito
Este documento define el plan de desarrollo para la pantalla de login de la aplicación CRM SIGN Medios, incluyendo la lógica de negocio, la persistencia de sesión y el modelo de datos necesario.

El objetivo es garantizar que el acceso al panel esté controlado por roles, que el proceso de login sea seguro y que la funcionalidad de "Acuérdate de mí" funcione correctamente en el navegador.

---

## 2. Reglas de Negocio Transversales

1. El acceso al panel está restringido y controlado por niveles de permisos según el rol del usuario.
2. Si un **Usuario** tiene rol de `supervisor`, su acceso estarán limitados a segun sus permisos establecidos
3. Si un **Usuario** tiene rol de `admin`, tendrá acceso total  a las secciones de gestión y configuración de la plataforma.
4. La pantalla de login no debe revelar si el error corresponde a usuario o contraseña.
5. Solo usuarios activos pueden iniciar sesión; usuarios suspendidos o inactivos deben recibir un mensaje genérico de error.
6. En entornos de desarrollo se mostrará un bloque de credenciales de prueba; en producción no debe aparecer.

---

## 3. Historias de Usuario

### 3.1 Historia de Usuario 1: Autenticación de Usuarios
**Como** miembro del personal (Administrador, Supervisor),
**Quiero** ingresar mis credenciales de acceso (nombre de usuario y contraseña),
**Para** iniciar sesión de forma segura y acceder al panel con mis permisos.

Criterios de aceptación:
- Validación de campos obligatorios.
- Máscara de contraseña con toggle de visibilidad.
- Mensaje de error genérico en caso de credenciales inválidas.
- Redirección según rol después del login exitoso.

### 3.2 Historia de Usuario 2: Persistencia de Sesión
**Como** usuario frecuente,
**Quiero** marcar "Acuérdate de mí" antes de iniciar sesión,
**Para** mantener mi sesión activa en este navegador.

Criterios de aceptación:
- Guardar token/cookie segura si se marca "Acuérdate de mí".
- Verificar sesión activa al abrir la aplicación y saltar login si existe.

### 3.3 Historia de Usuario 3: Credenciales de Prueba en Desarrollo
**Como** desarrollador o evaluador,
**Quiero** ver credenciales de prueba preconfiguradas,
**Para** agilizar el acceso en entornos locales o de testing.

Criterios de aceptación:
- Mostrar recuadro solo en `process.env.NODE_ENV === 'development'`.
- No renderizarlo en producción.

---

## 4. Fases de Desarrollo

### Fase 1: Análisis y Diseño de Requisitos
- Revisar la pantalla actual de login y la especificación existente.
- Definir los roles permitidos: `admin`, `supervisor`.
- Mapear las reglas de acceso sobre las secciones del dashboard.
- Enumerar atributos obligatorios de la entidad `Usuario`.
- Definir los flujos de sesión para login, error, mantenimiento y redirección.
- Documentar los criterios de aceptación y los casos de uso.

Entregables:
- Documento de requisitos de login.
- Diagrama simple de roles y alcance de acceso.

### Fase 2: Diseño de Lógica de Negocio
- Definir la validación del formulario en frontend.
  - Campos obligatorios: nombre de usuario, contraseña.
  - Activación del botón solo cuando ambos campos tengan valor.
- Establecer el comportamiento del toggle de contraseña.
- Implementar manejo de error genérico en el frontend.
- Definir la API de login entre frontend y backend.
  - `POST /api/v1/auth/login`
  - Payload: `{ username, password, rememberMe }`
  - Respuesta: `{ ok: boolean, user: { id, name, username, role, title, permissions }, token?: string }`
- Definir redirección por rol y control de permisos en el estado global.
- Especificar la lógica de persistencia de sesión.

Entregables:
- Documento de flujo de estados y validaciones.
- Definición de contrato API de autenticación.

### Fase 3: Modelado de Datos y Base de Datos
- Crear la entidad `usuarios` con los siguientes campos:
  - `id` (UUID)
  - `username` (string, único)
  - `email` (string, único, opcional si solo se usa username)
  - `password_hash` (string)
  - `role` (`admin`, `supervisor`, `agent`)
  - `full_name` (string)
  - `title` (string)
  - `status` (`active`, `inactive`, `suspended`)
  - `area_id` / `department_id` (relación para agentes)
  - `created_at`, `updated_at`
- Crear la entidad `roles` o roles como enum en el dominio.
- Crear la entidad `sesiones` / `user_sessions` si se usa persistencia de login server-side:
  - `id` (UUID)
  - `user_id`
  - `session_token` / `refresh_token`
  - `device_info` / `user_agent`
  - `expires_at`
  - `created_at`
- Definir índices y restricciones de unicidad para `username` y `email`.
- Definir consultas necesarias:
  - Buscar usuario activo por `username`.
  - Verificar `password_hash`.
  - Registrar sesión persistente si `rememberMe` está activo.

Entregables:
- Modelo ER o esquema de base de datos para autenticación.
- Script SQL o migración para tabla `usuarios` y `sesiones`.

### Fase 4: Implementación Backend
- Implementar endpoint `/api/v1/auth/login`.
- Validar el body de petición con `zod` / `express-validator`.
- Buscar usuario activo en la base de datos.
- Comparar contraseña con `bcrypt` / `argon2`.
- Retornar error genérico si falla.
- Generar JWT o token de sesión.
- Si `rememberMe` es verdadero, emitir cookie persistente segura o guardar token en tabla de sesiones.
- Incluir datos de rol y permisos en la respuesta.
- Implementar middleware de autorización basado en rol.
- Asegurar que agentes solo vean datos de su propia área.

Entregables:
- Endpoint de login funcional.
- Middleware de autorización por rol.
- Documentación de la API.

### Fase 5: Implementación Frontend
- Adaptar el formulario de login actual al modelo definido.
- Añadir validación de campos antes de habilitar el botón.
- Implementar toggle de visibilidad de contraseña.
- Mostrar mensaje de error genérico con estilo claro.
- Integrar llamada real al API de login.
- Guardar sesión local en `localStorage` / `cookie` si `rememberMe` se marca.
- Verificar sesión persistente al cargar la app y redirigir al dashboard automáticamente.
- Mostrar recuadro de credenciales de prueba únicamente en desarrollo.
- Gestionar el `user` y los permisos en un estado global.

Entregables:
- Pantalla de login lista y reactiva.
- Redirección por rol después del login.
- Persistencia de sesión funcional.

### Fase 6: Pruebas y Validación
- Pruebas unitarias de validación de formulario.
- Pruebas de flujo de login exitoso y fallido.
- Pruebas de persistencia de sesión entre recargas y pestañas.
- Pruebas de acceso por rol y restricciones de agente.
- Pruebas de entorno de desarrollo vs producción para credenciales de prueba.
- Revisión de seguridad de mensajes y almacenamiento de tokens.

Entregables:
- Lista de casos de prueba.
- Evidencia de pruebas ejecutadas.
- Ajustes de corrección de errores.

---

## 5. Datos y Estructura Requeridos para el Login

### 5.1 Entidad `Usuario`
Atributos mínimos:
- `id`
- `username`
- `password_hash`
- `role`
- `status`
- `full_name`
- `title`
- `area_id` (para agentes)
- `created_at`
- `updated_at`

### 5.2 Entidad `Sesión` (opcional para persistencia)
Campos recomendados:
- `id`
- `user_id`
- `token`
- `remember_me` (boolean)
- `device` / `user_agent`
- `expires_at`
- `created_at`

### 5.3 Permisos y Alcance
- `admin`: acceso total a gestión de usuarios, configuración, métricas y directorios.
- `supervisor`: acceso a gestión parcial, supervisión de agentes y reportes.
- `agent`: acceso a su propio tablero, sus conversaciones y tareas asignadas.

---

## 6. Consideraciones de Seguridad

- Usar HTTPS para todas las peticiones de autenticación.
- No exponer detalles de error de login.
- Almacenar contraseñas con hashing seguro (`bcrypt` / `argon2`).
- Usar cookies `HttpOnly` / `Secure` / `SameSite=Strict` si se entrega el token desde el backend.
- Limitar intentos de login.
- Controlar sesiones activas y permitir revocación si el usuario se suspende.

---

## 7. Resultado Esperado

Al finalizar estas fases, la pantalla de login deberá:
- Permitir login seguro por roles.
- Mostrar/Ocultar contraseña con toggle.
- Respetar la regla de "Acuérdate de mí".
- Mantener sesión activa en el navegador cuando corresponda.
- Redirigir correctamente según el rol.
- Restringir acceso del usuario `agent` a su área de trabajo.
- No mostrar credenciales de prueba en producción.

---

## 8. Siguientes pasos

1. Revisar el plan con el equipo de producto.
2. Generar la base de datos o migraciones para `usuarios` y `sesiones`.
3. Implementar el endpoint de login y el cliente de autenticación.
4. Validar los flujos con pruebas end-to-end.
