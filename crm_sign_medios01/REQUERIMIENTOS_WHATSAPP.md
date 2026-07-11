# Requerimientos del Sistema - Integración de WhatsApp Business

Este documento detalla el flujo de trabajo, las interacciones y los requisitos funcionales para los diferentes módulos y pantallas del sistema en relación con la conexión de cuentas de WhatsApp Business.

---

## 1. Pantalla de Conexión de Dispositivos

Esta pantalla sirve como punto de inicio para la integración técnica con Meta.

* **Función Principal:** Contiene el formulario o registro insertado (*embedded sign-in*) de Meta para permitir la vinculación de dispositivos o cuentas de WhatsApp Business App.
* **Flujo de Usuario:**
  1. El usuario navega a la sección **"Conexión de Dispositivos"** y visualiza el registro insertado.
  2. Rellena el formulario y realiza el proceso de conexión de la cuenta de WhatsApp Business App.
  3. Tras una vinculación exitosa, el sistema muestra una pantalla intermedia con el mensaje: **"La conexión fue exitosa"**.
  4. El sistema redirige automáticamente al usuario hacia el **Dashboard**.

---

## 2. Dashboard

El Dashboard es el centro de control y visualización de las operaciones y agentes activos.

* **Sincronización Inicial:**
  * Al ingresar redirigido desde la conexión, se muestra un mensaje/botón para **sincronizar o recuperar el historial de chats, conversaciones y contactos** de la cuenta de WhatsApp Business App vinculada.
  * Solo el **Administrador** tiene el permiso de hacer clic en este botón para iniciar la restauración.
* **Validación de Ficha de Usuario:**
  * El sistema compara de forma automática si el número de teléfono de la cuenta de WhatsApp Business App registrada **coincide con el número de alguna Ficha de Usuario** existente en el sistema.
  * **Caso Exitoso (Tiene Ficha):** Se crea una tarjeta visual en el Dashboard con la siguiente información extraída de su ficha:
    * Foto registrada.
    * Nombre y apellido.
    * Número de teléfono.
    * Cargo.
  * **Caso Fallido (Sin Ficha):** Si el número no está en las fichas de usuario, el sistema muestra un mensaje claro en pantalla indicando: *"El número de la cuenta de WhatsApp Business App registrado no tiene Ficha de Usuario"*.
* **Intervención y Monitoreo en Tiempo Real:**
  * Cuando un **Administrador** o **Supervisor** hace clic sobre la tarjeta de un agente en el Dashboard, se abre una pantalla detallada.
  * En esta pantalla se cargan **todos los chats** provenientes de ese WhatsApp.
  * Permite visualizar las conversaciones en **tiempo real** y ofrece al administrador/supervisor la posibilidad de **intervenir** en el chat si lo considera necesario.

---

## 3. Directorio

El Directorio centraliza la libreta de contactos recopilada a través de las sincronizaciones.

* **Origen de Datos:** Se nutre de los contactos sincronizados de cada cuenta de WhatsApp Business App (siempre y cuando el Administrador haya optado por realizar la sincronización).
* **Filtros Avanzados:** La sección permite visualizar y buscar contactos, incluyendo la opción de filtrar las búsquedas específicamente por los **nombres de agentes** que:
  * Ya estén registrados en las Fichas de Usuarios.
  * Estén conectados a través del registro insertado de Meta.

---

## 4. Ajustes / Copia de Seguridad

Sección dedicada al respaldo y resguardo de la información de mensajería histórica.

* **Descarga de Historial:** El sistema debe permitir la **descarga de todos los chats estructurados por agentes** para su almacenamiento o auditoría offline.

---

## 5. Ajustes / Equipos y Permisos

Módulo enfocado en la gestión de roles, accesos y la asignación de cuentas de WhatsApp Business a los respectivos equipos de trabajo.

* *(Espacio reservado para definir la jerarquía de roles [Admin, Supervisor, Agente] y las reglas de visibilidad y edición sobre los dispositivos conectados y el directorio de contactos).*
