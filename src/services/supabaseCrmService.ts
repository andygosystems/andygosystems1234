import { supabase } from '../lib/supabase';

export interface Lead {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'closed';
  metadata?: any;
  created_at?: string;
}

export interface ChatMessage {
  id?: string;
  lead_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  metadata?: any;
  created_at?: string;
}

export const supabaseCrmService = {
  /**
   * Starts a chat session by identifying or creating a lead
   */
  async startChatSession(name: string, phone?: string, email?: string): Promise<Lead> {
    // Try to find existing lead by phone or email
    let query = supabase.from('leads').select('*');
    
    if (phone) {
      query = query.eq('phone', phone);
    } else if (email) {
      query = query.eq('email', email);
    } else {
      // If no identifiers, just create a new one
      const { data, error } = await supabase
        .from('leads')
        .insert([{ name, phone, email }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }

    const { data: existingLeads, error: findError } = await query;
    
    if (findError) throw findError;

    if (existingLeads && existingLeads.length > 0) {
      // Update name if it changed
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', existingLeads[0].id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updatedLead;
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert([{ name, phone, email }])
      .select()
      .single();
    
    if (insertError) throw insertError;
    return newLead;
  },

  /**
   * Logs a message to the database
   */
  async logMessage(message: ChatMessage): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert([message]);
    
    if (error) {
      console.error('Failed to log message to Supabase:', error);
    }
  },

  /**
   * Retrieves chat history for a lead
   */
  async getChatHistory(leadId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Searches the Knowledge Base using vector similarity
   */
  async searchKB(embedding: number[], threshold = 0.7, count = 5) {
    const { data, error } = await supabase.rpc('match_kb', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: count,
    });

    if (error) throw error;
    return data;
  },

  /**
   * (Admin only) Gets all leads for the CRM dashboard
   */
  async getAllLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
