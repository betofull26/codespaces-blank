# Documentación de la Pantalla de Inicio de Sesión (Login) y sus Funcionalidades

Este documento describe de manera exhaustiva el funcionamiento de la pantalla **Inicio de Sesión (Login)** en la aplicación **CRM SIGN Medios**, abarcando su diseño de interfaz de usuario, estados de React, validación de campos, persistencia de la sesión, integración con el backend, tablas en PostgreSQL y el control de redireccionamiento según el rol del usuario (RBAC).

---

## 1. Estructura Visual y Diseño

La pantalla de login utiliza una paleta de colores limpia y moderna basada en gradientes, tipografías y componentes sutiles usando **Tailwind CSS** y **Radix UI**:

1. **Layout General (`flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`):**
   - Centra la tarjeta del login en el medio exacto de la pantalla.
   - Utiliza un fondo con un gradiente diagonal azul claro muy sutil que transmite profesionalismo.
2. **Tarjeta de Iniciar Sesión (LoginCard):**
   - **Logotipo de la Empresa:** Muestra la imagen de cabecera de SIGN Medios usando un componente `<ImageWithFallback />` para evitar fallas en la carga.
   - **Descripción:** `"Inicia sesión con tus credenciales"`.
   - **Campos del Formulario:** Inputs redondeados (`rounded-xl`) con sutiles sombras y bordes que se resaltan en azul al enfocarse.
   - **Casilla "Acuérdate de mí" (Remember Me):** Un componente checkbox estilizado de Radix UI (`@radix-ui/react-checkbox`) para permitir mantener la sesión activa de forma permanente.
   - **Botón "Iniciar sesión" (Submit):** Ocupa el ancho completo con un color azul brillante, que transiciona a tonos más oscuros en hover y active, mostrando un spinner animado (`Loader2`) cuando se procesa la validación.
3. **Acceso de Desarrollo:**
   - En entornos locales de desarrollo (`import.meta.env.DEV`), se renderiza un sutil panel gris informativo al final del formulario que indica credenciales de prueba preconfiguradas: usuario `admin` y contraseña `secret`.
4. **Pie de Página (Footer):**
   - Invita a los usuarios que tengan inconvenientes a contactar con el equipo de soporte.

---

## 2. Gestión de Estados en React (LoginCard.tsx)

El formulario de inicio de sesión maneja estados reactivos específicos para gobernar el flujo de autenticación:

| Nombre del Estado | Tipo de Datos | Descripción |
| :--- | :--- | :--- |
| `username` | `string` | Nombre del usuario ingresado. Limpia su respectivo error de campo al modificarse. |
| `password` | `string` | Contraseña escrita en formato oculto por defecto. |
| `rememberMe` | `boolean` | Alterna si la información de sesión se persiste en el `localStorage` o en el `sessionStorage`. |
| `showPassword` | `boolean` | Alterna si el campo de contraseña se muestra en texto plano o en caracteres ocultos. |
| `errors` | `FieldErrors` | Almacena los mensajes de validación locales (ej. *"El nombre de usuario es obligatorio"*). |
| `loading` | `boolean` | Seteado en `true` para inhabilitar botones y mostrar un indicador animado mientras se espera la API. |
| `serverError` | `string` | Almacena el mensaje devuelto por el servidor en caso de credenciales inválidas o fallos de red. |
| `detectedUser` | `AuthUser \| null` | Usuario decodificado exitosamente. Activa la vista de transición *"Role Detected"*. |

---

## 3. Lógica de Transición y Animación ("RoleDetectedCard")

Para mejorar la experiencia de usuario (UX), una vez que el backend valida las credenciales y devuelve el éxito, la tarjeta de login oculta el formulario y muestra la tarjeta condicional **RoleDetectedCard**:

1. **Diseño Visual:**
   - Un círculo animado con el icono de panel (`LayoutDashboard` para administradores, fondo azul) o de mensajes (`MessageSquare` para supervisores, fondo verde).
   - El nombre real del usuario de la cuenta y su cargo dentro de la empresa.
   - Un cartel dinámico inferior que indica *"Redirigiendo..."* junto a un spinner de carga.
