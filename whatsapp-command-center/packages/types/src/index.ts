/**
 * @repo/types
 *
 * Shared TypeScript types across the monorepo
 */

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// AI Types
// ============================================================================

export type AiProviderType = 'openai' | 'anthropic' | 'gemini' | 'custom';

export interface AiConfig {
  provider: AiProviderType;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiEndpoint?: string; // For custom providers
}

export interface AiRequest {
  prompt: string;
  context?: string[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AiResponse {
  text: string;
  provider: AiProviderType;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  latency?: number;
}

export interface AiStreamChunk {
  text: string;
  done: boolean;
}

// ============================================================================
// WhatsApp Types
// ============================================================================

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: 'chat' | 'image' | 'video' | 'audio' | 'document';
  hasMedia: boolean;
  isForwarded: boolean;
  fromMe: boolean;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  pushname: string;
  number: string;
  isGroup: boolean;
  isBusiness: boolean;
  profilePicUrl?: string;
}

export type SessionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'authenticated'
  | 'ready'
  | 'failed';

// ============================================================================
// Automation Types
// ============================================================================

export type TriggerType =
  | 'keyword'
  | 'new_message'
  | 'new_contact'
  | 'schedule'
  | 'webhook';

export type ActionType =
  | 'send_message'
  | 'assign_conversation'
  | 'add_tag'
  | 'create_contact'
  | 'call_webhook'
  | 'delay'
  | 'ai_response';

export interface AutomationTrigger {
  type: TriggerType;
  config: Record<string, any>;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: any;
}

// ============================================================================
// Broadcast Types
// ============================================================================

export interface BroadcastRecipient {
  contactId: string;
  variables?: Record<string, string>; // For template variables
}

export interface BroadcastStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface MetricData {
  label: string;
  value: number;
  change?: number; // Percentage change from previous period
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

// ============================================================================
// Webhook Types
// ============================================================================

export type WebhookEvent =
  | 'message.received'
  | 'message.sent'
  | 'conversation.created'
  | 'conversation.closed'
  | 'contact.created'
  | 'contact.updated';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  organizationId: string;
}

export interface WebhookDeliveryAttempt {
  attempt: number;
  timestamp: string;
  statusCode?: number;
  response?: any;
  error?: string;
}
