import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { agentsData } from './src/app/components/dashboard/agentsData'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function mockDashboardApi() {
  let agents = JSON.parse(JSON.stringify(agentsData));

  const normalizeConversation = (conversation, agentId) => ({
    ...conversation,
    agentId: conversation.agentId ?? agentId,
    messages: (conversation.messages ?? []).map((message) => ({
      ...message,
      conversationId: message.conversationId ?? conversation.id,
    })),
  });

  const findConversation = (conversationId) => {
    for (const agent of agents) {
      const conv = agent.conversations?.find((c) => c.id === conversationId);
      if (conv) return conv;
    }
    return null;
  };

  const parseBody = async (req) => {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    try {
      return body ? JSON.parse(body) : {};
    } catch {
      return {};
    }
  };

  return {
    name: 'mock-dashboard-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const { pathname } = url;
        const method = req.method?.toUpperCase();

        const writeJson = (status, data) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        if (method === 'GET' && pathname === '/api/agents') {
          return writeJson(200, agents.map((agent) => ({
            ...agent,
            conversations: (agent.conversations ?? []).map((conversation) => normalizeConversation(conversation, agent.id)),
          })));
        }

        const agentConvMatch = pathname.match(/^\/api\/agents\/([^/]+)\/conversations$/);
        if (method === 'GET' && agentConvMatch) {
          const agentId = decodeURIComponent(agentConvMatch[1]);
          const agent = agents.find((item) => item.id === agentId);
          if (!agent) {
            return writeJson(404, { error: 'Agente no encontrado' });
          }
          return writeJson(200, (agent.conversations ?? []).map((conversation) => normalizeConversation(conversation, agent.id)));
        }

        const convMessagesMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
        if (method === 'GET' && convMessagesMatch) {
          const conversationId = decodeURIComponent(convMessagesMatch[1]);
          const conversation = findConversation(conversationId);
          if (!conversation) {
            return writeJson(404, { error: 'Conversación no encontrada' });
          }
          return writeJson(200, (conversation.messages ?? []).map((message) => ({
            ...message,
            conversationId: message.conversationId ?? conversation.id,
          })));
        }

        const convStatusMatch = pathname.match(/^\/api\/conversations\/([^/]+)$/);
        if (method === 'PATCH' && convStatusMatch) {
          const conversationId = decodeURIComponent(convStatusMatch[1]);
          const payload = await parseBody(req);
          const conversation = findConversation(conversationId);
          if (!conversation) {
            return writeJson(404, { error: 'Conversación no encontrada' });
          }
          conversation.status = payload.status || conversation.status;
          return writeJson(200, normalizeConversation(conversation, conversation.agentId ?? ''));
        }

        const convInterventionMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/interventions$/);
        if (method === 'POST' && convInterventionMatch) {
          const conversationId = decodeURIComponent(convInterventionMatch[1]);
          const payload = await parseBody(req);
          const conversation = findConversation(conversationId);
          if (!conversation) {
            return writeJson(404, { error: 'Conversación no encontrada' });
          }
          const msg = {
            id: `sv-${Date.now()}`,
            conversationId: conversation.id,
            sender: payload.sender || 'supervisor',
            text: payload.text || '',
            time: payload.time || new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
            source: 'dashboard',
          };
          conversation.messages = conversation.messages ?? [];
          conversation.messages.push(msg);
          return writeJson(201, msg);
        }

        if (method === 'POST' && pathname === '/api/whatsapp/webhook') {
          await parseBody(req);
          return writeJson(200, { success: true });
        }

        return next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    mockDashboardApi(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