2. **Temporización (Timeout):**
   - Esta vista se mantiene estática exactamente por **2 segundos** para permitirle al usuario leer el mensaje de bienvenida y asimilar su redirección, antes de cambiar la ruta en el navegador.

---

## 4. Validaciones de Campos en el Cliente

Antes de enviar cualquier petición al backend, el cliente valida el formulario de forma sutil pero estricta:

- **Obligatoriedad:** El nombre de usuario y la contraseña no pueden estar vacíos.
- **Limpieza de Errores en Caliente:** Al momento de que el usuario escribe un carácter en un input que tenía error, se dispara `clearFieldError` para eliminar de inmediato la advertencia visual roja, optimizando la experiencia de interacción.

---

## 5. Integración con el Backend e Infraestructura

El flujo de inicio de sesión se conecta asíncronamente a través del servicio de autenticación (`auth.ts`):

- **Petición API:** Envía un payload JSON con `{ username, password }` en un método `POST` al endpoint `/api/auth/login`.
- **Validación del Servidor:**
  - Si las credenciales no son válidas o el usuario no existe, el servidor responde con un error semántico que el frontend traduce a: *"Nombre de usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo."*
  - Si el servidor de bases de datos está caído o hay un error de red, se muestra: *"Error de conexión. Inténtalo de nuevo."*

---

## 6. Persistencia de Sesión

La persistencia de la sesión se gestiona inteligentemente de acuerdo a la preferencia de recordar credenciales:

- **Token de Sesión:** Tras el login correcto, el servidor entrega un token JWT (`sessionToken`). Éste se guarda en `window.localStorage` bajo la clave `'crm_session_token'`.
- **Si "Acuérdate de mí" es Verdadero (`rememberMe === true`):**
  - Guarda los metadatos del usuario logueado en el **`localStorage`** bajo la clave `crm-signmedios-current-user`. La sesión se conservará incluso después de cerrar el navegador.
- **Si "Acuérdate de mí" es Falso:**
  - Guarda los metadatos en el **`sessionStorage`**. La sesión del usuario se destruirá automáticamente al cerrar la pestaña o el navegador por motivos de seguridad.

---

## 7. PostgreSQL y Esquema de Bases de Datos

El backend de login consulta y persiste la información en dos tablas principales de PostgreSQL (definidas en `init.sql`):

### A. Tabla `users`
Almacena el registro oficial de cuentas de usuario:
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  access_to_panel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
- **Filtro de Seguridad:** La base de datos requiere que la columna `status` sea `'active'` y que `access_to_panel` sea `TRUE` para autorizar la entrada.

### B. Tabla `user_sessions`
Mantiene la auditoría de tokens de sesión válidos para permitir revocación:
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revoked_at TEXT
);
```

---

## 8. Control de Redirecciones y Bloqueo de Agentes (RBAC)

La aplicación implementa una restricción absoluta sobre los roles permitidos en el panel de control:

1. **Expulsión del Rol Agente:**
   - Los usuarios registrados con el rol de **Agente (`agent`)** tienen prohibido acceder al panel web por diseño de seguridad de la empresa.
   - Al realizar el login, el frontend evalúa el rol del usuario devuelto. Si el rol es `'agent'`, el frontend cancela el proceso de guardado de credenciales, elimina cualquier token e interrumpe el flujo, devolviendo un error genérico de credenciales inválidas para mitigar fugas de información.
2. **Redireccionamiento por Rol (`homeRouteFor`):**
   - Tras validar con éxito el rol de **Administrador** o **Supervisor**, se calcula la ruta destino y se navega hacia el panel unificado del sistema:
     ```typescript
     export function homeRouteFor(role: UserRole): string {
       return role === "admin" || role === "supervisor" ? "/dashboard" : "/";
     }
     ```
3. **Guardia de Redirección Automática:**
   - Si un usuario que ya cuenta con una sesión activa ingresa manualmente a la URL del login (`/login` o `/`), el componente `LoginPage` lo detecta en el primer render (`useEffect`) mediante `getCurrentUser()` y lo redirige automáticamente a la pantalla del `/dashboard` sin forzarlo a volver a loguearse.
