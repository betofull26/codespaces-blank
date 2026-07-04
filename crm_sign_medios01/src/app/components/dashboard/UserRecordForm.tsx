import { useRef, useState } from "react";
import { Camera, Upload, X, Eye, EyeOff } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import type { UserRecord, UserRole } from "./UserRecordManagement";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

interface UserRecordFormProps {
  initialData?: UserRecord;
  onSubmit: (data: Omit<UserRecord, "id">) => void;
  onCancel: () => void;
}

export function UserRecordForm({ initialData, onSubmit, onCancel }: UserRecordFormProps) {
  const { firstName: initialFirstName, lastName: initialLastName } = splitName(initialData?.name || "");

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    position: initialData?.position || "",
    assignedPhone: initialData?.assignedPhone || "",
    deviceModel: initialData?.deviceModel || "",
    serialNumber: initialData?.serialNumber || "",
    serialNumber2: initialData?.serialNumber2 || "",
    photo: initialData?.photo || "",
    entryDate: initialData?.entryDate || "",
    username: initialData?.username || "",
    password: initialData?.password || "",
    role: initialData?.role || ("Agente" as UserRole),
  });

  const [photoPreview, setPhotoPreview] = useState<string | undefined>(initialData?.photo);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const errors: string[] = [];
    if (!formData.firstName.trim()) errors.push("El nombre es requerido");
    if (!formData.lastName.trim()) errors.push("Los apellidos son requeridos");
    if (!formData.position.trim()) errors.push("El cargo/email es requerido");
    if (!formData.username.trim()) errors.push("El usuario es requerido");
    if (!formData.password.trim()) errors.push("La contraseña es requerida");
    if (!formData.entryDate) errors.push("La fecha de ingreso es requerida");
    if (!formData.serialNumber.trim()) errors.push("El número de serie 1 es requerido");
    
    if (errors.length > 0) {
      alert("Por favor completa los campos requeridos:\n" + errors.join("\n"));
      return;
    }
    
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      position: formData.position,
      assignedPhone: formData.assignedPhone,
      deviceModel: formData.deviceModel,
      serialNumber: formData.serialNumber,
      serialNumber2: formData.serialNumber2,
      photo: formData.photo,
      entryDate: formData.entryDate,
      username: formData.username,
      password: formData.password,
      role: formData.role,
    };
    onSubmit(payload);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData((prev) => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(undefined);
    setFormData((prev) => ({ ...prev, photo: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label.Root className="text-sm font-semibold text-black">Foto de Perfil</Label.Root>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-lg transition-colors hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <Camera size={32} className="text-slate-400" />
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50">
              <Upload size={16} />
              Subir Imagen
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <Label.Root htmlFor="firstName" className="text-sm font-semibold text-black">Nombre</Label.Root>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="María"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="lastName" className="text-sm font-semibold text-black">Apellidos</Label.Root>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="González Pérez"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root className="text-sm font-semibold text-black">Cargo</Label.Root>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            placeholder="Ejecutivo de Ventas"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="entryDate" className="text-sm font-semibold text-black">Fecha de Ingreso</Label.Root>
          <input
            id="entryDate"
            type="date"
            value={formData.entryDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, entryDate: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="assignedPhone" className="text-sm font-semibold text-black">Teléfono Asignado</Label.Root>
          <input
            id="assignedPhone"
            type="tel"
            value={formData.assignedPhone}
            onChange={(e) => setFormData((prev) => ({ ...prev, assignedPhone: e.target.value }))}
            placeholder="+58 412-1234567"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="deviceModel" className="text-sm font-semibold text-black">Modelo de Dispositivo</Label.Root>
          <input
            id="deviceModel"
            type="text"
            value={formData.deviceModel}
            onChange={(e) => setFormData((prev) => ({ ...prev, deviceModel: e.target.value }))}
            placeholder="iPhone 14 Pro"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="username" className="text-sm font-semibold text-black">Usuario</Label.Root>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="usuario01"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="password" className="text-sm font-semibold text-black">Contraseña</Label.Root>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-10 text-sm text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <Label.Root htmlFor="serialNumber" className="text-sm font-semibold text-black">Número de Serie 1</Label.Root>
          <input
            id="serialNumber"
            type="text"
            value={formData.serialNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value.toUpperCase() }))}
            placeholder="F2KXH9MNPQ3L"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm font-semibold text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="serialNumber2" className="text-sm font-semibold text-black">Número de Serie 2</Label.Root>
          <input
            id="serialNumber2"
            type="text"
            value={formData.serialNumber2}
            onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber2: e.target.value.toUpperCase() }))}
            placeholder="SN-002-01"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm font-semibold text-black placeholder:text-gray-400 outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          />
        </div>

        <div>
          <Label.Root htmlFor="role" className="text-sm font-semibold text-black">Rol</Label.Root>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as UserRole }))}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-black outline-none transition-all duration-150 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
          >
            <option value="Administrador">Administrador</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Agente">Agente</option>
            <option value="Suspendido">Suspendido</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.985]">
          {initialData ? "Guardar Cambios" : "Crear Ficha"}
        </button>
      </div>
    </form>
  );
}
