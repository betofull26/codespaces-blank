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


# Registro Insertado de WhatsApp Business

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
<button onclick="launchWhatsAppSignup()" style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;">Login with Facebook</button>
```

# Carga del SDK

La siguiente etiqueta de script carga el SDK de Facebook para JavaScript de forma asíncrona:

```html
<!-- SDK loading -->
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
```

# Inicialización del SDK

Esta parte del código inicializa el SDK. Añade aquí el identificador de la aplicación y la versión de la API Graph más reciente.

```javascript
// SDK initialization
window.fbAsyncInit = function() {
  FB.init({
    appId: '<APP_ID>', // your app ID goes here
    autoLogAppEvents: true,
    xfbml: true,
    version: '<GRAPH_API_VERSION>' // Graph API version here
  });
};
```


Sustituye los siguientes marcadores de posición por tus propios valores.

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<APP_ID>` | **Obligatorio.**<br><br>Identificador de tu aplicación. Se muestra en la parte superior del panel de aplicaciones. | 21202248997039 |
| `<GRAPH_API_VERSION>` | **Obligatorio.**<br><br>Versión de la API Graph. Indica a qué versión de la API Graph se debe llamar si te basas en los métodos del SDK para realizar llamadas a la API.<br><br>En el contexto del registro insertado, no dependerás de los métodos del SDK para realizar llamadas a la API. Establécelo en la última versión de la API:<br><br>v25.0 | v25.0 |


# Agente de escucha de eventos de mensajes del registro de la sesión

El oyente de eventos de mensajes captura la siguiente información esencial:

* Los identificadores de los activos recién generados del cliente empresarial, si ha completado correctamente el proceso.
* El nombre de la pantalla que abandonaron, si abandonaron el proceso.
* El identificador de error, si se ha producido un error y se ha utilizado el proceso para informar de él.

```javascript
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
```

El registro insertado envía esta información en un objeto de evento de mensaje a la ventana que inició el proceso y lo asigna a la constante de datos. Añade tu código personalizado a la instrucción try-catch que puede enviar este objeto a tu servidor. La estructura del objeto variará en función de la finalización, el abandono o el informe de errores del proceso, como se describe a continuación.

## Estructura de un proceso completado correctamente:

En la pantalla final, tanto si se hace clic en Finalizar como si se cierra la ventana emergente (por ejemplo, haciendo clic en el botón X), se considera que el registro se ha realizado correctamente. En los dos casos, el registro insertado devuelve el código del identificador intercambiable y el objeto de información de la sesión con los identificadores de los activos del cliente. Salir de la pantalla final no se considera un evento de cancelación.


{
  data: {
    phone_number_id: '<CUSTOMER_BUSINESS_PHONE_NUMBER_ID>',
    waba_id: '<CUSTOMER_WABA_ID>',
    business_id: '<CUSTOMER_BUSINESS_PORTFOLIO_ID>',

    <!-- only included if customer selected ad accounts -->
    ad_account_ids: ['<CUSTOMER_AD_ACCOUNT_ID_1>', '<CUSTOMER_AD_ACCOUNT_ID_2>'],

    <!-- only included if customer selected Facebook Pages -->
    page_ids: ['<CUSTOMER_PAGE_ID_1>', '<CUSTOMER_PAGE_ID_2>'],

    <!-- only included if customer selected datasets -->
    dataset_ids: ['<CUSTOMER_DATASET_ID_1>', '<CUSTOMER_DATASET_ID_2>'],

    <!-- only included if customer selected catalogs -->
    catalog_ids: ['<CUSTOMER_CATALOG_ID_1>', '<CUSTOMER_CATALOG_ID_2>'],

    <!-- only included if customer selected Instagram accounts -->
    instagram_account_ids: ['<CUSTOMER_IG_ACCOUNT_ID_1>', '<CUSTOMER_IG_ACCOUNT_ID_2>'],

    <!-- only included for multi-WABA flows -->
    waba_ids: ['<CUSTOMER_WABA_ID_1>', '<CUSTOMER_WABA_ID_2>']
  },
  type: 'WA_EMBEDDED_SIGNUP',
  event: '<FLOW_FINISH_TYPE>',
}



| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<CUSTOMER_BUSINESS_PHONE_NUMBER_ID>` | Identificador del número de teléfono de empresa del cliente empresarial. | 106540352242922 |
| `<CUSTOMER_WABA_ID>` | Identificador de la cuenta de WhatsApp Business del cliente empresarial. | 524126980791429 |
| `<CUSTOMER_BUSINESS_PORTFOLIO_ID>` | Identificador del porfolio empresarial del cliente empresarial. | 2729063490586005 |
| `<CUSTOMER_AD_ACCOUNT_ID>` | Solo se incluye si el cliente ha seleccionado cuentas publicitarias durante el proceso. Identificador de la cuenta publicitaria del cliente empresarial. | 4052175343162067 |
| `<CUSTOMER_PAGE_ID>` | Solo se incluye si el cliente ha seleccionado páginas de Facebook durante el proceso. Identificador de la página de Facebook del cliente empresarial. | 1791141545170328 |
| `<CUSTOMER_DATASET_ID>` | Solo se incluye si el cliente ha seleccionado conjuntos de datos durante el proceso. Identificador del conjunto de datos del cliente empresarial. | 524126980791429 |
| `<CUSTOMER_CATALOG_ID>` | Solo se incluye si el cliente ha seleccionado catálogos durante el proceso. Identificador del catálogo del cliente empresarial. | 8827498273649182 |
| `<CUSTOMER_IG_ACCOUNT_ID>` | Solo se incluye si el cliente ha seleccionado cuentas de Instagram durante el proceso. Identificador de la cuenta de Instagram del cliente empresarial. | 1749204838281942 |
| `<CUSTOMER_WABA_ID> (en la matriz waba_ids)` | Solo se incluye en los procesos de varias cuentas WABA. Matriz de los identificadores de las cuentas de WhatsApp Business del cliente empresarial. | 524126980791429 |
| `<FLOW_FINISH_TYPE>` | Indica que el cliente ha completado correctamente el proceso.<br><br>Valores posibles:<br>- FINISH: indica que el proceso de la API de nube se ha completado correctamente.<br>- FINISH_ONLY_WABA: indica que el usuario ha completado el proceso sin número de teléfono.<br>- FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING: indica que el usuario ha completado el proceso con un número de la aplicación de WhatsApp Business.<br>- FINISH_OBO_MIGRATION: indica que el usuario ha completado un proceso de migración en nombre de otra persona.<br>- FINISH_GRANT_ONLY_API_ACCESS: indica que el usuario ha completado un proceso de acceso a la API de solo concesión.<br>- ERROR: indica que el usuario ha encontrado un error durante el proceso. | FINISH |


## Estructura del proceso abandonado:


```javascript
{
data: {
current_step: '<CURRENT_STEP>',
},
type: 'WA_EMBEDDED_SIGNUP',
event: 'CANCEL',
}
```
| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<CURRENT_STEP>` | Indica qué pantalla estaba viendo el cliente empresarial cuando abandonó el proceso. Consulta Errores del proceso de registro insertado para obtener una descripción de cada paso. | PHONE_NUMBER_SETUP |


## Errores de los que ha informado el usuario:

```javascript
{
  data: {
    error_message: '<ERROR_MESSAGE>',
    error_code: '<ERROR_CODE>',
    session_id: '<SESSION_ID>',
    timestamp: '<TIMESTAMP>',
  },
  type: 'WA_EMBEDDED_SIGNUP',
  event: 'CANCEL',
}


| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<ERROR_MESSAGE>` | Texto con la descripción del error que se muestra al cliente empresarial en el proceso de registro insertado. Consulta Errores del proceso de registro insertado para ver una lista de errores comunes. | El nombre verificado infringe las normas de WhatsApp. Edítalo y vuelve a intentarlo. |
| `<ERROR_CODE>` | Código de error. Incluye este valor si te pones en contacto con el servicio de asistencia. | 524126 |
| `<SESSION_ID>` | Identificador de sesión único que genera el registro insertado. Incluye este identificador si te pones en contacto con el servicio de asistencia. | f34b51dab5e0498 |
| `<TIMESTAMP>` | Marca de tiempo UNIX que indica cuándo el cliente empresarial usó el registro insertado para notificar el error. Incluye este valor si te pones en contacto con el servicio de asistencia. | 1746041036 |


Analiza este objeto en tu servidor para extraer y capturar el identificador del número de teléfono del cliente y el identificador de la cuenta de WhatsApp Business, o para determinar la pantalla en la que abandonó.

Consulta Pantallas del proceso abandonadas para obtener una lista de los posibles valores de <CURRENT_STEP> y las pantallas a las que corresponden.

Ten en cuenta que la instrucción try-catch del código anterior tiene dos instrucciones que se pueden usar con el propósito de realizar pruebas:

```javascript
console.log('message event: ', data); // remove after testing
console.log('message event: ', event.data); // remove after testing
```

Estas instrucciones simplemente vuelcan el número de teléfono devuelto y los identificadores de las cuentas de WhatsApp Business, o la cadena de la pantalla abandonada, en la consola de JavaScript. Puedes dejar este código y mantener la consola abierta para ver fácilmente lo que se devuelve cuando pruebas el proceso, pero debes suprimirlo cuando hayas terminado las pruebas.



# Devolución de llamada de respuesta

Cuando un cliente empresarial complete correctamente el proceso de registro insertado, Meta enviará un código de identificador intercambiable en una respuesta de JavaScript⁠ a la ventana que inició el proceso.

