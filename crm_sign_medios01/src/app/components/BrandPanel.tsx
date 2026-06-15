import { ShieldCheck, Zap, Lock } from "lucide-react";

const features = [
  { icon: Lock, label: "Conexión cifrada SSL/TLS" },
  { icon: ShieldCheck, label: "Autenticación multi-factor" },
  { icon: Zap, label: "Acceso rápido y seguro" },
];

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12"
      style={{ background: "linear-gradient(150deg, #1a3a8f 0%, #4169E1 55%, #6b8ff0 100%)" }}
    >
      {/* Decorative blobs */}
      <span className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-[2px]" />
      <span className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-[2px]" />
      <span className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/5" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <CompanyLogoPlaceholder />
        </div>
        <span className="text-[1.05rem] font-bold tracking-tight text-white">
          MiEmpresa
        </span>
      </div>

      {/* Center copy */}
      <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 py-10">
        <div>
          <h2 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-white">
            Bienvenido<br />de vuelta
          </h2>
          <p className="max-w-xs text-[0.9375rem] leading-relaxed text-white/70">
            Accede a tu cuenta para continuar gestionando tu plataforma de forma segura y eficiente.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {features.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <Icon size={17} className="shrink-0 text-white/80" />
              <span className="text-sm font-medium text-white/90">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-xs text-white/40">
        © 2026 MiEmpresa. Todos los derechos reservados.
      </p>
    </div>
  );
}

function CompanyLogoPlaceholder() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-label="Logo de empresa">
      <rect x="2" y="2" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
      <rect x="12" y="2" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="2" y="12" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="12" y="12" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
