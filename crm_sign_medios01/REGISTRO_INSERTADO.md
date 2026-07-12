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

### Carga del SDK
La siguiente etiqueta de script carga el SDK de Facebook para JavaScript de forma asíncrona:
```html
<!-- SDK loading -->
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>
```

### Inicialización del SDK
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

### Sustituye los siguientes marcadores de posición por tus propios valores.

| Marcador de posición | Descripción | Ejemplo de valor |
| --- | --- | --- |
| `<APP_ID>` | **Obligatorio.**<br>Identificador de tu aplicación. Se muestra en la parte superior del panel de aplicaciones. | `21202248997039` |
| `<GRAPH_API_VERSION>` | **Obligatorio.**<br>Versión de la API Graph. Indica a qué versión de la API Graph se debe llamar si te basas en los métodos del SDK para realizar llamadas a la API.<br><br>En el contexto del registro insertado, no dependerás de los métodos del SDK para realizar llamadas a la API. Establécelo en la última versión de la API:<br><br>`v25.0` | `v25.0` |