```javascript
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
```

La función de devolución de llamada asigna el código del identificador intercambiable a una constante de code. Añade tu propio código personalizado a la instrucción if-else que envía este código a tu servidor para que más adelante puedas intercambiarlo por el identificador de empresa del cliente cuando incorpores al cliente empresarial.

El código del identificador intercambiable tiene una duración de 30 segundos, por lo que debes asegurarte de intercambiarlo por el identificador de empresa del cliente antes de que caduque. Si vas a realizar pruebas y quieres volcar la respuesta en la consola de JavaScript para intercambiar el código de forma manual con otra aplicación (como Postman) o tu terminal con cURL, configura la consulta de intercambio de identificadores antes de empezar las pruebas.

Ten en cuenta que la instrucción if-else del código anterior tiene dos instrucciones que se pueden usar con fines de prueba:

```javascript
console.log('response: ', code); // remove after testing
console.log('response: ', response); // remove after testing
```

Estas instrucciones solo vuelcan el código o la respuesta sin formato en la consola de JavaScript. Puedes dejar este código y mantener la consola abierta para ver fácilmente lo que se devuelve cuando pruebas el proceso, pero debes suprimirlo cuando hayas terminado las pruebas.

# Método de inicio y registro de devolución de llamada

Esta parte del código define un método al que puede llamar un evento onclick que registra la devolución de llamada de respuesta del paso anterior e inicia el proceso de registro insertado.



## Añade el identificador de configuración aquí.

```javascript
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
```

## Botón Iniciar

Esta parte del código define un botón que llama al método de inicio del paso anterior cuando el cliente empresarial hace clic en él.

```html
<!-- Launch button -->
<button onclick="launchWhatsAppSignup()" style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;">Login with Facebook</button>
```

## Pruebas

Una vez que hayas completado todos los pasos de implementación anteriores, deberías poder probar el proceso simulando un cliente empresarial con tus propias credenciales de Meta. Cualquier persona que hayas añadido como administrador o desarrollador en tu aplicación (en la ventana Panel de aplicaciones > Roles de la aplicación > Roles) también puede empezar a probar el proceso con sus propias credenciales de Meta.

## Incorporación de clientes empresariales

El registro insertado genera activos para los clientes de tu empresa y concede a tu aplicación acceso a dichos activos. Sin embargo, tienes que realizar una serie de llamadas a la API para incorporar por completo a los nuevos clientes empresariales que han completado el proceso.

Las llamadas a la API que debes realizar para incorporar a los clientes son diferentes para los socios de soluciones y los proveedores o socios de tecnología.


# Incorporar clientes empresariales como proveedor o socio de tecnología

En este texto se describen los pasos que deben seguir los proveedores y socios de tecnología para incorporar a nuevos clientes empresariales que hayan completado el proceso de registro insertado.

Si eres un proveedor o socio de tecnología, un cliente empresarial que complete tu implementación del proceso de registro insertado no podrá usar tu aplicación para acceder a sus activos de WhatsApp ni enviar y recibir mensajes (si ofreces este tipo de servicio) hasta que completes estos pasos.

## Qué necesitarás

* El identificador de la cuenta de WhatsApp Business del cliente empresarial, que se devuelve mediante el registro de sesión o la solicitud de la API.
* El identificador del número de teléfono empresarial del cliente empresarial, que se devuelve mediante el registro de sesión o la solicitud de la API.
* El identificador de tu aplicación, disponible en la parte superior del panel de aplicaciones.
* La clave secreta de la aplicación, que encontrarás en Panel de aplicaciones > Configuración de la aplicación > Información básica.

Además, si quieres probar las funciones de mensajes con el número de teléfono de empresa del cliente, necesitarás un número de teléfono de WhatsApp que ya pueda intercambiar mensajes con otros números de WhatsApp.

Sigue todos los pasos que se describen a continuación usando las solicitudes de servidor a servidor. No uses las solicitudes de cliente.



# Paso 1: Intercambiar el código del identificador por un identificador empresarial

Utiliza el extremo GET `/oauth/access_token` para intercambiar el código del identificador que devuelve el registro insertado por un identificador de acceso de usuario del sistema de integración empresarial (“identificador empresarial”).

```bash
curl --get 'https://graph.facebook.com/v21.0/oauth/access_token' -d 'client_id=<APP_ID>' -d 'client_secret=<APP_SECRET>' -d 'code=<CODE>'
```

## Parámetros de la solicitud

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<APP_ID>` | Obligatorio.<br>Identificador de tu aplicación. Se muestra en la parte superior del panel de aplicaciones. | `236484624622562` |
| `<APP_SECRET>` | Obligatorio.<br>La clave secreta de la aplicación. Puedes obtenerla en Panel de aplicaciones > Clave secreta de la aplicación > Información básica. | `614fc2afde15eee07a26b2fe3eaee9b9` |
| `<CODE>` | Obligatorio.<br>El código devuelto por el registro integrado cuando el cliente complete el proceso correctamente. | `AQBhlXsctMxJYbwbrpybxlo9tLPGy-QAmjBJA03jxLos43wxlBlrYozY5C33BXJULd133cOJf_5y6EkJZYMrAmW-EMj3Wdap9-NUM2nS4s8tC-ES7slBhh6QpCFM7-SzpI-iqsjqTGyxbUUW3AeaEyLkeZFIkBgcQ_SOxo9HShm20SDR5_n7AT9ZJ5dcgpqBQykNT-pQ8V7Ne9-sr6RLAWtJMF7-Zx6ABudRcWIN53tUTtquDVNuq3lrco4BlVQAv-54tR83Ae0ODN9Uet6j-BVLuetXhQCM3sz9RdgedlbxkidMbkztvYX1j7baOrJxyLyYGWYgbnUrKRQKCtWTsO5ekIGFgtbpS8UPJNqV6j8E5XKPJ8QA7ZFqzkB0s2O__J5FrjHzc_rDo1EuRbw98ihHDzQnvuXeHapEyfhLDJct0A` |


# Respuesta

Si se realiza correctamente:

`<BUSINESS_TOKEN>`

## Parámetros de la respuesta

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<BUSINESS_TOKEN>` | Identificador de empresa del cliente. | `EAAAN6tcBzAUBOwtDtTfmZCJ9n3FHpSDcDTH86ekf89XnnMZAtaitMUysPDE7LES3CXkA4MmbKCghdQeU1boHr0QZA05SShiILcoUy7ZAb2GE7hrUEpYHKLDuP2sYZCURkZCHGEvEGjScGLHzC4KDm8tq2slt4BsOQE1HHX8DzHahdT51MRDqBw0YaeZByrVFZkVAoVTxXUtuKgDDdrmJQXMnI4jqJYetsZCP1efj5ygGscZBm4OvvuCYB039ZAFlyNn` |


# Paso 2: Suscribirse a los webhooks en la cuenta de WhatsApp Business del cliente

Usa el extremo POST `/<WABA_ID>/subscribed_apps` para suscribir tu aplicación a webhooks en la cuenta de WhatsApp Business del cliente empresarial. Si quieres que los webhooks del cliente se envíen a una URL de devolución de llamada diferente de la que se ha establecido en la aplicación, tienes varias opciones de anulación de webhooks.

## Solicitud

```bash
curl -X POST 'https://graph.facebook.com/<API_VERSION>/<WABA_ID>/subscribed_apps' \
-H 'Authorization: Bearer <ACCESS_TOKEN>'
```

## Parámetros de la solicitud

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<API_VERSION>` | Cadena<br>Opcional.<br>Versión de la API Graph. | `v25.0` |
| `<BUSINESS_TOKEN>` | Cadena<br>Obligatorio.<br>El identificador de empresa del cliente empresarial. | `EAAAN6tcBzAUBOwtDtTfmZCJ9n3FHpSDcDTH86ekf89XnnMZAtaitMUysPDE7LES3CXkA4MmbKCghdQeU1boHr0QZA05SShiILcoUy7ZAb2GE7hrUEpYHKLDuP2sYZCURkZCHGEvEGjScGLHzC4KDm8tq2slt4BsOQE1HHX8DzHahdT51MRDqBw0YaeZByrVFZkVAoVTxXUtuKgDDdrmJQXMnI4jqJYetsZCP1efj5ygGscZBm4OvvuCYB039ZAFlyNn` |
| `<WABA_ID>` | Cadena<br>Obligatorio.<br>Identificador de la cuenta de WhatsApp Business. | `102290129340398` |


# Respuesta

Si se realiza correctamente:

```json
{
  "success": true
}
```

# Paso 3: Registrar el número de teléfono del cliente

Usa la API de registro para registrar el número de teléfono de empresa del cliente y usarlo con la API de nube.

## Solicitud

```bash
curl 'https://graph.facebook.com/v21.0/<BUSINESS_CUSTOMER_PHONE_NUMBER_ID>/register' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <BUSINESS_TOKEN>' \
-d '
{
  "messaging_product": "whatsapp",
  "pin": "<DESIRED_PIN>"
}'
```

# Parámetros de la solicitud

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<BUSINESS_CUSTOMER_PHONE_NUMBER_ID>` | Cadena<br>Obligatorio.<br>Identificador del número de teléfono de empresa del cliente empresarial. | `106540352242922` |
| `<BUSINESS_TOKEN>` | Cadena<br>Obligatorio.<br>El identificador de empresa del cliente empresarial. | `EAAAN6tcBzAUBOwtDtTfmZCJ9n3FHpSDcDTH86ekf89XnnMZAtaitMUysPDE7LES3CXkA4MmbKCghdQeU1boHr0QZA05SShiILcoUy7ZAb2GE7hrUEpYHKLDuP2sYZCURkZCHGEvEGjScGLHzC4KDm8tq2slt4BsOQE1HHX8DzHahdT51MRDqBw0YaeZByrVFZkVAoVTxXUtuKgDDdrmJQXMnI4jqJYetsZCP1efj5ygGscZBm4OvvuCYB039ZAFlyNn` |
| `<DESIRED_PIN>` | Cadena<br>Obligatorio.<br>Establece este valor en un número de seis dígitos. Este número será el PIN de la verificación en dos pasos del número de teléfono de empresa. | `581063` |


