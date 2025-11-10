import { create } from 'zustand';
import { apiClient } from '../api/base';

export const useMessagesStore = create((set, get) => ({
  conversations: [],
  messages: {}, // { [conversationId]: { messages: [], product: {}, participants: [] } }
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetch: null,
  
  // Fetch all conversations
  fetchConversations: async (token) => {
    if (!token) return;
    
    try {
      set({ loading: true, error: null });
      const data = await apiClient.request('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Calculate total unread count
      const unread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      
      set({ 
        conversations: data, 
        unreadCount: unread, 
        loading: false,
        lastFetch: Date.now()
      });
      
      return data;
    } catch (error) {
      set({ loading: false, error: error.message });
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  },
  
  // Fetch messages for a specific conversation
  fetchMessages: async (conversationId, token) => {
    if (!token || !conversationId) return;
    
    try {
      const data = await apiClient.request(
        `/api/messages/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      set((state) => ({
        messages: { 
          ...state.messages, 
          [conversationId]: data 
        }
      }));
      
      return data;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  },
  
  // Send a message
  sendMessage: async (conversationId, text, token) => {
    if (!token || !conversationId || !text) return;
    
    try {
      await apiClient.request(
        `/api/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            conversation_id: conversationId,
            body: text 
          })
        }
      );
      
      // Refetch messages and conversations after sending
      await get().fetchMessages(conversationId, token);
      await get().fetchConversations(token);
      
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },
  
  // Mark conversation as read
  markAsRead: async (conversationId, token) => {
    if (!token || !conversationId) return;
    
    try {
      await apiClient.request(
        `/api/messages/conversations/${conversationId}/mark-read`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state to mark as read
      set((state) => {
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, unread_count: 0 };
          }
          return conv;
        });
        
        // Recalculate unread count
        const unread = updatedConversations.reduce(
          (sum, conv) => sum + (conv.unread_count || 0), 
          0
        );
        
        return {
          conversations: updatedConversations,
          unreadCount: unread
        };
      });
      
      // Also refetch to ensure sync with server
      await get().fetchConversations(token);
      
      return true;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  },
  
  // Get conversation by ID
  getConversation: (conversationId) => {
    return get().conversations.find(c => c.id === conversationId);
  },
  
  // Get messages for a conversation
  getMessages: (conversationId) => {
    return get().messages[conversationId] || null;
  },
  
  // Find conversation by product and user
  findConversation: (productId, userId) => {
    return get().conversations.find(
      c => String(c.product_id) === String(productId) &&
           c.participants?.some(p => String(p.user_id) === String(userId))
    );
  },
  
  // Clear all messages data (on logout)
  clearMessages: () => {
    set({
      conversations: [],
      messages: {},
      unreadCount: 0,
      loading: false,
      error: null,
      lastFetch: null
    });
  },
  
  // Get unread count for a specific conversation
  getUnreadCount: (conversationId) => {
    const conv = get().getConversation(conversationId);
    return conv?.unread_count || 0;
  },
}));
