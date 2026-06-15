import type { Agent } from "./AgentCard";

// Mock reducido a dos usuarios para pruebas
export const agentsData: Agent[] = [
	{
		id: "1",
		name: "Carlos Mendoza",
		role: "Agente Senior",
		phone: "+58 412-555-0101",
		avatar: "",
		initials: "CM",
		online: true, // conectado
		conversations: [],
	},
	{
		id: "2",
		name: "María Torres",
		role: "Agente de Soporte",
		phone: "+58 424-555-0102",
		avatar: "",
		initials: "MT",
		online: false, // desconectado
		conversations: [],
	},
];