# Respuesta

Si se realiza correctamente:

```json
{
  "success": true
}
```

# Paso 4: Enviar un mensaje de prueba

Este paso es opcional.

Si quieres probar las funciones relacionadas con los mensajes del número de teléfono de empresa de tu cliente, envíale un mensaje desde tu propio número de WhatsApp. Entonces, se abrirá un periodo de atención al cliente, durante el que podrás responder con cualquier tipo de mensaje.

Después, usa la API de mensajes para responder con un mensaje de texto.

## Solicitud

```bash
curl 'https://graph.facebook.com/v21.0/<BUSINESS_CUSTOMER_PHONE_NUMBER_ID>/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <BUSINESS_TOKEN>' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_NUMBER>",
  "type": "text",
  "text": {
    "body": "<BODY_TEXT>"
  }
}'
```

## Parámetros de la solicitud

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<BODY_TEXT>` | Cadena<br>Obligatorio.<br>Texto del cuerpo del mensaje. Admite URL.<br>Máximo 4096 caracteres. | `Message received, loud and clear!` |
| `<BUSINESS_CUSTOMER_PHONE_NUMBER_ID>` | Cadena<br>Obligatorio.<br>Identificador del número de teléfono de empresa del cliente empresarial. | `106540352242922` |
| `<BUSINESS_TOKEN>` | Cadena<br>Obligatorio.<br>El identificador de empresa del cliente empresarial. | `EAAAN6tcBzAUBOwtDtTfmZCJ9n3FHpSDcDTH86ekf89XnnMZAtaitMUysPDE7LES3CXkA4MmbKCghdQeU1boHr0QZA05SShiILcoUy7ZAb2GE7hrUEpYHKLDuP2sYZCURkZCHGEvEGjScGLHzC4KDm8tq2slt4BsOQE1HHX8DzHahdT51MRDqBw0YaeZByrVFZkVAoVTxXUtuKgDDdrmJQXMnI4jqJYetsZCP1efj5ygGscZBm4OvvuCYB039ZAFlyNn` |
| `<WHATSAPP_USER_NUMBER>` | Cadena<br>Obligatorio.<br>Tu número de teléfono de WhatsApp, que puede enviar y recibir mensajes de otros números de WhatsApp.<br>No puede ser un número de teléfono de empresa que ya esté registrado para usarse con la API de nube. | `+16505551234` |


# Respuesta

Si se realiza correctamente:

```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "<WHATSAPP_USER_NUMBER>",
      "wa_id": "<WHATSAPP_USER_ID>"
    }
  ],
  "messages": [
    {
      "id": "<WHATSAPP_MESSAGE_ID>"
    }
  ]
}
```

## Parámetros de la respuesta

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<WHATSAPP_MESSAGE_ID>` | Identificador del mensaje de WhatsApp. | `wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3NEYxMzAzMzQ5MkEA` |
| `<WHATSAPP_USER_ID>` | Tu identificador de usuario de WhatsApp. | `16505551234` |
| `<WHATSAPP_USER_NUMBER>` | Tu número de teléfono de WhatsApp al que se envió el mensaje. | `+16505551234` |


Si has podido enviar y recibir mensajes correctamente mediante el número de teléfono de empresa del cliente y si se han activado webhooks de mensajes que describen el mensaje inicial que enviaste y también los estados de entrega del mensaje que mandaste como respuesta, el número de teléfono de empresa del cliente funciona correctamente.

# Paso 5: Pedir al cliente que añada un método de pago

Indícale al cliente que use el Administrador de WhatsApp para añadir un método de pago. Puedes proporcionarle el siguiente enlace del Servicio de ayuda: 

https://www.facebook.com/business/help/488291839463771

También puedes darle estas instrucciones:

1. Accede a la ventana Administrador de WhatsApp > Descripción desde https://business.facebook.com/wa/manage/home/.
2. Haz clic en el botón Añadir método de pago.
3. Completa todos los pasos.

Cuando tu cliente añada un método de pago, se habrá incorporado por completo a la plataforma de WhatsApp Business. De esta forma, podrá empezar a usar tu aplicación para acceder a sus activos de WhatsApp y enviar y recibir mensajes (si le proporcionas ese servicio).


# Incorporar usuarios de la aplicación de WhatsApp Business

A esta función se la conoce como “coexistencia” en los canales de asistencia y la documentación para socios.

Puedes configurar el registro insertado para permitir que los clientes empresariales se incorporen mediante su cuenta de la aplicación WhatsApp Business y su número de teléfono existentes:

* Cuando un cliente empresarial elige esta opción y se incorpora correctamente, puede utilizar tu aplicación para enviar grandes volúmenes de mensajes.
* Aun así, pueden enviar mensajes de forma individual con la aplicación de WhatsApp Business.
* Además, WhatsApp mantiene sincronizado el historial de mensajes entre ambas aplicaciones.

## Cómo funciona

Cuando configures el registro insertado para los números de teléfono de la aplicación de WhatsApp Business, los clientes empresariales que completen el proceso tendrán la opción de conectar su cuenta existente de la aplicación de WhatsApp Business a la API de nube:

Al completar el proceso, se devuelven sus identificadores de piezas de contenido y el código de identificador intercambiable a la ventana de generación, como de costumbre. A continuación, puedes utilizar esta información en las llamadas a la API para incorporar al cliente empresarial de la misma forma que a cualquier otro. También puedes sincronizar sus contactos y el historial de mensajes (si la empresa lo permite) para que puedas rellenarlos en tu aplicación.

## Requisitos

* El cliente empresarial debe usar la versión 2.24.17 o superior de la aplicación de WhatsApp Business.
* Ya debes ser socio de soluciones o proveedor de tecnología.
* Debes saber usar la API de nube.
* Tu devolución de llamada de webhook debe poder aceptar y digerir webhooks correctamente.
* Debes utilizar el registro insertado con registro de sesión.

## Limitaciones

* Para seguir siendo compatibles con la aplicación de WhatsApp Business, los números de teléfono de empresa que están en uso con la aplicación de WhatsApp Business y la API de nube tienen un rendimiento fijo de 20 mps.
* Si el cliente empresarial ha trabajado con un socio en el pasado y sigue compartiendo la línea de crédito anterior, es posible que se muestre un error al intentar cambiar a un nuevo socio. Sigue la guía para resolver el error.

## Precios

Cuando un cliente empresarial se haya incorporado a la API de nube, los mensajes que envíe la empresa mediante la aplicación de WhatsApp Business seguirán siendo gratuitos, pero los mensajes que se envíen mediante la API de nube estarán sujetos a los precios de la API de nube.

Consulta el PDF explicativo sobre precios Soluciones de la API para usuarios de la aplicación de WhatsApp Business para obtener desgloses de situaciones comunes relacionadas con los precios.

## Periodo de atención al cliente

WhatsApp solo abre un periodo de atención al cliente cuando un usuario de WhatsApp envía un mensaje a un cliente empresarial que ya se ha incorporado a la API de nube. 

* Si un usuario de WhatsApp envía un mensaje a un cliente empresarial justo antes de que este se incorpore a la API de nube, el cliente empresarial solo puede responder con un mensaje de plantilla, ya que WhatsApp no ha abierto ningún periodo de atención al cliente. 
* Si el usuario de WhatsApp envía mensajes al cliente empresarial después de la incorporación a la API de nube, WhatsApp abre un periodo de atención al cliente con normalidad y el cliente empresarial puede responder con un mensaje que no sea de plantilla.

La restricción del periodo de atención al cliente de 24 horas se aplica a los mensajes enviados mediante la API de nube. Los mensajes que se envían desde la aplicación de WhatsApp Business no están sujetos al periodo de atención al cliente y no crean ni amplían periodos de conversación de la API de nube ni a los precios de la API de nube, ni les afectan.

# Comparación de funciones

En la siguiente tabla se describen las funciones que están disponibles para los clientes empresariales que se han incorporado a la API de nube, así como los cambios en la funcionalidad de la aplicación de WhatsApp Business después de la incorporación.


