import { useState } from "react";
import { useNavigate } from "react-router";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Label from "@radix-ui/react-label";
import { Eye, EyeOff, Check, Loader2, ShieldCheck, MessageSquare, LayoutDashboard } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import companyLogo from "../../imports/IMG_20260602_130639_278.jpg";
import { mockLogin, homeRouteFor, saveCurrentUser } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

/* ─── Field errors ─── */
interface FieldErrors {
  username?: string;
  password?: string;
}

function validate(username: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!username.trim()) {
    errs.username = "El nombre de usuario es obligatorio.";
  } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
    errs.username = "El nombre de usuario solo puede contener caracteres alfanuméricos.";
  }
  if (!password) {
    errs.password = "La contraseña es obligatoria.";
  } else if (password.length < 6) {
    errs.password = "La contraseña debe tener al menos 6 caracteres.";
  }
  return errs;
}

/* ─── Role detected card ──────────────────────────────
   Shown briefly after a successful login before redirect.
─────────────────────────────────────────────────────── */
function RoleDetectedCard({ user }: { user: AuthUser }) {
  const isAdmin = user.role === "admin";
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Animated icon */}
      <div className={[
        "flex h-16 w-16 items-center justify-center rounded-full shadow-lg",
        isAdmin ? "bg-blue-600" : "bg-emerald-500",
      ].join(" ")}>
        {isAdmin
          ? <LayoutDashboard size={30} className="text-white" />
          : <MessageSquare  size={30} className="text-white" />}
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
        <p className="text-xs text-slate-500">{user.title}</p>
      </div>

      {/* Redirect message */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
        <Loader2 size={13} className="animate-spin text-blue-500" />
        Redirigiendo…
      </div>
    </div>
  );
}

/* ─── SSO Button ─── */
function SSOButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.985] active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
    >
      {icon}{label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022" />
      <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00" />
      <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF" />
      <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────── */
export function LoginCard() {
  const navigate = useNavigate();
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors,       setErrors]       = useState<FieldErrors>({});
  const [loading,      setLoading]      = useState(false);
  const [serverError,  setServerError]  = useState("");
  /* Role detection step */
  const [detectedUser, setDetectedUser] = useState<AuthUser | null>(null);

  const clearFieldError = (field: keyof FieldErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const fieldErrors = validate(username, password);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await mockLogin(username, password);

      if (!result.ok) {
        if (result.error === "invalid_credentials") {
          setServerError("Nombre de usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.");
        } else {
          setServerError("Error de conexión. Inténtalo de nuevo.");
        }
        setLoading(false);
        return;
      }

      /* Persist the current user session and show role detection card for 2 seconds. */
      saveCurrentUser(result.user, rememberMe);
      setLoading(false);
      setDetectedUser(result.user);
      setTimeout(() => navigate(homeRouteFor(result.user.role)), 2000);

    } catch {
      setServerError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const handleSSO = (provider: "google" | "microsoft") => {
    console.info("SSO →", provider);
  };

  /* ── Role detected view ── */
  if (detectedUser) {
    return (
      <div className="w-full max-w-[440px]">
        <div className="rounded-2xl bg-white px-8 py-9 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100">
          <div className="mb-6 flex">
            <ImageWithFallback src={companyLogo} alt="SIGN Medios" className="h-12 w-auto object-contain" />
          </div>
          <RoleDetectedCard user={detectedUser} />
        </div>
      </div>
    );
  }

  /* ── Login form ── */
  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-2xl bg-white px-8 py-9 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <ImageWithFallback src={companyLogo} alt="SIGN Medios" className="h-14 w-auto object-contain" />
          <p className="mt-4 text-sm text-gray-500">
            Inicia sesión con tus credenciales
          </p>
        </div>

        {/* Role hint removed per request */}

        {/* Server error */}
        {serverError && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="username" className="text-sm font-semibold text-black">
              Nombre de usuario
            </Label.Root>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearFieldError("username"); }}
              placeholder="nombre de usuario"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-err" : undefined}
              className={[
                "w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400",
                "outline-none transition-all duration-150 focus:bg-white focus:ring-3",
                errors.username
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400/15"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/15",
              ].join(" ")}
            />
            {errors.username && (
              <p id="username-err" className="flex items-center gap-1 text-xs text-red-600">
                <span>•</span> {errors.username}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="password" className="text-sm font-semibold text-black">
              Contraseña
            </Label.Root>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                placeholder="Introduce tu contraseña..."
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "pw-err" : undefined}
                className={[
                  "w-full rounded-xl border bg-gray-50 py-2.5 pl-3.5 pr-10 text-sm text-black placeholder:text-gray-400",
                  "outline-none transition-all duration-150 focus:bg-white focus:ring-3",
                  errors.password
                    ? "border-red-400 focus:border-red-500 focus:ring-red-400/15"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/15",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p id="pw-err" className="flex items-center gap-1 text-xs text-red-600">
                <span>•</span> {errors.password}
              </p>
            )}
          </div>

          {/* Remember me + forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2.5">
              <Checkbox.Root
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                className={[
                  "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:ring-offset-1",
                  rememberMe ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white hover:border-gray-400",
                ].join(" ")}
              >
                <Checkbox.Indicator>
                  <Check size={11} strokeWidth={3} className="text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <Label.Root htmlFor="remember" className="cursor-pointer select-none text-sm text-gray-600">
                Acuérdate de mí
              </Label.Root>
            </div>
            {/* Forgot password removed per request */}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" />Verificando…</> : "Iniciar sesión"}
          </button>

          {/* SSO removed per request */}
        </form>

        {/* Credentials hint — dev helper */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Credenciales de prueba</p>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={10} className="shrink-0 text-blue-500" />
              <span className="font-medium">Admin:</span>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] border border-slate-200">supervisor</code>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] border border-slate-200">admin2026</code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-5 text-center text-sm text-gray-400">
        ¿Problemas para acceder?{" "}
        <button
          type="button"
          className="cursor-pointer font-bold text-blue-600 underline-offset-2 transition-all duration-200 hover:text-blue-700 hover:underline focus:outline-none"
        >
          Contacta con soporte
        </button>
      </p>
    </div>
  );
}
