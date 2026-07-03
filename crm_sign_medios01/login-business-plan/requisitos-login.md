# Documento de Requisitos de Login

## 1. Alcance y Contexto
Este documento recoge el análisis de la pantalla de login actual y define los requisitos funcionales y de negocio para la autenticación en CRM SIGN Medios.

Se enfoca en el control de acceso por rol, la seguridad de la sesión y el comportamiento esperado del formulario de acceso.

## 2. Roles y Acceso

### Roles identificados
- `admin`: acceso total a gestión de usuarios, configuración, métricas y secciones administrativas.
- `supervisor`: acceso parcial a gestión, supervisión de agentes, reportes y paneles de control intermedios.
- `agent`: No tiene aceso al panel 

> Nota: Aunque el listado de la fase pide `admin` y `supervisor`, el análisis del código actual confirma que el sistema también debe diferenciar el rol `agent`, que es esencial para la operación de la plataforma (pero no tiene acesso al panel).

### Mapeo de acceso a secciones del dashboard

| Rol | Dashboard principal | Gestión de usuarios | Configuración | Supervisión de agentes | Área de agente | Reportes | Acceso a métricas globales |
|---|---|---|---|---|---|---|---|
| admin | Sí | Sí | Sí | Sí | Parcial | Sí | Sí |
| supervisor | Sí | Parcial | Parcial | Sí | Parcial | Sí | Sí |
| agent | NO | No | No | No | Sí | No | No |

## 3. Atributos obligatorios de la entidad `Usuario`

La entidad de usuario debe contener al menos los siguientes campos:
- `id` (UUID)
- `username` (string, único)
- `password_hash` (string)
- `role` (`admin`, `supervisor`, `agent`)
- `status` (`active`, `inactive`, `suspended`)
- `full_name` (string)
- `title` (string)
- `area_id` / `department_id` (relación para agentes)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 4. Flujos de sesión

### 4.1 Login exitoso
1. El usuario introduce `username` y `password`.
2. El frontend valida que ambos campos estén llenos.
3. El sistema envía la petición de autenticación al backend.
4. El backend valida credenciales y estado de usuario.
5. Si el usuario es válido y activo, se genera un token o sesión persistente.
6. La respuesta incluye datos de usuario y su rol.
7. El frontend redirige según rol.
8. Si `rememberMe` está marcado, se guarda un token de larga duración o cookie segura.

### 4.2 Login con error
1. El usuario envía credenciales incompletas o inválidas.
2. El frontend marca los campos obligatorios vacíos y muestra errores visuales.
3. Si las credenciales no coinciden, el backend devuelve un mensaje genérico.
4. El frontend muestra: "Credenciales incorrectas o usuario suspendido".
5. No se indica si el fallo fue por usuario o contraseña.

### 4.3 Persistencia de sesión
1. Si `rememberMe` es verdadero, almacenar un token persistente seguro en el cliente o servidor.
2. Al abrir una nueva pestaña en el mismo navegador, la aplicación verifica la sesión activa.
3. Si existe una sesión válida, se salta la pantalla de login y se redirige al dashboard.
4. Si la sesión expira o es inválida, se fuerza el reingreso.

### 4.4 Redirección por rol
- `admin` → acceso total al panel de administración.
- `supervisor` → acceso parcial a funciones de gestión y supervisión.
- `agent` → acceso restringido a su propia área de trabajo.

## 5. Criterios de aceptación y casos de uso

### Criterios de aceptación
- El botón de login solo se activa con ambos campos completados.
- Los campos vacíos o inválidos muestran un estado de error visual.
- El campo contraseña oculta los caracteres y permite alternar visibilidad.
- El mensaje de error es genérico y no filtra información sensible.
- La redirección respeta el rol del usuario.
- La casilla "Acuérdate de mí" activa persistencia de sesión.
- El bloque de credenciales de prueba solo aparece en `development`.

### Casos de uso
- Usuario administra: ingresa credenciales válidas y accede al panel completo.
- Supervisor: ingresa credenciales válidas y accede a sus secciones.
- Agente: ingresa credenciales válidas y accede a su área de trabajo.
- Usuario con credenciales inválidas: recibe mensaje genérico.
- Usuario suspendido: recibe mensaje genérico y no puede ingresar.
- Usuario marca "Acuérdate de mí": su sesión se mantiene activa.
- Entorno de desarrollo: visualiza credenciales de prueba.

## 6. Observaciones del análisis actual

- El login actual ya implementa validaciones de campos, toggle de contraseña y mensaje de error genérico.
- El mock actual distingue roles `admin` y `agent`, por lo que se requiere extender la lógica para `supervisor`.
- La función de persistencia existe en mock, pero debe ser integrada con una sesión real en backend.
- El recuadro de credenciales de prueba está presente en el frontend; debe condicionarse a entornos de desarrollo.

## 7. Entregables de la fase 1
- Documento de requisitos de login: este archivo.
- Diagrama simple de roles y alcance de acceso: tabla de mapeo de secciones por rol.