| Función existente en la aplicación de WhatsApp Business | Cambios en las funciones después de la incorporación | ¿La API de nube admite la función? |
| :--- | :--- | :--- |
| **Chats individuales (1:1)** | Ahora se admite la edición y revocación de mensajes. Se pueden sincronizar todos los mensajes de chat de los últimos seis meses. Los mensajes enviados y recibidos se replican entre la API de nube y la aplicación de WhatsApp Business. | Sí, se admite. |
| **Contactos** | No ha habido cambios. Todos los contactos con un número de WhatsApp pueden sincronizarse. | Sí, se admite. |
| **Chats en grupo** | No ha habido cambios. Los chats en grupo no se sincronizarán. | No, no se admite. |
| **Mensajes temporales** | Los mensajes temporales se desactivarán para todos los chats individuales (1:1). | No, no se admite. |
| **Mensaje para ver una vez** | Los mensajes de visualización única se desactivarán para todos los chats individuales (1:1). | No, no se admite. |
| **Mensaje de ubicación en tiempo real** | Los mensajes de ubicación en tiempo real se desactivarán para todos los chats individuales (1:1). | No, no se admite. |
| **Listas de difusión** | Las listas de difusión se desactivarán. Las empresas no podrán crear nuevas listas de difusión. Las listas de difusión existentes pasarán a ser de solo lectura. | No, no se admite. |
| **Llamadas de voz y videollamadas** | No ha habido cambios. | No, no se admite. |
| **Herramientas para empresas** (catálogo, pedidos, estado) | No ha habido cambios. | No, no se admite. |
| **Herramientas de mensajes** (marketing, saludo, ausencia, respuestas rápidas, etiquetas) | No ha habido cambios. | No, no se admite. |
| **Perfil de empresa** (nombre, dirección, sitio web) | No ha habido cambios. | No, no se admite. |
| **Canales** | No ha habido cambios. | No, no se admite. |


# Dispositivos vinculados

Las empresas pueden vincular hasta cuatro clientes “complementarios” de WhatsApp a su cuenta de la aplicación de WhatsApp Business en otros dispositivos (descritos como “dispositivos vinculados” en nuestro Servicio de ayuda).

Se admiten todos los clientes complementarios, excepto WhatsApp para Windows y WhatsApp para WearOS.

* Cuando un cliente empresarial se incorpora a la API de nube con una cuenta y un número de la aplicación de WhatsApp Business existentes, todas las aplicaciones complementarias se desvinculan de la cuenta y, a continuación, la empresa puede volver a vincular cualquier aplicación complementaria admitida.
* Los usuarios de WhatsApp que utilicen un cliente complementario no admitido para enviar mensajes a una empresa incorporada podrán hacerlo, pero el mensaje no activará los webhooks de mensajes, por lo que la empresa no podrá reflejar el mensaje en su propia aplicación.
* Los mensajes enviados desde una empresa incorporada (por cualquier medio) que se vean en un dispositivo complementario no admitido aparecerán con un texto del marcador de posición que pedirá al usuario de WhatsApp que vea el mensaje en su dispositivo principal.

# Configurar la aplicación

## Paso 1: Suscríbete a webhooks

Accede a Panel de aplicaciones > WhatsApp > ventana Configuración y suscribe la aplicación a los siguientes campos de temas de webhooks de la cuenta de WhatsApp Business. Asegúrate de que el código de devolución de llamada de la aplicación pueda gestionar las cargas de cada uno de ellos. Estos campos se añaden a los que ya estés usando como socio.

* **history**: describe los mensajes anteriores que el cliente empresarial ha enviado o recibido.
* **smb_app_state_sync**: describe los contactos nuevos y actuales del cliente empresarial.
* **smb_message_echoes**: describe los nuevos mensajes que envía el cliente empresarial con la aplicación de WhatsApp Business después de la incorporación.

# Paso 2: Personaliza el registro insertado

Añade una propiedad `featureType` establecida en `whatsapp_business_app_onboarding` al objeto `extras` en la parte del método de inicio y registro de devolución de llamada del código de implementación del registro insertado.

```json
// Launch method and callback registration
{
  "config_id": "<CONFIGURATION_ID>",
  "response_type": "code",
  "override_default_response_type": true,
  "extras": {
    "setup": {},
    "featureType": "whatsapp_business_app_onboarding", // set to 'whatsapp_business_app_onboarding'
    "sessionInfoVersion": "3"
  }
}
```

Para verificar si has activado correctamente la función, accede a tu implementación del registro insertado. Si la pantalla de selección de la cuenta de WhatsApp Business se ha reemplazado por una que te da la opción de conectar la cuenta existente, la función se ha activado.

# Paso 3: Muestra el registro insertado a los clientes

Una vez que hayas confirmado que la función se ha activado, muestra el registro insertado a los clientes de tu empresa.

Cuando una empresa completa el proceso e incorporas al cliente, tienes 24 horas para sincronizar su historial de mensajes o, de lo contrario, deberás cancelar su incorporación y volver a completar el proceso. Por este motivo:

* Realiza la incorporación y la sincronización en cuanto la empresa complete el proceso.
* Indica a la empresa que vas a sincronizar los datos de su aplicación de WhatsApp Business.
* Indícale que mantenga abierta la aplicación de WhatsApp Business para facilitar el proceso de sincronización.

La incorporación y sincronización pueden tardar varios minutos, en función de distintos factores, como el tamaño del historial de mensajes de la empresa, su velocidad de internet y la velocidad con la que se pueden digerir los webhooks.

Cuando hayas completado el proceso de incorporación, la aplicación de WhatsApp Business se actualizará automáticamente e indicará a la empresa que su número está conectado a la API.

Una vez hayas finalizado la sincronización del historial de mensajes de la empresa, informa al cliente de que el proceso se ha completado.

# Incorporar a clientes empresariales

Cuando un cliente empresarial complete correctamente el proceso de registro insertado, este devolverá los identificadores de sus activos y un código de identificador intercambiable en la ventana en la que se inició el proceso, como de forma habitual, pero la carga del evento de sesión `session` establecerá `event` como `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`:

```json
{
  "data": {
    "waba_id": "<CUSTOMER_WABA_ID>"
  },
  "type": "WA_EMBEDDED_SIGNUP",
  "event": "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
  "version": 3
}
```

Captura los identificadores de activos del cliente y el código de identificador intercambiable y úsalos para incorporar al cliente como lo harías normalmente, pero omite el paso de registro del número de teléfono, ya que el número ya está registrado.

* Incorporar clientes empresariales como socios
* Incorporar clientes empresariales como proveedores de tecnología

Una vez que hayas completado estos pasos de incorporación, puedes iniciar el proceso de sincronización del historial de mensajes.

# Comprobar el estado de la incorporación (opcional)

Para confirmar que el número de teléfono empresarial del cliente está registrado para usarlo tanto con la API de nube como con la aplicación de WhatsApp Business, solicita los campos `is_on_biz_app` y `platform_type` en el identificador del número de teléfono empresarial:

Ejemplo de solicitud:

```bash
curl 'https://graph.facebook.com/v25.0/106540352242922?fields=is_on_biz_app,platform_type' -H 'Authorization: Bearer EAAJB...'
```

# Ejemplo de respuesta

Si `is_on_biz_app` es `true` y `platform_type` es `CLOUD_API`, el número de teléfono de empresa puede usar la API de nube y la aplicación de WhatsApp Business:

```json
{
  "is_on_biz_app": true,
  "platform_type": "CLOUD_API",
  "id": "106540352242922"
}
```

# Sincronizar los datos de la aplicación de WhatsApp Business

Una vez incorporado el cliente empresarial, tienes 24 horas para sincronizar sus contactos y el historial de mensajes. De lo contrario, deberá cancelar su incorporación y volver a completar el proceso. Por este motivo, deberías iniciar el proceso de sincronización en cuanto finalices la incorporación de la empresa.

Como recordatorio, asegúrate de haberte suscrito a la cuenta de WhatsApp Business de la empresa al incorporarte y de haberte suscrito a los campos de webhook adicionales, de lo contrario te perderás webhooks importantes.

## Paso 1: Inicia la sincronización de contactos

Usa la API de datos de la aplicación para pymes para solicitar la información de contacto del cliente empresarial.

Si la solicitud se realiza correctamente, WhatsApp envía un conjunto de webhooks `smb_app_state_sync` que describen los contactos de WhatsApp en la aplicación de WhatsApp Business de la empresa. Las adiciones y los futuros cambios en los contactos de WhatsApp de la empresa activarán un webhook `smb_app_state_sync` correspondiente.

Solo puedes realizar este paso una vez. Si tienes que volver a realizarlo, el cliente primero deberá cancelar su registro y, después, completar de nuevo el proceso de registro insertado.

### Solicitud de ejemplo

```bash
curl -X POST 'https://graph.facebook.com/<API_VERSION>/<BUSINESS_PHONE_NUMBER_ID>/smb_app_data' -H 'Authorization: <ACCESS_TOKEN>' -H 'Content-Type: application/json' -d '
{
  "messaging_product": "whatsapp",
  "sync_type": "smb_app_state_sync"
}'
```


### Ejemplo de respuesta

Si se realiza correctamente:

```json
{
  "messaging_product": "whatsapp",
  "request_id" : "<REQUEST_ID>"
}
```

Guarda el valor de `request_id` en caso de que necesites contactar con el equipo de asistencia.

## Paso 2: Inicia la sincronización del historial de mensajes

Vuelve a usar la API de datos de la aplicación para pymes, esta vez para iniciar la sincronización del historial de mensajes. Si la operación se realiza correctamente, se activarán cero, uno o varios webhooks del historial en función de si la empresa ha elegido compartir su historial de mensajes contigo.

Solo puedes realizar este paso una vez. Si tienes que volver a realizarlo, el cliente primero deberá cancelar su registro y, después, completar de nuevo el proceso de registro insertado.

### Historial de mensajes compartido

Si la empresa ha elegido compartir su historial de mensajes contigo, se activarán una serie de webhooks de historial que describen los mensajes intercambiados con los usuarios de WhatsApp en un periodo determinado. Consulta `history` para obtener una descripción del contenido de estos webhooks y cómo se organizan.

### Historial de mensajes no compartido

