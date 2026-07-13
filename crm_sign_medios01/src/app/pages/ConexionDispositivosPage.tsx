import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";
import { getCurrentUser } from "../lib/auth";
import { exchangeWhatsAppSignupCode } from "../services/dashboardApi";

// Global augmentation for the Facebook SDK objects used by the embedded signup flow.
declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: Record<string, unknown>) => void;
      login: (callback: (response: any) => void, options?: Record<string, unknown>) => void;
    };
  }
}

// Environment variables exposed to the frontend for Facebook / WhatsApp signup.
// These must be defined in Vite env variables, never include APP_SECRET here.
const WHATSAPP_SIGNUP_APP_ID = import.meta.env.VITE_WHATSAPP_SIGNUP_APP_ID ?? "";
const WHATSAPP_SIGNUP_CONFIG_ID = import.meta.env.VITE_WHATSAPP_SIGNUP_CONFIG_ID ?? "";
const WHATSAPP_SIGNUP_SDK_VERSION = import.meta.env.VITE_WHATSAPP_SDK_VERSION ?? "v16.0";
const WHATSAPP_SIGNUP_SDK_URL = "https://connect.facebook.net/en_US/sdk.js";

type SignupState = "idle" | "loading" | "success" | "error" | "cancelled";

export function ConexionDispositivosPage() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";

  const navigate = useNavigate();
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [signupState, setSignupState] = useState<SignupState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Preparando el flujo de registro insertado de WhatsApp Business...",
  );

  // Sends the temporary signup code received from Facebook to the backend.
  // The backend is responsible for exchanging it for a persistent token / WABA onboarding data.
  const exchangeCode = useCallback(async (code: string) => {
    setSignupState("loading");
    setStatusMessage("Enviando el código de registro al backend...");

    try {
      await exchangeWhatsAppSignupCode(code);
      setSignupState("success");
      setStatusMessage(
        "Código recibido correctamente. El onboarding de WhatsApp se ha iniciado en el backend.",
      );
      navigate("/dashboard");
    } catch (error) {
      setSignupState("error");
      setStatusMessage(
        error instanceof Error
          ? `No se pudo enviar el código: ${error.message}`
          : "Error desconocido al enviar el código de registro.",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Load and initialize the Facebook JavaScript SDK needed for embedded signup.
    const initSdk = () => {
      if (!WHATSAPP_SIGNUP_APP_ID) {
        setSdkLoaded(false);
        setSignupState("error");
        setStatusMessage("Falta VITE_WHATSAPP_SIGNUP_APP_ID en el entorno.");
        return;
      }

      const initialize = () => {
        if (!window.FB) return;
        window.FB.init({
          appId: WHATSAPP_SIGNUP_APP_ID,
          autoLogAppEvents: false,
          xfbml: false,
          version: WHATSAPP_SIGNUP_SDK_VERSION,
        });
        if (!cancelled) {
          setSdkLoaded(true);
          setStatusMessage("SDK de Facebook cargado. Listo para iniciar el registro.");
        }
      };

      window.fbAsyncInit = initialize;

      if (window.FB) {
        initialize();
        return;
      }

      if (document.getElementById("facebook-jssdk")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = WHATSAPP_SIGNUP_SDK_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.FB) return;
        initialize();
      };
      script.onerror = () => {
        if (!cancelled) {
          setSdkLoaded(false);
          setSignupState("error");
          setStatusMessage("No se pudo cargar el SDK de Facebook. Comprueba la conexión de red.");
        }
      };
      document.body.appendChild(script);
    };

    initSdk();

    // Listen for WA_EMBEDDED_SIGNUP events sent by the Facebook/Meta embedded signup iframe.
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) {
        return;
      }

      let data: Record<string, unknown> | null = null;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : (event.data as Record<string, unknown>);
      } catch {
        data = event.data as Record<string, unknown> | null;
      }

      if (!data || data.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      const code = typeof data.code === "string" ? data.code : undefined;
      if (code) {
        exchangeCode(code);
        return;
      }

      setSignupState("error");
      setStatusMessage("Se recibió un evento de registro, pero no contenía un código válido.");
    };

    window.addEventListener("message", handleMessage);

    return () => {
      cancelled = true;
      window.removeEventListener("message", handleMessage);
    };
  }, [exchangeCode]);

  // Starts the embedded WhatsApp signup flow by calling FB.login with the config_id.
  // This is the same initiation pattern described in the Meta embedded signup docs.
  const handleStartEmbeddedSignup = async () => {
    if (!WHATSAPP_SIGNUP_APP_ID || !WHATSAPP_SIGNUP_CONFIG_ID) {
      setSignupState("error");
      setStatusMessage("Falta la configuración necesaria para iniciar el registro insertado.");
      return;
    }

    if (!sdkLoaded || !window.FB) {
      setSignupState("error");
      setStatusMessage("El SDK no está listo aún. Espera unos segundos e inténtalo de nuevo.");
      return;
    }

    setSignupState("loading");
    setStatusMessage("Abriendo el flujo de registro insertado de WhatsApp...");

    try {
      window.FB.login(
        (response: any) => {
          const code = response?.authResponse?.code;
          if (typeof code === "string" && code.trim()) {
            exchangeCode(code.trim());
            return;
          }

          if (response?.status === "not_authorized" || response?.status === "unknown") {
            setSignupState("cancelled");
            setStatusMessage("Registro cancelado por el usuario.");
            return;
          }

          setSignupState("error");
          setStatusMessage(
            "No se recibió el código de registro. Es posible que el flujo haya cambiado o que el usuario haya cancelado.",
          );
        },
        {
          scope: "whatsapp_business_management",
          auth_type: "rerequest",
          config_id: WHATSAPP_SIGNUP_CONFIG_ID,
        },
      );
    } catch (error) {
      setSignupState("error");
      setStatusMessage(
        error instanceof Error
          ? `Error al iniciar el flujo de registro: ${error.message}`
          : "Error desconocido al iniciar el flujo de registro.",
      );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="conexion-dispositivos" onSelectNode={() => {}} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {!isAdmin && !isSupervisor ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600" size={24} />
                <div>
                  <h1 className="text-xl font-semibold text-red-800">Acceso Restringido</h1>
                  <p className="mt-2 text-sm text-red-700">
                    Solo los administradores tienen permiso para conectar dispositivos.
                  </p>
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-slate-800">Conexión de Dispositivos</h1>
                  <p className="mt-4 text-sm text-slate-600">
                    Inicia el registro insertado de WhatsApp Business para conectar una cuenta WABA al sistema.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {sdkLoaded ? "SDK listo para usar" : "Cargando SDK de Facebook..."}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    El flujo de registro insertado permite completar el onboarding de WhatsApp Business directamente desde
                    esta pantalla.
                  </p>
                  <p>Después de recibir el código, el backend debe intercambiarlo por credenciales y comenzar el onboarding.</p>
                </div>

                <button
                  type="button"
                  disabled={signupState === "loading" || !sdkLoaded}
                  onClick={handleStartEmbeddedSignup}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {signupState === "loading" ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    "Iniciar registro insertado"
                  )}
                </button>
              </div>

              {statusMessage ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {statusMessage}
                </div>
              ) : null}

              {signupState === "success" ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <div>
                    <p className="font-semibold">Registro recibido</p>
                    <p>El backend ya recibió el código y puede continuar con el intercambio.</p>
                  </div>
                </div>
              ) : null}

              {signupState === "error" ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <AlertTriangle size={20} className="shrink-0" />
                  <div>
                    <p className="font-semibold">Ocurrió un error</p>
                    <p>{statusMessage}</p>
                  </div>
                </div>
              ) : null}

              {signupState === "cancelled" ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <p className="font-semibold">Registro cancelado</p>
                    <p>El proceso fue cancelado por el usuario o no se completó el flujo.</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-600" size={24} />
                <div>
                  <h1 className="text-xl font-semibold text-amber-800">Acceso Restringido</h1>
                  <p className="mt-2 text-sm text-amber-700">
                    Los supervisores pueden ver esta sección, pero no tienen permisos para ejecutar acciones de conexión de dispositivos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
