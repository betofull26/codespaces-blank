# Especificación Técnica de Funcionalidad: Autenticación de Usuarios (Login)

## 1. Metadatos del Documento

* **Módulo:** Acceso y Seguridad (CRM)
* **Autora:** Ruth Nohemí Hernández Rentería
* **Revisión / Cliente:** Sign Mendios
* **Estado:** En definición
* **Stack Tecnológico Objetivo:** React + Vite, Tailwind CSS (Frontend) | Node.js + Express (Backend)

## 2. Visión General

Este documento define la **funcionalidad** completa del módulo de inicio de sesión. El objetivo es autenticar a los agentes y supervisores para permitirles el acceso al sistema, garantizando la seguridad de los datos en tránsito y en reposo mediante prácticas modernas de criptografía y manejo de sesiones.

---

## 3. Especificaciones de Interfaz de Usuario (Frontend: React + Tailwind CSS)

### 3.1. Estructura y Estilos Visuales

El componente se renderizará centrado vertical y horizontalmente en el viewport.

* **Contenedor Principal:** Un `<form>` con un ancho máximo predefinido (ej. `max-w-md`), fondo blanco o neutro, con sombra para resaltar sobre el fondo de la pantalla.
* **Encabezado:**
* **Logo:** Renderizado en la esquina superior izquierda.
* **Título:** Texto "Acceso" (Etiqueta `<h1>`).
* **Color de Tema:** Azul brillante/Rey (ej. `text-blue-600` en Tailwind) para el título y elementos principales de marca.


* **Campos de Formulario:**

* **Correo Electrónico:** Etiqueta `<label>` vinculada a un `<input type="email">`. Placeholder: `john.doe@gmail.com` (texto en gris claro `text-gray-400`).

* **Contraseña:** Etiqueta `<label>` vinculada a un `<input type="password">`. Placeholder: `Introduce tu contraseña…` (texto en gris claro).

* **Espaciado:** Utilizar un gap vertical consistente entre los grupos de inputs (ej. `space-y-4`).


* **Controles Secundarios:**

* **Checkbox "Acuérdate de mí":** `<input type="checkbox">` alineado a la izquierda.

* **Enlace de Recuperación:** Texto "¿Olvidaste tu contraseña?" alineado a la derecha o inferior izquierdo, en color verde (ej. `text-green-500`).


* **Botón de Envío:**
* Elemento `<button type="submit">`.
* Fondo: Azul brillante/Rey (`bg-blue-600`).
* Texto: "Acceso" en color blanco (`text-white`).



### 3.2. Manejo de Estado (React)

Se requerirán los siguientes estados locales (`useState`):

* `email`: `string` (Valor inicial: `""` o el valor de `LocalStorage` si existe).
* `password`: `string` (Valor inicial: `""`).
* `rememberMe`: `boolean` (Valor inicial: `false`).
* `error`: `string | null` (Para mostrar mensajes genéricos de fallo).
* `isLoading`: `boolean` (Para deshabilitar el botón durante la petición).

---

## 4. Especificaciones de Comportamiento (Lógica de Cliente)

### 4.1. Validaciones Pre-vuelo (Client-Side)

Al disparar el evento `onSubmit`:

