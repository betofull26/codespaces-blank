import { useState } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Label from "@radix-ui/react-label";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";

interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FieldError {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldError {
  const errors: FieldError = {};
  if (!email) errors.email = "El correo electrónico es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Introduce un correo electrónico válido.";
  if (!password) errors.password = "La contraseña es obligatoria.";
  else if (password.length < 6)
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  return errors;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const fieldErrors = validate(email, password);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const payload: LoginPayload = { email, password, rememberMe };
      // Replace with real endpoint: await fetch("/api/auth/login", { method: "POST", body: JSON.stringify(payload) })
      console.log("Auth payload →", payload);
      await new Promise((r) => setTimeout(r, 1200)); // simulated latency
    } catch {
      setServerError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = (provider: "google" | "microsoft") => {
    // Replace with real OAuth redirect: window.location.href = `/api/auth/${provider}`
    console.log("SSO provider →", provider);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Server error banner */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label.Root
          htmlFor="email"
          className="text-sm font-medium text-gray-700"
        >
          Correo electrónico
        </Label.Root>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="john.doe@gmail.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={[
            "w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
            "outline-none transition-all duration-150",
            "focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/15",
            errors.email
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-gray-200",
          ].join(" ")}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label.Root
          htmlFor="password"
          className="text-sm font-medium text-gray-700"
        >
          Contraseña
        </Label.Root>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Introduce tu contraseña..."
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={[
              "w-full rounded-xl border bg-gray-50 py-2.5 pl-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400",
              "outline-none transition-all duration-150",
              "focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/15",
              errors.password
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                : "border-gray-200",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600">
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Checkbox.Root
            id="remember"
            checked={rememberMe}
            onCheckedChange={(val) => setRememberMe(val === true)}
            className={[
              "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1",
              rememberMe
                ? "border-blue-600 bg-blue-600"
                : "border-gray-300 bg-white hover:border-gray-400",
            ].join(" ")}
          >
            <Checkbox.Indicator>
              <Check size={11} strokeWidth={3} className="text-white" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <Label.Root
            htmlFor="remember"
            className="cursor-pointer select-none text-sm text-gray-600"
          >
            Acuérdate de mí
          </Label.Root>
        </div>

        {/* Forgot password removed per request */}
      </div>

      {/* Primary button */}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-150 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Verificando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>

      {/* Divider */}
      {/* SSO removed per request */}
    </form>
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
