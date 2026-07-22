export interface EventRecord {
  type: string;
  payload: Record<string, unknown>;
}

export const recordEvent = async (event: EventRecord): Promise<EventRecord> => event;
