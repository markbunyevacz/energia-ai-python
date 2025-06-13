import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Logger } from '@/lib/logging/logger';

/**
 * @file NotificationService.ts
 *
 * @summary This service is responsible for sending notifications to users about relevant legal changes.
 * It will support multiple channels (email, in-app) and user-configurable preferences.
 */

interface User {
  id: string;
  email: string;
  // other user properties
}

interface Notification {
  title: string;
  message: string;
  link?: string;
}

type NotificationChannel = 'email' | 'in_app';

export class NotificationService {
  private supabase: SupabaseClient<Database>;
  private logger: Logger;

  constructor() {
    this.supabase = supabase;
    this.logger = new Logger('NotificationService');
  }

  /**
   * Retrieves user's notification preferences.
   * @param userId The ID of the user.
   * @returns The user's preferences, or null if not found.
   */
  public async getUserPreferences(userId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      this.logger.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  }

  /**
   * Updates a user's notification preferences.
   * @param userId The ID of the user.
   * @param preferences The partial preferences to update.
   * @returns The updated preferences, or null on error.
   */
  public async updateUserPreferences(userId: string, preferences: Partial<any>): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating user preferences:', error);
      return null;
    }

    return data;
  }

  /**
   * Sends a notification to a user.
   * @param user The user to notify.
   * @param notification The notification content.
   * @param channel The channel to send the notification through.
   */
  public async sendNotification(user: User, notification: Notification, channel: NotificationChannel): Promise<void> {
    const preferences = await this.getUserPreferences(user.id);

    const isEnabled = (channel === 'email' && preferences?.email_notifications_enabled) ||
                      (channel === 'in_app' && preferences?.in_app_notifications_enabled);

    // Default to true if preferences are not set
    if (preferences === null || isEnabled) {
        this.logger.info(`Sending ${channel} notification to user ${user.id}: "${notification.title}"`);
        // In a real implementation, this would call an email service (e.g., SendGrid)
        // or write to a 'notifications' table for in-app display.
        if (channel === 'email') {
            this.sendEmail(user, notification);
        } else {
            this.createInAppNotification(user, notification);
        }
    } else {
        this.logger.info(`Notification for user ${user.id} is disabled for ${channel} channel.`);
    }
  }

  private async sendEmail(user: User, notification: Notification): Promise<void> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-email', {
        body: { 
          to: user.email, 
          subject: notification.title,
          html: `<p>${notification.message}</p>${notification.link ? `<p><a href="${notification.link}">View Details</a></p>` : ''}`
        },
      });

      if (error) {
        this.logger.error('Error sending email notification:', error);
      } else {
        this.logger.info('Email notification sent successfully:', data);
      }
    } catch (e) {
      this.logger.error('An unexpected error occurred while sending email:', e);
    }
  }

  private async createInAppNotification(user: User, notification: Notification): Promise<void> {
    this.logger.info(`Creating in-app notification for user ${user.id} with title: ${notification.title}`);
    
    const { error } = await this.supabase.from('notifications').insert({
      user_id: user.id,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      type: 'egyéb' // Default type, valid according to schema
    });

    if (error) {
      this.logger.error('Error creating in-app notification:', error);
    }
  }

  /**
   * Sends a batch of notifications, e.g., for a daily digest.
   * @param notifications A map of user IDs to their list of notifications.
   */
  public async sendBatchNotifications(notifications: Map<string, Notification[]>): Promise<void> {
    this.logger.info(`Sending batch notifications to ${notifications.size} users...`);
    for (const [userId, userNotifications] of notifications.entries()) {
      // In a real implementation, you would format this as a single digest email/notification.
      // And check preferences before sending.
      this.logger.info(`User ${userId} has ${userNotifications.length} updates.`);
    }
  }
} 