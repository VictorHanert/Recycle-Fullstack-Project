import { apiClient } from './base.js';

// Message / Conversation API calls
export const messagesAPI = {

  // List conversations
  listConversations: () => apiClient.get('/api/messages/conversations'),

  // Create a new conversation
  createConversation: (product_id, participant_ids, first_message) =>
    apiClient.post('/api/messages/conversations', {
      product_id,
      participant_ids,
      first_message,
    }),

  // Get one conversation (with messages)
  getConversation: (conversationId) =>
    apiClient.get(`/api/messages/conversations/${conversationId}`),

  // Send message in existing conversation
  sendMessage: (conversationId, body) =>
    apiClient.post(`/api/messages/conversations/${conversationId}/messages`, { body }),

  // Edit a message
  editMessage: (messageId, body) =>
    apiClient.patch(`/api/messages/${messageId}`, { body }),

  // Delete a message
  deleteMessage: (messageId) =>
    apiClient.delete(`/api/messages/${messageId}`),
};