Si la empresa ha decidido no compartir su historial de mensajes contigo, se activará un webhook `history` con el código de error 2593109.

### Solicitud de ejemplo

```bash
curl -X POST 'https://graph.facebook.com/<API_VERSION>/<BUSINESS_PHONE_NUMBER_ID>/smb_app_data -H 'Authorization: <ACCESS_TOKEN>' -H 'Content-Type: application/json' -d '
{
  "messaging_product": "whatsapp",
  "sync_type": "history"
}'
```

### Ejemplo de respuesta

Si la solicitud se realiza correctamente, la API responderá con la siguiente carga JSON. Esta respuesta solo indica que la solicitud se ha aceptado correctamente, no si la empresa ha compartido su historial de mensajes contigo.

```json
{
  "messaging_product": "whatsapp",
  "request_id" : "<REQUEST_ID>"
}
```

Guarda el valor de `request_id` en caso de que necesites contactar con el equipo de asistencia.

## Paso 3: Refleja los nuevos mensajes de la aplicación de WhatsApp Business

Las empresas incorporadas pueden seguir utilizando la aplicación de WhatsApp Business y los dispositivos complementarios admitidos para enviar y recibir mensajes. Cada vez que una empresa envía un mensaje con una de estas aplicaciones, se activa un webhook `smb_message_echoes` que debes digerir y mostrar en el historial de conversaciones con el contacto en tu aplicación.

## Informar de la actividad de conversión

Los clientes empresariales incorporados pueden poner en circulación anuncios de clic a WhatsApp, por lo que informa de las señales de compra o generación de clientes potenciales en nombre de la empresa que está utilizando la API de conversiones. Consulta API de conversiones para mensajes empresariales.

## Cancelar clientes empresariales

No puedes usar la API de anulación de registro para anular el registro de un número de teléfono de empresa en la API de nube si ya se está utilizando con esta y la aplicación de WhatsApp Business.

En su lugar, los clientes pueden usar la aplicación de WhatsApp Business para desconectarse de la API de nube. Para ello, deben acceder a Configuración > Cuenta > Plataforma empresarial y hacer clic en el botón Desconectar cuenta. Cuando el cliente se desconecta de la API de nube, se activa un webhook `account_update` con un evento `PARTNER_REMOVED`. Este webhook puede incluir un objeto `disconnection_info` que indique el motivo de la desconexión y si la inició el cliente o el sistema.

## Errores

Si incorporas un cliente empresarial con un número de teléfono de la aplicación de WhatsApp Business, es posible que recibas un webhook de mensajes no admitidos con el código de error 131060. Esto es normal y puede ocurrir en las siguientes situaciones:

* **Primer mensaje:** un usuario de WhatsApp envía un mensaje a tu empresa por primera vez. Esto es especialmente habitual cuando los usuarios tocan uno de tus anuncios de clic a WhatsApp y envían un mensaje de inmediato. El error suele resolverse en unos segundos y, después, WhatsApp entrega los mensajes con normalidad.
* **Dispositivo complementario no admitido:** un usuario de WhatsApp con un dispositivo complementario no admitido envía o recibe un mensaje de tu empresa.

Si recibes este webhook, pídele a la empresa que compruebe el mensaje en la aplicación de WhatsApp Business.


# Webhooks

## account_update

Describe los cambios realizados en una cuenta de WhatsApp Business (WABA).

### Eventos de activación
* El número de teléfono de empresa asociado con la cuenta de WhatsApp Business cambia.
* El estado de la cuenta de WhatsApp Business cambia.

### Sintaxis de la carga

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WABA_ID>",
      "time": <WEBHOOK_TIMESTAMP>,
      "changes": [
        {
          "value": {
              "phone_number": "<BUSINESS_PHONE_NUMBER>",
              "event": "<EVENT>",
              "disconnection_info": {  // only included for PARTNER_REMOVED events
                "reason": "<DISCONNECTION_REASON>",
                "initiated_by": "<DISCONNECTION_INITIATED_BY>"
              }
           },
          "field": "account_update"
        }
      ]
    }
  ]
}
```

### Ejemplo de carga

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1739212624,
      "changes": [
        {
          "value": {
              "phone_number": "15550783881",
              "event": "PARTNER_REMOVED",
              "disconnection_info": {
                "reason": "PRIMARY_INACTIVITY",
                "initiated_by": "SYSTEM"
              }
           },
          "field": "account_update"
        }
      ]
    }
  ]
}
```

El objeto `disconnection_info` contiene:

* **reason**: por qué se ha desconectado el cliente. Valores: `ACCOUNT_DISCONNECTED` (la cuenta de tu cliente se ha desconectado debido a la aplicación de medidas o porque tu cliente ha eliminado explícitamente su cuenta de WhatsApp; `USER` indica que la acción la inicia el usuario y `SYSTEM`, que la inicia el sistema), `BUSINESS_DOWNGRADE` (tu cliente ha registrado su número de teléfono de empresa con la aplicación de WhatsApp para consumidores), `CHANGE_NUMBER` (tu cliente ha cambiado su número de teléfono), `COMPANION_INACTIVITY` (dispositivo complementario inactivo durante aproximadamente 30 días), `PRIMARY_INACTIVITY` (dispositivo principal inactivo durante 14 días aproximadamente), `USER_RE_REGISTERED` (tu cliente se ha vuelto a registrar en un nuevo dispositivo).
* **initiated_by**: indica si la desconexión la inició el cliente o el sistema. Valores: `USER`, `SYSTEM`.

Consulta la referencia del webhook `account_update` para obtener más información.

---

## account_offboarded

Describe los cambios que se producen en una cuenta de WhatsApp Business (WABA) cuando la empresa cancela el registro o lo vuelve a llevar a cabo tras cambiar de dispositivo.

### Eventos de activación

* El número de teléfono de empresa asociado con la cuenta de WhatsApp Business cambia de dispositivo y se vuelve a registrar.
* El estado de la cuenta de WhatsApp Business cambia debido a que la empresa desvincula el número de teléfono de su aplicación de WhatsApp Business.

## Sintaxis de la carga

