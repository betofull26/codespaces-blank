import { useState } from "react";
import * as Label from "@radix-ui/react-label";
import type { ClientContact } from "./DirectorioManagement";

interface DirectorioFormProps {
  initialData?: ClientContact;
  onSubmit: (data: Omit<ClientContact, "id">) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

export function DirectorioForm({ initialData, onSubmit, onCancel }: DirectorioFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <Label.Root htmlFor="name" className="text-sm font-semibold text-black">
            Nombre Completo *
          </Label.Root>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }));
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="María González Pérez"
            className={[
              "mt-1.5 w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400",
              "outline-none transition-all duration-150 focus:bg-white focus:ring-3",
              errors.name
                ? "border-red-400 focus:border-red-500 focus:ring-red-400/15"
                : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/15",
            ].join(" ")}
          />
          {errors.name && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <span>•</span> {errors.name}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label.Root htmlFor="phone" className="text-sm font-semibold text-black">
            Número Telefónico *
          </Label.Root>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, phone: e.target.value }));
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            placeholder="+52 55 1234 5678"
            className={[
              "mt-1.5 w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400",
              "outline-none transition-all duration-150 focus:bg-white focus:ring-3",
              errors.phone
                ? "border-red-400 focus:border-red-500 focus:ring-red-400/15"
                : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/15",
            ].join(" ")}
          />
          {errors.phone && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <span>•</span> {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.985]"
        >
          {initialData ? "Guardar Cambios" : "Crear Contacto"}
        </button>
      </div>
    </form>
  );
}
