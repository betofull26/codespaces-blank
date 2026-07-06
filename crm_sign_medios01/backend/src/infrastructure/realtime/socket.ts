import { Server } from 'socket.io';

let io: Server | null = null;

export const initRealtime = (server: any) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });
  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error('Realtime IO not initialized');
  return io;
};
