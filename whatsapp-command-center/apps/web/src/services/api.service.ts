import apiClient from '@/lib/api-client';

export const organizationService = {
  async getCurrent() {
    const response = await apiClient.get('/organizations/current');
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/organizations/stats');
    return response.data;
  },

  async update(data: any) {
    const response = await apiClient.patch('/organizations/current', data);
    return response.data;
  },
};

export const contactsService = {
  async getAll(params?: { search?: string; tagId?: string }) {
    const response = await apiClient.get('/contacts', { params });
    return response.data;
  },

  async getOne(id: string) {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/contacts/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/contacts/stats');
    return response.data;
  },
};

export const conversationsService = {
  async getAll(params?: { status?: string; assignedTo?: string; search?: string }) {
    const response = await apiClient.get('/conversations', { params });
    return response.data;
  },

  async getOne(id: string) {
    const response = await apiClient.get(`/conversations/${id}`);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/conversations/${id}`, data);
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await apiClient.post(`/conversations/${id}/mark-read`);
    return response.data;
  },

  async assign(id: string, userId: string) {
    const response = await apiClient.post(`/conversations/${id}/assign`, { userId });
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/conversations/stats');
    return response.data;
  },
};

export const messagesService = {
  async getByConversation(conversationId: string, params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get(`/messages/conversation/${conversationId}`, { params });
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/messages/stats');
    return response.data;
  },
};

export const whatsappService = {
  async createSession(data: { name: string }) {
    const response = await apiClient.post('/whatsapp/sessions', data);
    return response.data;
  },

  async getAllSessions() {
    const response = await apiClient.get('/whatsapp/sessions');
    return response.data;
  },

  async getSession(id: string) {
    const response = await apiClient.get(`/whatsapp/sessions/${id}`);
    return response.data;
  },

  async deleteSession(id: string) {
    const response = await apiClient.delete(`/whatsapp/sessions/${id}`);
    return response.data;
  },

  async sendMessage(sessionId: string, data: { to: string; message: string }) {
    const response = await apiClient.post(`/whatsapp/sessions/${sessionId}/send`, data);
    return response.data;
  },

  async sendMedia(sessionId: string, formData: FormData) {
    const response = await apiClient.post(`/whatsapp/sessions/${sessionId}/send-media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async initSession(data: { name: string }) {
    const response = await apiClient.post('/whatsapp/sessions', data);
    return response.data;
  },

  async getSession(id: string) {
    const response = await apiClient.get(`/whatsapp/sessions/${id}`);
    return response.data;
  },

  async deleteSession(id: string) {
    const response = await apiClient.delete(`/whatsapp/sessions/${id}`);
    return response.data;
  },
};

export const automationsService = {
  async getAll() {
    const response = await apiClient.get('/automations');
    return response.data;
  },

  async getOne(id: string) {
    const response = await apiClient.get(`/automations/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/automations', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/automations/${id}`, data);
    return response.data;
  },

  async toggle(id: string) {
    const response = await apiClient.post(`/automations/${id}/toggle`);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/automations/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/automations/stats');
    return response.data;
  },
};

export const broadcastsService = {
  async getAll() {
    const response = await apiClient.get('/broadcasts');
    return response.data;
  },

  async getOne(id: string) {
    const response = await apiClient.get(`/broadcasts/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/broadcasts', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/broadcasts/${id}`, data);
    return response.data;
  },

  async send(id: string) {
    const response = await apiClient.post(`/broadcasts/${id}/send`);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/broadcasts/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/broadcasts/stats');
    return response.data;
  },
};

export const analyticsService = {
  async getOverview() {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },

  async getMessageVolume(days: number = 30) {
    const response = await apiClient.get('/analytics/message-volume', { params: { days } });
    return response.data;
  },

  async getTopAutomations(limit: number = 5) {
    const response = await apiClient.get('/analytics/top-automations', { params: { limit } });
    return response.data;
  },

  async getTeamPerformance() {
    const response = await apiClient.get('/analytics/team-performance');
    return response.data;
  },

  async getAiUsage() {
    const response = await apiClient.get('/analytics/ai-usage');
    return response.data;
  },
};

export const aiService = {
  async getAllProviders() {
    const response = await apiClient.get('/ai/providers');
    return response.data;
  },

  async createProvider(data: any) {
    const response = await apiClient.post('/ai/providers', data);
    return response.data;
  },

  async updateProvider(id: string, data: any) {
    const response = await apiClient.patch(`/ai/providers/${id}`, data);
    return response.data;
  },

  async deleteProvider(id: string) {
    const response = await apiClient.delete(`/ai/providers/${id}`);
    return response.data;
  },

  async generate(providerId: string, data: any) {
    const response = await apiClient.post(`/ai/providers/${providerId}/generate`, data);
    return response.data;
  },
};

export const usersService = {
  async getAll() {
    const response = await apiClient.get('/users');
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export const apiKeysService = {
  async getAll() {
    const response = await apiClient.get('/api-keys');
    return response.data;
  },

  async create(data: { name: string; expiresIn?: number }) {
    const response = await apiClient.post('/api-keys', data);
    return response.data;
  },

  async revoke(id: string) {
    const response = await apiClient.delete(`/api-keys/${id}`);
    return response.data;
  },
};

export const webhooksService = {
  async getAll() {
    const response = await apiClient.get('/webhooks');
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/webhooks', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/webhooks/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/webhooks/${id}`);
    return response.data;
  },

  async test(id: string) {
    const response = await apiClient.post(`/webhooks/${id}/test`);
    return response.data;
  },
};
