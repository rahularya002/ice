import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { ChatMessage } from '../types';

export const chatService = {
  // Get chat messages
  async getChatMessages(filters: {
    senderId?: string;
    receiverId?: string;
    projectId?: string;
    type?: 'direct' | 'project';
  }) {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (filters.type === 'direct' && filters.senderId && filters.receiverId) {
        query = query.or(`and(sender_id.eq.${filters.senderId},receiver_id.eq.${filters.receiverId}),and(sender_id.eq.${filters.receiverId},receiver_id.eq.${filters.senderId})`);
        query = query.eq('type', 'direct');
      } else if (filters.type === 'project' && filters.projectId) {
        query = query.eq('project_id', filters.projectId);
        query = query.eq('type', 'project');
      }

      const { data, error } = await query;

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  // Send message
  async sendMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: messageData.senderId,
          receiver_id: messageData.receiverId || null,
          message: messageData.message,
          type: messageData.type
        })
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};