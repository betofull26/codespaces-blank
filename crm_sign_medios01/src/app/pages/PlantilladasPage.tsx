import { useEffect, useState } from "react";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { Sidebar } from "../components/dashboard/Sidebar";

interface TemplateItem {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

const STORAGE_KEY = "crm-sign-templates";

export function PlantilladasPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch {
      // ignore invalid storage
    }
  }, []);

  const saveTemplate = () => {
    if (!templateName.trim() || !templateBody.trim()) {
      return;
    }

    const nextTemplate: TemplateItem = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      body: templateBody.trim(),
      createdAt: new Date().toLocaleString("es-VE"),
    };

    const nextTemplates = [nextTemplate, ...templates];
    setTemplates(nextTemplates);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTemplates));
    setTemplateName("");
    setTemplateBody("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar selectedNode="plantilladas" onSelectNode={() => {}} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-800">Plantillas</h1>
            <p className="mt-2 text-sm text-slate-600">
              Crea y visualiza modelos de mensajes predefinidos para supervisión y respuesta rápida.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800">Nueva plantilla</h2>
              <div className="mt-4 space-y-3">
                <input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="Nombre de la plantilla"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
                <textarea
                  value={templateBody}
                  onChange={(event) => setTemplateBody(event.target.value)}
                  placeholder="Texto del mensaje"
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={saveTemplate}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Crear plantilla
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800">Plantillas guardadas</h2>
              <div className="mt-4 space-y-3">
                {templates.length === 0 ? (
                  <p className="text-sm text-slate-500">Aún no hay plantillas creadas.</p>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{template.name}</p>
                        <span className="text-xs text-slate-500">{template.createdAt}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{template.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
