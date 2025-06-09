/**
 * @file conversationContext.ts
 * @description This file defines the ConversationContextManager, a service responsible for
 * managing the state of user conversations. It provides a hybrid in-memory and persistent
 * store for tracking message history and other contextual data.
 *
 * This service is implemented as a singleton to ensure all parts of the application
 * share the same conversation state. It syncs with the Supabase `conversation_history` table.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ConversationHistoryRow = Database['public']['Tables']['conversation_history']['Row'];
type ConversationHistoryInsert = Database['public']['Tables']['conversation_history']['Insert'];

export interface ConversationMessage {
  id: string; // Corresponds to the row 'id' in the database
  question: string;
  answer: string;
  agentType: string;
  timestamp: Date;
  sources: string[];
}

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  messages: ConversationMessage[];
  currentTopic?: string;
  userRole: string;
  isLoaded: boolean; // Flag to check if history has been loaded from DB
}

class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map();

  /**
   * Retrieves the context for a given session. If not in memory, it attempts to load
   * it from the database.
   */
  async getContext(sessionId: string, userId?: string): Promise<ConversationContext | null> {
    if (this.contexts.has(sessionId) && this.contexts.get(sessionId)!.isLoaded) {
      return this.contexts.get(sessionId)!;
    }
    return this.loadContext(sessionId, userId);
  }

  /**
   * Loads a conversation context from the Supabase database.
   */
  async loadContext(sessionId: string, userId?: string): Promise<ConversationContext | null> {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading conversation history:', error);
      return null;
    }

    const messages: ConversationMessage[] = data.map(row => ({
      id: row.id,
      question: row.question,
      answer: row.answer ?? '',
      agentType: row.agent_type ?? '',
      timestamp: new Date(row.created_at),
      sources: row.sources ?? []
    }));
    
    const context: ConversationContext = {
      sessionId,
      userId,
      messages,
      userRole: 'jogász', // Default role, can be enhanced
      isLoaded: true,
      currentTopic: this.extractTopic(messages)
    };

    this.contexts.set(sessionId, context);
    return context;
  }

  /**
   * Updates the context with a new message and persists it to the database.
   */
  async updateContext(sessionId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>, userId?: string, userRole: string = 'jogász'): Promise<ConversationContext | null> {
    let context = await this.getContext(sessionId, userId);
    
    if (!context) {
      context = {
        sessionId,
        userId,
        messages: [],
        userRole,
        isLoaded: true
      };
    }
    
    // Persist to database
    const { data, error } = await supabase
      .from('conversation_history')
      .insert({
        session_id: sessionId,
        user_id: userId,
        question: message.question,
        answer: message.answer,
        agent_type: message.agentType,
        sources: message.sources,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conversation message:', error);
      return context; // Return context without the new message if DB save fails
    }

    const newMessage: ConversationMessage = {
        id: data.id,
        question: data.question,
        answer: data.answer ?? '',
        agentType: data.agent_type ?? '',
        sources: data.sources ?? [],
        timestamp: new Date(data.created_at),
    };

    context.messages.push(newMessage);
    
    // Keep only the last N messages in memory for performance
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }

    context.currentTopic = this.extractTopic(context.messages);
    this.contexts.set(sessionId, context);
    
    return context;
  }

  /**
   * Extracts a topic from the recent messages.
   */
  private extractTopic(messages: ConversationMessage[]): string {
    const recentQuestions = messages.slice(-3).map(m => m.question).join(' ');
    
    const topics = {
      'energiaszerződés': ['energia', 'szerződés', 'áram', 'gáz'],
      'megfelelőség': ['megfelelőség', 'előírás', 'szabályozás'],
      'jogi_kutatás': ['jogszabály', 'törvény', 'rendelet']
    };

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => recentQuestions.toLowerCase().includes(keyword))) {
        return topic;
      }
    }

    return 'általános';
  }

  /**
   * Retrieves the most recent messages for a session.
   */
  async getRecentMessages(sessionId: string, count: number = 5): Promise<ConversationMessage[]> {
    const context = await this.getContext(sessionId);
    if (!context) return [];
    
    return context.messages.slice(-count);
  }

  /**
   * (Placeholder) Generates a summary of the conversation.
   */
  async getSummary(sessionId: string): Promise<string> {
    const context = await this.getContext(sessionId);
    if (!context || context.messages.length === 0) {
      return "No conversation history found.";
    }

    const transcript = context.messages
      .map(m => `User: ${m.question}\nAgent: ${m.answer}`)
      .join('\n\n');
      
    // In a real implementation, this would call an LLM.
    return `This is a summary of a conversation about "${context.currentTopic}". The last question was: "${context.messages[context.messages.length - 1].question}".`;
  }

  /**
   * Clears the in-memory context for a session.
   */
  clearContext(sessionId: string) {
    this.contexts.delete(sessionId);
  }
}

export const conversationContextManager = new ConversationContextManager();