```json
{
  "entry": [
    {
      "id": "<WABA_ID>",
      "time": "<WEBHOOK_TIMESTAMP>",
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_OFFBOARDED"
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

## Ejemplo de carga

```json
{
  "entry": [
    {
      "id": "862475293675413",
      "time": 1768477204,
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_OFFBOARDED"
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

## account_reconnected

Describe cuándo una cuenta de WhatsApp Business (“WABA”) se vuelve a conectar (se vuelve a incorporar) después de haberse desconectado previamente.

### Eventos de activación

* La empresa se vuelve a incorporar al mismo socio después de cancelar la incorporación.
* El estado de la cuenta WABA cambia a “Reconectada”.

### Sintaxis de la carga

```json
{
  "entry": [
    {
      "id": "<WABA_ID>",
      "time": "<WEBHOOK_TIMESTAMP>",
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_RECONNECTED"
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

### Ejemplo de carga

```json
{
  "entry": [
    {
      "id": "862475293675413",
      "time": 1768477203,
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_RECONNECTED"
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

## Editar

Describe los eventos de edición y el contenido de la carga del webhook de mensajes de la cuenta de WhatsApp Business para las respuestas a los mensajes interactivos.

### Eventos de activación

* Un usuario de WhatsApp edita un mensaje enviado previamente (texto o contenido multimedia con descripción).
* Un usuario de WhatsApp edita un mensaje enviado anteriormente en un plazo de 15 minutos desde el envío

### Sintaxis de la carga

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "<BUSINESS_DISPLAY_PHONE_NUMBER>",
              "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
            },
            "contacts": [
              {
                "profile": {
                  "name": "<WHATSAPP_USER_PROFILE_NAME>"
                },
                "wa_id": "<WHATSAPP_USER_ID>"
              }
            ],
            "messages": [
              {
                "from": "<WHATSAPP_USER_PHONE_NUMBER>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<WEBHOOK_TRIGGER_TIMESTAMP>",
                "type": "edit",
                "edit": {
                  "original_message_id": "<ORIGINAL_WHATSAPP_MESSAGE_ID>",
                  "message": {
                    "context": {
                      "id": "<CONTEXT_ID>"
                    },
                    "type": "image",
                    "image": {
                      "caption": "<MEDIA_ASSET_CAPTION>",
                      "mime_type": "<MEDIA_ASSET_MIME_TYPE>",
                      "sha256": "<MEDIA_ASSET_SHA256_HASH>",
                      "id": "<MEDIA_ASSET_ID>",
                      "url": "<MEDIA_ASSET_URL>"
                    }
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```


# Parámetros

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<BUSINESS_DISPLAY_PHONE_NUMBER>` | Número de teléfono de empresa para mostrar. | `15550783881` |
| `<BUSINESS_PHONE_NUMBER_ID>` | Identificador del número de teléfono de empresa. | `106540352242922` |
| `<WHATSAPP_USER_PROFILE_NAME>` | Nombre del perfil del usuario de WhatsApp. | `Sheena Nelson` |
| `<WHATSAPP_USER_ID>` | Identificador de usuario de WhatsApp. | `16505551234` |
| `<WHATSAPP_USER_PHONE_NUMBER>` | Número de teléfono del usuario de WhatsApp. | `16505551234` |
| `<WHATSAPP_MESSAGE_ID>` | Identificador de mensaje de WhatsApp para el evento de edición. | `wamid.HBgLMTY1MDM4Nzk0MzkV...` |
| `<WEBHOOK_TRIGGER_TIMESTAMP>` | Marca de tiempo UNIX que indica cuándo se activó el webhook. | `1739321024` |
| `<ORIGINAL_WHATSAPP_MESSAGE_ID>` | Identificador del mensaje original que se está editando. | `wamid.HBgLMTQxMjU1NTA4MjkV...` |
| `<CONTEXT_ID>` | Identificador de mensaje contextual (si corresponde). | `M0` |
| `<MEDIA_ASSET_CAPTION>` | Descripción de la pieza de contenido multimedia. | `Descripción de la imagen actualizada` |
| `<MEDIA_ASSET_MIME_TYPE>` | Tipo MIME de la pieza de contenido multimedia. | `image/jpeg` |
| `<MEDIA_ASSET_SHA256_HASH>` | Hash SHA256 de la pieza de contenido multimedia. | `a1b2c3d4e5f6...` |
| `<MEDIA_ASSET_ID>` | Identificador de la pieza de contenido multimedia. | `1234567890` |
| `<MEDIA_ASSET_URL>` | URL de la pieza de contenido multimedia. | `https://media.example.com/...` |



### Ejemplo

Este webhook de ejemplo describe un cambio que ha hecho un usuario en un mensaje.

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Sheena Nelson"
                },
                "wa_id": "16505551234"
              }
            ],
            "messages": [
              {
                "from": "16505551234",
                "id": "wamid.HBgLMTY1MDM4Nzk0MzkVAgASGBQzQUFERjg0NDEzNDdFODU3MUMxMAA=",
                "timestamp": "1749854575",
                "type": "edit",
                "edit": {
                  "original_message_id": "wamid.HBgLMTQxMjU1NTA4MjkVAgASGBQzQUNCNjk5RDUwNUZGMUZEM0VBRAA=",
                  "message": {
                    "context": {
                      "id": "M0"
                    },
                    "type": "image",
                    "image": {
                      "caption": "Updated image caption",
                      "mime_type": "image/jpeg",
                      "sha256": "a1b2c3d4e5f6...",
                      "id": "1234567890",
                      "url": "https://media.example.com/updated-image.jpg"
                    }
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## Revocar

En esta referencia se describen los eventos de revocación y el contenido de la carga del webhook de mensajes de la cuenta de WhatsApp Business para las respuestas a los mensajes interactivos.

### Eventos de activación

* Un usuario de WhatsApp revoca (elimina) un mensaje previamente enviado.
* Un usuario de WhatsApp revoca un mensaje enviado anteriormente en un plazo de dos días desde su envío.

### Sintaxis

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "<BUSINESS_DISPLAY_PHONE_NUMBER>",
              "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
            },
            "contacts": [
              {
                "profile": {
                  "name": "<WHATSAPP_USER_PROFILE_NAME>"
                },
                "wa_id": "<WHATSAPP_USER_ID>"
              }
            ],
            "messages": [
              {
                "from": "<WHATSAPP_USER_PHONE_NUMBER>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<WEBHOOK_TRIGGER_TIMESTAMP>",
                "type": "revoke",
                "revoke": {
                  "original_message_id": "<ORIGINAL_WHATSAPP_MESSAGE_ID>"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## Parámetros

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<BUSINESS_DISPLAY_PHONE_NUMBER>` | Número de teléfono de empresa para mostrar. | `15550783881` |
| `<BUSINESS_PHONE_NUMBER_ID>` | Identificador del número de teléfono de empresa. | `106540352242922` |
| `<WHATSAPP_USER_PROFILE_NAME>` | Nombre del perfil del usuario de WhatsApp. | `Sheena Nelson` |
| `<WHATSAPP_USER_ID>` | Identificador de usuario de WhatsApp. | `16505551234` |
| `<WHATSAPP_USER_PHONE_NUMBER>` | Número de teléfono del usuario de WhatsApp. | `16505551234` |
| `<WHATSAPP_MESSAGE_ID>` | Identificador de mensaje de WhatsApp para el evento de revocación. | `wamid.HBgLMTY1MDM4Nzk0MzkV...` |
| `<WEBHOOK_TRIGGER_TIMESTAMP>` | Marca de tiempo UNIX que indica cuándo se activó el webhook. | `1739321024` |
| `<ORIGINAL_WHATSAPP_MESSAGE_ID>` | Identificador del mensaje original que se está revocando (eliminando). | `wamid.HBgLMTQxMjU1NTA4MjkV...` |

# Ejemplo

Este ejemplo de webhook describe la eliminación que ha hecho un usuario en un mensaje.

```json
{
 "object": "whatsapp_business_account",
 "entry": [
   {
     "id": "102290129340398",
     "changes": [
       {
         "value": {
           "messaging_product": "whatsapp",
           "metadata": {
             "display_phone_number": "15550783881",
             "phone_number_id": "106540352242922"
           },
           "contacts": [
             {
               "profile": {
                 "name": "Sheena Nelson"
               },
               "wa_id": "16505551234"
             }
           ],
           "messages": [
             {
               "from": "16505551234",
               "id": "wamid.HBgLMTY1MDM4Nzk0MzkVAgASGBQzQUFERjg0NDEzNDdFODU3MUMxMAA=",
               "timestamp": "1749854575",
               "type": "revoke",
               "revoke": {
                 "original_message_id": "wamid.HBgLMTQxMjU1NTA4MjkVAgASGBQzQUNCNjk5RDUwNUZGMUZEM0VBRAA="
               }
             }
           ]
         },
         "field": "messages"
       }
     ]
   }
 ]
}
```

# Historia

Se describe el historial de chat de la aplicación de WhatsApp Business de una empresa que ha decidido compartir su historial de chat con un socio o la decisión de la empresa de rechazar dicha opción.

## Eventos de activación

- Un socio sincroniza el historial de chat de la aplicación de WhatsApp Business de un cliente empresarial al que ha incorporado con un número de teléfono de la aplicación de WhatsApp Business y que ha accedido a compartir su historial de chat.
- Un socio sincroniza el historial de chat de la aplicación de WhatsApp Business de un cliente empresarial al que ha incorporado con un número de teléfono de la aplicación de WhatsApp Business, pero el cliente ha rechazado compartir su historial de chat.

## Contenido del historial de chat

Si la empresa ya ha aprobado el uso compartido del historial de chat cuando el socio solicita el historial de chat de la empresa, se activará una serie de webhooks de historial que describen todos los mensajes que se han enviado o recibido en los 180 días posteriores al momento en el que se incorporó la empresa a la API de nube.

- No se incluirán los mensajes que formen parte de un chat en grupo.
- Los mensajes multimedia no incluirán los identificadores de las piezas de contenido multimedia. En su lugar, se enviarán por separado webhooks adicionales del historial con los identificadores de los activos de los mensajes multimedia, pero solo para los mensajes multimedia que se envíen en un plazo de 14 días desde la incorporación.
- Con el objetivo de mejorar la eficiencia, un único webhook podría describir miles de mensajes, por lo que recomendamos capturar su contenido primero y, después, procesarlo de forma asíncrona.

## Fases y fragmentos

Los webhooks se dividen en tres fases del historial, en las que el día 0 indica el momento en el que la empresa se incorporó a la API de nube:

- **Fase 0:** del día 0 al día 1
- **Fase 1:** del día 1 al día 90
- **Fase 2:** del día 90 al día 180

Para cada fase, los webhooks de historial de chat se pueden enviar in fragmentos separados, en función del número total de mensajes que componen la conversación.

- Puedes utilizar el valor del parámetro `chunk_order` para ordenar estos fragmentos en su orden secuencial, ya que es posible que no se entreguen de forma secuencial.
- Puedes utilizar el valor del parámetro `phase` para supervisar el progreso de la fase. El valor 2 indica que la fase actual se ha completado.
- Puedes utilizar el valor del parámetro `progress` para supervisar el progreso general. Un valor de 100 indica que la sincronización se ha completado.
- Si no hay ningún historial de chat disponible para una fase determinada, no se enviarán los webhooks correspondientes.

## Sintaxis de la carga: uso compartido del historial de chat aprobado

{
 "object": "whatsapp_business_account",
 "entry": [
   {
     "id": "<WABA_ID>",
     "changes": [
       {
         "value": {
           "messaging_product": "whatsapp",
           "metadata": {
             "display_phone_number": "<BUSINESS_PHONE_NUMBER>",
             "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
           },
           "history": [
             {
               "metadata": {
                 "phase": <PHASE>,
                 "chunk_order": <CHUNK_ORDER>,
                 "progress": <PROGRESS>
               },
               "threads": [
                 /* First chat history thread object */
                 {
                   "id": "<WHATSAPP_USER_PHONE_NUMBER>",
                   "messages": [
                     /* First message object in thread */
                     {
                       "from": "<BUSINESS_OR_WHATSAPP_USER_PHONE_NUMBER>",
                       "to": "<WHATSAPP_USER_PHONE_NUMBER>", // only included if SMB message echo
                       "id": "<WHATSAPP_MESSAGE_ID>",
                       "timestamp": "<DEVICE_TIMESTAMP>,
                       "type": "<MESSAGE_TYPE>",
                       "<MESSAGE_TYPE>": {
                         <MESSAGE_CONTENTS>
                       },
                       "history_context": {
                         "status": "<MESSAGE_STATUS>"
                       }
                     },
                     /* Additional message objects in thread would follow, if any */
                   ]
                 },
                 /* Additional chat history thread objects would follow, if any */
               ]
             }
           ]
         },
         "field": "history"
       }
     ]
   }
 ]
}

# Contenido de la carga: uso compartido del historial de chat aprobado

| Marcador de posición | Descripción | Ejemplo de valor |
| :--- | :--- | :--- |
| `<WABA_ID>` | Cadena<br>Identificador de la cuenta de WhatsApp Business del cliente empresarial. | 102290129340398 |
| `<BUSINESS_PHONE_NUMBER>` | Cadena<br>Número de teléfono de empresa del cliente empresarial. | 15550783881 |
| `<BUSINESS_PHONE_NUMBER_ID>` | Cadena<br>Identificador del número de teléfono de empresa del cliente empresarial. | 106540352242922 |
| `<PHASE>` | Entero<br>Indica la fase del historial. Los valores pueden ser los siguientes:<br><br>0: indica que los mensajes son del día 0 (momento de la incorporación de la empresa) al día 1.<br>1: indica que los mensajes son del día 1 al 90.<br>2: indica que los mensajes son del día 90 al 180. | 1 |
| `<CHUNK_ORDER>` | Entero<br>Indica el número de fragmentos, que puedes utilizar para ordenar conjuntos de webhooks de forma secuencial. | 1 |
| `<PROGRESS>` | Entero<br>Indica el porcentaje total del progreso de sincronización.<br>Mínimo 0, máximo 100. | 55 |
| `<WHATSAPP_USER_PHONE_NUMBER>` | Cadena<br>Número de teléfono del usuario de WhatsApp. | 16505551234 |
| `<BUSINESS_OR_WHATSAPP_USER_PHONE_NUMBER>` | Cadena<br>Número de teléfono del cliente empresarial o del usuario de WhatsApp.<br>Si el valor es el número de teléfono de la empresa, el objeto de mensaje describe un mensaje que ha enviado la empresa a un usuario de WhatsApp.<br>Si el valor es el número de teléfono del usuario de WhatsApp, el objeto de mensaje describe un mensaje que ha enviado el usuario de WhatsApp a la empresa. | 15550783881 |
| `<WHATSAPP_USER_PHONE_NUMBER>` | Cadena<br>Número de teléfono del usuario de WhatsApp.<br>La propiedad to solo se incluye si el objeto de mensaje representa una función de eco de mensajes de protocolo Server Message Block (SMB). | 16505551234 |
| `<WHATSAPP_MESSAGE_ID>` | Cadena<br>Identificador del mensaje de WhatsApp. | wamid.HBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0N0FCNjMA |
| `<DEVICE_TIMESTAMP>` | Cadena<br>Marca de tiempo UNIX que indica el momento en el que el dispositivo del destinatario recibió el mensaje. | 1738796547 |
| `<MESSAGE_TYPE>` | Cadena<br>Tipo de mensaje. Este marcador de posición aparece dos veces en la sintaxis anterior, ya que sirve como marcador de posición para el valor de la propiedad type y el nombre de la propiedad correspondiente. Consulta la carga de ejemplo de una conversación con varios tipos de mensajes.<br>Si este valor se establece en media_placeholder, el objeto del mensaje describe un mensaje que contenía un activo multimedia. En este caso, el contenido del mensaje se omitirá. En su lugar, aparecerá un webhook de historial independiente que describe el contenido del mensaje y el identificador de la pieza de contenido multimedia, pero solo si el mensaje se envió durante las dos últimas semanas de la consulta. Consulta a continuación el ejemplo de carga en la que se describe el contenido de un mensaje multimedia. | text |
| `<MESSAGE_CONTENTS>` | Objeto<br>Objeto que describe el contenido del mensaje. Este valor variará en función del tipo de mensaje, así como de su contenido.<br>Por ejemplo, si una empresa envía un mensaje image sin texto, el objeto no incluirá la propiedad caption.<br>Consulta Enviar mensajes para ver ejemplos de cargas útiles para cada tipo de mensaje. | `{"body":"Here's the info you requested! https://www.meta.com/quest/quest-3/"}` |
| `<MESSAGE_STATUS>` | Cadena<br>Indica las estadísticas de entrega más recientes del mensaje. Los valores pueden ser los siguientes:<br><br>DELIVERED<br>ERROR<br>PENDING<br>PLAYED<br>READ<br>SENT | READ |


# Ejemplo de carga: uso compartido del historial de chat aprobado

Ejemplo de carga para dos conversaciones: (1) una conversación que contiene un mensaje de texto y un mensaje de vídeo enviados a un usuario de WhatsApp, así como la respuesta de dicho usuario y (2) un mensaje de texto enviado a un usuario de WhatsApp para darle las gracias por su pedido. No se describe el contenido del mensaje con contenido multimedia de la primera conversación. En su lugar, se activa un segundo webhook que describe el contenido del mensaje multimedia.

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "history": [
              {
                "metadata": {
                  "phase": 0,
                  "chunk_order": 1,
                  "progress": 55
                },
                "threads": [
                  {
                    "id": "16505551234",
                    "messages": [
                      {
                        "from": "15550783881",
                        "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0N0FCNjMA",
                        "timestamp": "1739230955",
                        "type": "text",
                        "text": {
                          "body": "Here's the info you requested! https://www.meta.com/quest/quest-3/"
                        },
                        "history_context": {
                          "status": "READ"
                        }
                      },
                      {
                        "from": "15550783881",
                        "id": "wamid.QyNUEHBgLMTY0NjcwNDM1OTUVAgARGBI1Rj3NEYxMzAzMzQ5MkEA",
                        "timestamp": "1739230970",
                        "type": "media_placeholder",
                        "history_context": {
                          "status": "PLAYED"
                        }
                      },
                      {
                        "from": "16505551234",
                        "id": "wamid.N0FCNjMAHBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0",
                        "timestamp": "1739230970",
                        "type": "text",
                        "text": {
                          "body": "Thanks!"
                        },
                        "history_context": {
                          "status": "READ"
                        }
                      }
                    ]
                  },
                  {
                    "id": "12125557890",
                    "messages": [
                      {
                        "from": "15550783881",
                        "id": "wamid.BIyNDlBOEI5N0FCNjMAHBgLMTY0NjcwNDM1OTUVAgARGQUQ4NDc0",
                        "timestamp": "1739230970",
                        "type": "text",
                        "text": {
                          "body": "Thanks for your order! As a thank you, use code THANKS30 to get 30% of your next order."
                        },
                        "history_context": {
                          "status": "DELIVERED"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "field": "history"
        }
      ]
    }
  ]
}
```
# Ejemplo de carga para el activo de mensaje multimedia

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "messages": [
              {
                "from": "16505551234",
                "id": "wamid.QyNUEHBgLMTY0NjcwNDM1OTUVAgARGBI1Rj3NEYxMzAzMzQ5MkEA",
                "timestamp": "1738796547",
                "type": "image",
                "image": {
                  "caption": "Black Prince echeveria",
                  "mime_type": "image/jpeg",
                  "sha256": "3f9d94d399fa61c191bc1d4ca71375a035cd9b9f5b1128e1f0963a415c16b0cc",
                  "id": "24230790383178626"
                }
              }
            ]
          },
          "field": "history"
        }
      ]
    }
  ]
}
```

# Sintaxis de la carga: uso compartido del historial de chat rechazado

```json
{
  "messaging_product": "whatsapp",
  "metadata": {
    "display_phone_number": "<BUSINESS_PHONE_NUMBER>",
    "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
  },
  "history": [
    {
      "errors": [
        {
          "code": 2593109,
          "title": "History sync is turned off by the business from the WhatsApp Business App",
          "message": "History sync is turned off by the business from the WhatsApp Business App",
          "error_data": {
            "details": "History sharing is turned off by the business"
          }
        }
      ]
    }
  ]
}
```

# smb_app_state_sync

Describe uno o varios contactos de WhatsApp en la aplicación de WhatsApp Business de un cliente empresarial.

## Eventos de activación:

* Un socio sincroniza los contactos de WhatsApp de un cliente empresarial al que ha incorporado con un número de teléfono de la aplicación de WhatsApp Business.
* Un cliente empresarial, incorporado por un socio, con un número de teléfono de la aplicación de WhatsApp Business añade, edita o suprime un contacto de WhatsApp.

## Sintaxis de la carga

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WABA_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "<BUSINESS_PHONE_NUMBER>",
              "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
            },
            "state_sync": [
              {
                "type": "contact",
                "contact": {
                  "full_name": "<CONTACT_FULL_NAME>",
                  "first_name": "<CONTACT_FIRST_NAME>",
                  "phone_number": "<CONTACT_PHONE_NUMBER>"
                },
                "action": "<ACTION>",
                "metadata": {
                  "timestamp": "<WEBHOOK_TIMESTAMP>"
                }
              }
            ]
          },
          "field": "smb_app_state_sync"
        }
      ]
    }
  ]
}
```

## Contenido de la carga


| Marcador de posición | Tipo | Descripción | Ejemplo de valor |
| :--- | :--- | :--- | :--- |
| `<WABA_ID>` | Cadena | Identificador de la cuenta de WhatsApp Business del cliente empresarial. | `102290129340398` |
| `<BUSINESS_PHONE_NUMBER>` | Cadena | Número de teléfono de empresa del cliente empresarial. | `15550783881` |
| `<BUSINESS_PHONE_NUMBER_ID>` | Cadena | Identificador del número de teléfono de empresa del cliente empresarial. | `106540352242922` |
| `<CONTACT_FULL_NAME>` | Cadena | Nombre y apellidos del contacto, tal y como aparece en la lista de contactos de la aplicación de WhatsApp Business del cliente empresarial. No se incluye cuando el cliente empresarial suprime un contacto de la lista de teléfonos de contacto de la aplicación de WhatsApp Business. | `Pablo Morales` |
| `<CONTACT_FIRST_NAME>` | Cadena | Nombre del contacto, tal y como aparece en la lista de contactos de la aplicación de WhatsApp Business del cliente empresarial. No se incluye cuando el cliente empresarial suprime un contacto de la lista de teléfonos de contacto de la aplicación de WhatsApp Business. | `Pablo` |
| `<CONTACT_PHONE_NUMBER>` | Cadena | Número de teléfono de WhatsApp del contacto. | `16505551234` |
| `<ACTION>` | Cadena | Indica si el cliente empresarial ha añadido, editado o eliminado un contacto de la lista de teléfonos de contacto de la aplicación de WhatsApp Business. Los valores pueden ser los siguientes:<br><br>• **add**: la empresa ha añadido o editado un contacto.<br>• **remove**: la empresa ha suprimido un contacto. | `add` |
| `<CONTACT_CHANGE_TIMESTAMP>` | Cadena | Marca de tiempo Unix que indica cuándo se añadió, se editó o se suprimió el contacto. | `1738346006` |


# smb_message_echoes

Describe un mensaje que ha enviado un cliente empresarial a un usuario de WhatsApp con la aplicación de WhatsApp Business o un dispositivo complementario admitido.

## Eventos de activación

Un cliente empresarial usa la aplicación de WhatsApp Business o un dispositivo complementario compatible para enviar un mensaje a un usuario de WhatsApp.

## Sintaxis de la carga

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WABA_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "<BUSINESS_PHONE_NUMBER>",
              "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
            },
            "message_echoes": [
              {
                "from": "<BUSINESS_PHONE_NUMBER>",
                "to": "<WHATSAPP_USER_PHONE_NUMBER>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<WEBHOOK_TIMESTAMP>",
                "type": "<MESSAGE_TYPE>",
                "<MESSAGE_TYPE>": {
                  <MESSAGE_CONTENTS>
                }
              }
            ]
          },
          "field": "smb_message_echoes"
        }
      ]
    }
  ]
}
```

# Contenido de la carga

| Marcador de posición | Tipo | Descripción | Ejemplo de valor |
| :--- | :--- | :--- | :--- |
| `<WABA_ID>` | Cadena | Identificador de la cuenta de WhatsApp Business del cliente empresarial. | `102290129340398` |
| `<BUSINESS_PHONE_NUMBER>` | Cadena | Número de teléfono de empresa del cliente empresarial. | `15550783881` |
| `<BUSINESS_PHONE_NUMBER_ID>` | Cadena | Identificador del número de teléfono de empresa del cliente empresarial. | `106540352242922` |
| `<WHATSAPP_USER_PHONE_NUMBER>` | Cadena | Número de teléfono del usuario de WhatsApp. | `16505551234` |
| `<WHATSAPP_MESSAGE_ID>` | Cadena | Identificador del mensaje de WhatsApp. | `wamid.HBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0N0FCNjMA` |
| `<WEBHOOK_TIMESTAMP>` | Cadena | Marca de tiempo UNIX que indica cuándo se activó el webhook. | `1738796547` |
| `<MESSAGE_TYPE>` | Cadena | Tipo de mensaje. Este marcador de posición aparece dos veces en la sintaxis anterior, ya que sirve como marcador de posición para el valor de la propiedad type y el nombre de la propiedad correspondiente. | `text` |
| `<MESSAGE_CONTENTS>` | Objeto | Objeto que describe el contenido del mensaje. Este valor variará en función del type de mensaje y de su contenido. Por ejemplo, si una empresa envía un mensaje image sin texto, el objeto no incluirá la propiedad caption. Consulta Enviar mensajes para ver ejemplos de cargas útiles para cada tipo de mensaje. | `{"body":"Here's the info you requested! https://www.meta.com/quest/quest-3/"}` |


# Ejemplo de carga

Esta ejemplo de carga describe un mensaje de texto (type es text) enviado a un usuario de WhatsApp por un cliente empresarial con la aplicación de WhatsApp Business.

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "message_echoes": [
              {
                "from": "15550783881",
                "to": "16505551234",
                "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0N0FCNjMA",
                "timestamp": "1700255121",
                "type": "text",
                "text": {
                  "body": "Here's the info you requested! https://www.meta.com/quest/quest-3/"
                }
              }
            ]
          },
          "field": "smb_message_echoes"
        }
      ]
    }
  ]
}
```

