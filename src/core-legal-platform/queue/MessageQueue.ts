import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { EventEmitter } from 'events';
import { AgentRegistry } from '../agents/AgentRegistry';
import Redis from 'ioredis';

type QueueMessagePayload = {
  type: 'document_processing' | 'domain_analysis' | 'hierarchy_update';
  payload: any;
};

export class MessageQueue extends EventEmitter {
  private static instance: MessageQueue;
  private redis: Redis;
  private processing: boolean = false;
  private queueName = 'legal_ai_queue';

  private constructor() {
    super();
    // Assuming Redis is running on localhost:6379. This should be configurable.
    this.redis = new Redis();
    this.startProcessing();
  }

  public static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  private async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    console.log('Message queue worker started...');

    while (this.processing) {
      try {
        // Use blocking pop to wait for messages
        const result = await this.redis.brpop(this.queueName, 0);
        if (result) {
          const messageId = result[1];
          this.processMessage(messageId);
        }
      } catch (error) {
        console.error('Error processing message from Redis:', error);
        this.emit('error', error);
        // Add a small delay before retrying to prevent a fast error loop
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processMessage(messageId: string) {
    await this.updateMessageStatus(messageId, 'processing');

    const { data: message, error } = await supabase
      .from('queue_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !message) {
      console.error(`Error retrieving message ${messageId} from Supabase:`, error);
      return;
    }

    try {
      switch (message.type) {
        case 'document_processing':
          await this.processDocument(message.payload);
          break;
        case 'domain_analysis':
          await this.analyzeDomain(message.payload);
          break;
        case 'hierarchy_update':
          await this.updateHierarchy(message.payload);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }

      await this.updateMessageStatus(message.id, 'completed');
      this.emit('messageProcessed', message);
    } catch (err) {
      await this.updateMessageStatus(message.id, 'failed', (err as Error).message);
    }
  }

  private async updateMessageStatus(
    messageId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ) {
    const { error } = await supabase
      .from('queue_messages')
      .update({
        status,
        error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      console.error(`Failed to update status for message ${messageId}:`, error);
    }
  }

  private async processDocument(payload: any) {
    const agentRegistry = AgentRegistry.getInstance();
    const agent = agentRegistry.getAgent(payload.agentId);

    if (!agent) {
      throw new Error(`Agent with id ${payload.agentId} not found.`);
    }

    await agent.process({
      document: payload.document,
      domain: agent.getConfig().domainCode,
      user: payload.user,
    });
  }

  private async analyzeDomain(payload: any) {
    console.log('Analyzing domain:', payload);
  }

  private async updateHierarchy(payload: any) {
    console.log('Updating hierarchy:', payload);
  }

  public async enqueueMessage(type: QueueMessagePayload['type'], payload: any): Promise<string> {
    const { data, error } = await supabase
      .from('queue_messages')
      .insert({
        type,
        payload,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to insert message into Supabase: ${error?.message}`);
    }

    await this.redis.lpush(this.queueName, data.id);
    return data.id;
  }

  public stop() {
    this.processing = false;
    this.redis.disconnect();
  }
}