# Registro Insertado - Versión 4

Este documento explica cómo implementar la versión 4 del registro insertado (Embedded Signup) y capturar los datos que genera para incorporar a clientes empresariales en la Plataforma de WhatsApp Business.

## Antes de empezar

* **Socio de soluciones o proveedor de tecnología:** Ya debes ser socio de soluciones o proveedor de tecnología.
* **Envío y recepción de mensajes:** Si los clientes de tu empresa van a usar la aplicación para enviar y recibir mensajes, debes saber cómo usar la API para enviar y recibir mensajes con tu cuenta de WhatsApp Business y números de teléfono de empresa. También debes saber cómo crear y administrar plantillas.
* **Webhooks:** Debes tener un extremo de devolución de llamada de webhooks configurado correctamente para digerir webhooks.
* **Suscripción a Webhooks:** Debes suscribirte al webhook `account_update`, ya que este se activa cuando un cliente completa correctamente el proceso de registro insertado y contiene la información de su empresa que necesitarás.
* **Línea de crédito:** Si eres un socio de soluciones, ya deberías tener una línea de crédito⁠.
* **Certificado SSL:** El servidor donde vayas a alojar el registro insertado debe tener un certificado SSL válido.

---

## Paso 1: Añadir dominios admitidos

Carga tu aplicación en el panel de aplicaciones de Meta y ve a:
**Inicio de sesión con Facebook para empresas > Configuración > Configuración del cliente de OAuth**

Define las siguientes opciones en **Sí**:
1. Acceso del cliente de OAuth
2. Acceso de OAuth web
3. Aplicar HTTPS
4. Acceso de OAuth de navegador insertado
5. Usar modo estricto para URI de redireccionamiento
6. Inicio de sesión con el SDK para JavaScript

### Detalles del flujo y SDK
El registro insertado depende del SDK para JavaScript. Cuando un cliente empresarial complete el proceso de registro insertado, este devuelve:
* El identificador de la cuenta de WhatsApp Business (WABA) del cliente.
* El identificador del número de teléfono de empresa.
* Un código de identificador intercambiable en la ventana que inició el proceso.

> **Importante:** Esto solo ocurrirá si el dominio de la página que inició el proceso aparece en los campos **Dominios autorizados** y **URI de redireccionamiento de OAuth válidos**. En estos campos, añade los dominios en los que tienes previsto alojar el registro insertado, incluidos los dominios de desarrollo en los que vas a probar el proceso. Solo se admiten los dominios que tienen activado HTTPS.

---

## Paso 2: Crear una configuración del inicio de sesión con Facebook para empresas

La configuración del inicio de sesión con Facebook para empresas define los permisos que se van a solicitar y la información adicional que se va a recopilar de los clientes empresariales que acceden al registro insertado.

Dirígete a:
**Inicio de sesión con Facebook para empresas > Configuraciones**

### Opciones de creación

1. **Crear desde plantilla (Recomendado):**
   Haz clic en el botón **Crear desde plantilla** y crea una configuración a partir de la plantilla **Configuración de registro insertado en WhatsApp con token de caducidad de 60**. La plantilla genera una configuración para los permisos y los niveles de acceso que se utilizan con mayor frecuencia.

2. **Crear configuración personalizada:**
   En la ventana *Configuraciones*, haz clic en el botón **Crear configuración** y especifica un nombre que te ayude a diferenciar la configuración personalizada de aquellas que puedas crear en el futuro. Al completar el proceso, asegúrate de seleccionar la variación de inicio de sesión con el **registro insertado de WhatsApp**:
   * Selecciona los productos que quieres incorporar para esta configuración.
   * Al elegir los activos y permisos, selecciona **solo los que realmente necesites** de tus clientes empresariales. Los activos que ya estén seleccionados se añaden de forma predeterminada.
   * *Por ejemplo:* Si seleccionas el activo *Catálogos*, pero no necesitas acceso a los catálogos de los clientes, es posible que estos abandonen el proceso en la pantalla de selección de catálogos y te pidan aclaraciones.

> **Importante:** Cuando completes el proceso de configuración, guarda el **identificador de configuración** (configuration ID), ya que lo necesitarás en el paso siguiente.

---

## Paso 3: Añadir el registro insertado a tu sitio web

Añade el siguiente código HTML y JavaScript a tu sitio web. Este es el código completo necesario para implementar el registro insertado. Cada parte del código se explicará detalladamente a continuación.

```html
<!-- SDK loading -->
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

<script>
  // SDK initialization
  window.fbAsyncInit = function() {
    FB.init({
      appId: '<APP_ID>', // your app ID goes here
      autoLogAppEvents: true,
      xfbml: true,
      version: '<GRAPH_API_VERSION>' // Graph API version goes here
    });
  };

  // Session logging message event listener
  window.addEventListener('message', (event) => {
    if (!event.origin.endsWith('facebook.com')) return;
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        console.log('message event: ', data); // remove after testing
        // your code goes here
      }
    } catch {
      console.log('message event: ', event.data); // remove after testing
      // your code goes here
    }
  });

  // Response callback
  const fbLoginCallback = (response) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log('response: ', code); // remove after testing
      // your code goes here
    } else {
      console.log('response: ', response); // remove after testing
      // your code goes here
    }
  }

  // Launch method and callback registration
  const launchWhatsAppSignup = () => {
    FB.login(fbLoginCallback, {
      config_id: '<CONFIGURATION_ID>', // your configuration ID goes here
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
      }
    });
  }
</script>

<!-- Launch button  -->
<button onclick="launchWhatsAppSignup()" style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;">
  Login with Facebook
</button>
```