# Volver a conectar los clientes de coexistencia cancelados

Cuando un cliente incorporado mediante coexistencia cambia de dispositivo o vuelve a registrarse en la aplicación de WhatsApp Business, su aplicación complementaria de la API de nube se retira automáticamente. Cuando el cliente complete el registro en el nuevo dispositivo, verá una lista con las opciones marcadas previamente de todos los productos de la API de nube conectados anteriormente. Si no lo desactivan, la reincorporación (el proceso de restaurar la aplicación complementaria de la API de nube) se ejecutará automáticamente en segundo plano y, normalmente, se completará en unos minutos. No es necesario que tú o el cliente realicéis ninguna acción más allá de completar el registro.

## Requisitos previos

* El cliente se debe haber incorporado mediante coexistencia.
* La aplicación debe estar suscrita al campo de webhook `account_update`.
* Ningún otro socio o producto de coexistencia puede haber incorporado la cuenta de WhatsApp Business (WABA) durante el intervalo de reconexión. Si otro socio incorpora la cuenta de WhatsApp Business, WhatsApp borra los requisitos para la reincorporación.

## Cómo funciona

1. El cliente cambia de dispositivo, reinstala la aplicación de WhatsApp Business o vuelve a registrar su número de teléfono.
2. La API de nube complementaria se retira automáticamente. Recibes un webhook `ACCOUNT_OFFBOARDED`.
3. En el paso de creación del perfil del proceso de registro de WhatsApp Business, el cliente verá los productos de la API de nube que haya conectado anteriormente y que se muestran con una casilla marcada previamente.
4. Si el cliente no la desactiva, la reincorporación se llevará a cabo automáticamente en segundo plano.
5. La reincorporación se completará en cuestión de minutos. El cliente recibe una notificación en la aplicación, se restaura la aplicación complementaria de la API de nube y tú recibes un webhook `ACCOUNT_RECONNECTED`.

 Una vez que se haya restablecido la conexión, se reanudarán los mensajes mediante la API de nube y el cliente podrá seguir usando la aplicación de WhatsApp Business y tu plataforma.

