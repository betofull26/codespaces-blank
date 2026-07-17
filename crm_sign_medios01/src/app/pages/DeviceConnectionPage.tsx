import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";

export function DeviceConnectionPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="conexion-dispositivo" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800">Conexión de dispositivo</h1>
            <p className="mt-2 text-sm text-slate-600">
              Aquí podrás gestionar la conexión de dispositivos para la plataforma.
            </p>
            <div
              className="mt-6"
              dangerouslySetInnerHTML={{
                __html: `<!-- SDK loading -->
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script><script>
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
</script><!-- Launch button  --><button onclick="launchWhatsAppSignup()" style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;">Login with Facebook</button>`,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
