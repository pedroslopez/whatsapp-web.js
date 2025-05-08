export interface PresenceUpdate {
  jid: string;
  isOnline: boolean;
  lastSeen: number;
}

// Add these to the Client interface
subscribePresence(jid: string, pollInterval?: number): Promise<void>;
getPresence(jid: string): Promise<PresenceUpdate | null>;
on(event: 'presence_update', listener: (p: PresenceUpdate) => void): this;