## Detectar la cancelación

Cuando se cancele la incorporación de un cliente de coexistencia debido a un cambio de dispositivo o un nuevo registro, recibirás un webhook `ACCOUNT_OFFBOARDED` en el campo `account_update`.

Cuando recibas este webhook:

* Pausa los envíos de mensajes de la API de nube que este cliente tenga pendientes, ya que se producen errores mientras se lleva a cabo la reincorporación.
* Supervisa el webhook `ACCOUNT_RECONNECTED`, que suele llegar cuando el cliente completa el registro.

## carga útil del webhook ACCOUNT_OFFBOARDED

Recibirás la siguiente carga útil en la suscripción al webhook `account_update` cuando se cancele la incorporación de un cliente de coexistencia debido a un cambio de dispositivo o un nuevo registro:

```json
{
  "entry": [
    {
      "id": "<WABA_ID>",
      "time": <WEBHOOK_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_OFFBOARDED"
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

# Funciones durante la reincorporación

A continuación, se describen los estados de las funciones mientras la reincorporación está en curso.

| Función | Estado durante la reincorporación |
| :--- | :--- |
| **mensajes de la API de nube** | Suspendida: no se pueden enviar ni recibir mensajes mediante la API de nube mientras se lleva a cabo la reincorporación. |
| **Acceso de socio a una cuenta WABA** | Retenida: todavía puedes consultar la cuenta WABA mediante la API Graph. |
| **Suscripciones a webhooks de cuentas de WhatsApp Business** | Retenida: sigues recibiendo webhooks, incluido el webhook ACCOUNT_RECONNECTED, cuando se completa la reincorporación. |
| **mensajes de la aplicación de WhatsApp Business** | No está disponible durante un breve periodo de tiempo mientras se lleva a cabo el nuevo registro. Los mensajes se reanudarán una vez que se complete el nuevo registro. |
| **Historial de chat** | No se sincronizan durante la reincorporación. Dado que la reincorporación se completa en cuestión de minutos, la brecha en el historial de chat es mínima o nula. |

# Confirmar la reconexión

Recibes un webhook ACCOUNT_RECONNECTED cuando se restaura el complemento de la API de nube del cliente.
Una vez que se haya restablecido la conexión:

* Los mensajes de la API de nube se reanudan automáticamente.
* Otros dispositivos complementarios (como WhatsApp Web) no se vuelven a vincular automáticamente. El cliente debe volver a vincular manualmente los dispositivos complementarios.

## carga útil del webhook ACCOUNT_RECONNECTED

Cuando el cliente vuelva a conectarse, recibirás la siguiente carga útil en la suscripción al webhook account_update:

```json
{
  "entry": [
    {
      "id": "<WABA_ID>",
      "time": <WEBHOOK_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_RECONNECTED"
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

## Limitaciones

* Solo se restaura el complemento de la API de nube. El cliente debe volver a vincular manualmente los demás dispositivos complementarios (como WhatsApp Web).
* Es posible que los mensajes que se envíen durante el nuevo registro no se entreguen mediante la API de nube.