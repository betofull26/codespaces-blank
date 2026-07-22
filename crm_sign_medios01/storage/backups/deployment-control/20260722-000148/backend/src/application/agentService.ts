import type { AgentRepository } from '../domain/repositories.js';
import type { AgentModel } from '../domain/models.js';

export const getAgents = async (agentRepository: AgentRepository): Promise<AgentModel[]> => agentRepository.list();