1. Prevenir recarga de página (`e.preventDefault()`).
2. Validar formato de `email` mediante Expresión Regular (`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
3. Validar que `password` no esté vacío y cumpla longitud mínima (ej. 8 caracteres).
4. Si falla: Actualizar el estado `error` y abortar envío.
5. Si pasa: Activar estado `isLoading` a `true` y proceder a la petición de red.

### 4.2. Petición de Red (Axios / Fetch)

* **Método:** `POST`
* **Cabeceras:** `Content-Type: application/json`
* **Payload (Body):**
```json
{
  "email": "valor_del_estado",
  "password": "valor_del_estado",
  "rememberMe": true/false
}

```



---

## 5. Especificaciones de la API y Backend (Node.js / Express)

### 5.1. Endpoint de Autenticación

* **Ruta:** `/api/v1/auth/login`
* **Método:** `POST`

### 5.2. Middlewares de Seguridad (Pre-procesamiento)

1. **Rate Limiter:** Restringir peticiones por IP/Email. Límite: 5 peticiones fallidas por ventana de 15 minutos. Si excede, retornar `HTTP 429 Too Many Requests`.
2. **Sanitización:** Ejecutar validación del body (`express-validator` o `zod`) para escapar caracteres y prevenir Inyección SQL/NoSQL.

### 5.3. Lógica de Controlador (Business Logic)

1. **Consulta de Usuario:** Buscar en la base de datos el registro donde `email === req.body.email`.
* *Si no existe:* Retornar respuesta genérica inmediata.


2. **Verificación de Contraseña:**
* Utilizar librería `bcrypt` (o `argon2`).
* Ejecutar `bcrypt.compare(req.body.password, user.password_hash)`.
* *Si es falso:* Retornar respuesta genérica.


3. **Generación de Sesión:**
* **Si es verdadero**: Generar un JSON Web Token (JWT).
* **Payload del JWT:** `userId`, `role` (ej. Agente, Supervisor).
* **Firma:** Firmar con `JWT_SECRET` del archivo de entorno.
* **Expiración:** Corta duración (ej. `15m` o `1h`).



### 5.4. Respuestas del Servidor

* **Caso Éxito (HTTP 200 OK):**
* **Headers:** Inyectar JWT en una cookie segura. Configuración de cookie: `HttpOnly=true`, `Secure=true` (solo HTTPS), `SameSite=Strict`.
* **Body:**
```json
{
  "status": "success",
  "user": {
    "id": "uuid-1234",
    "email": "john.doe@gmail.com",
    "role": "supervisor"
  }
}

```




* **Caso Fallo (HTTP 401 Unauthorized):**
* **Body:**
```json
{
  "status": "error",
  "message": "Correo electrónico o contraseña incorrectos"
}

```





---

## 6. Acciones Post-Respuesta (Resolución en Frontend)

### 6.1. Flujo de Éxito (`HTTP 200`)

1. **Limpieza de Memoria:** Limpiar inmediatamente el estado local `password = ""`.
2. **Gestión "Acuérdate de mí":**
* Si `rememberMe === true`: Guardar `email` en `localStorage.setItem('rememberedEmail', email)`.
* Si `rememberMe === false`: Ejecutar `localStorage.removeItem('rememberedEmail')`.


3. **Actualización de Contexto global:** Actualizar el Provider de autenticación (Context API / Zustand) con los datos del usuario logueado.
4. **Redirección:** Enrutar al usuario hacia el dashboard protegido (`react-router-dom`: `Maps('/dashboard')`).

### 6.2. Flujo de Error (`HTTP 401` o `429`)

1. Desactivar estado `isLoading = false`.
2. Capturar el mensaje de error del backend.
3. Renderizar el texto del error en color rojo debajo de los campos de entrada para retroalimentación visual al usuario.
4. Mantener el foco en el formulario para un nuevo intento.

---

## 7. Criterios de Aceptación

* [ ] El diseño de la interfaz coincide exactamente con los parámetros visuales (colores, placeholders, estructura) definidos en la sección 3.
* [ ] No es posible enviar el formulario si el formato de correo es inválido o la contraseña está vacía.
* [ ] Las contraseñas en tránsito están protegidas bajo HTTPS y nunca se almacenan en el estado persistente del cliente.
* [ ] El backend no expone información sobre si el fallo de login se debe al correo o a la contraseña (siempre devuelve mensaje genérico).
* [ ] El token JWT no es accesible mediante JavaScript en el frontend (protección contra XSS vía cookie `HttpOnly`).
* [ ] Marcar y desmarcar la funcionalidad "Acuérdate de mí" escribe y borra correctamente el email en el almacenamiento local tras un inicio de sesión exitoso.