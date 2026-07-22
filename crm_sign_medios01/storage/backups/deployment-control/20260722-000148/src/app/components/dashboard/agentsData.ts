import type { Agent } from "./types";

export const agentsData: Agent[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    role: "Agente Senior",
    phone: "+58 412-555-0101",
    avatar: "",
    initials: "CM",
    online: true,
    conversations: [
      {
        id: "conv-1",
        agentId: "1",
        clientName: "Ana Pérez",
        topic: "Solicitud de presupuesto",
        status: "active",
        startTime: "09:18",
        messages: [
          { id: "msg-1", sender: "client", text: "Hola, necesito información sobre el servicio.", time: "09:19", source: "whatsapp", externalMessageId: "wa-123" },
          { id: "msg-2", sender: "agent", text: "Buenos días, con gusto le explico los paquetes disponibles.", time: "09:20", source: "dashboard" },
        ],
      },
      {
        id: "conv-2",
        agentId: "1",
        clientName: "Luis Ramírez",
        topic: "Reclamo de facturación",
        status: "waiting",
        startTime: "08:45",
        messages: [
          { id: "msg-3", sender: "client", text: "No entiendo un cargo en mi factura.", time: "08:45" },
          { id: "msg-4", sender: "agent", text: "Reviso su caso y le envío la información en minutos.", time: "08:46" },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "María Torres",
    role: "Agente de Soporte",
    phone: "+58 424-555-0102",
    avatar: "",
    initials: "MT",
    online: false,
    conversations: [
      {
        id: "conv-3",
        agentId: "2",
        clientName: "Juan Castillo",
        topic: "Configuración de cuenta",
        status: "closed",
        startTime: "07:10",
        messages: [
          { id: "msg-5", sender: "client", text: "¿Cómo activo mi notificación por SMS?", time: "07:11" },
          { id: "msg-6", sender: "agent", text: "Le indico paso a paso en el panel de usuario.", time: "07:12" },
        ],
      },
    ],
  },
];
