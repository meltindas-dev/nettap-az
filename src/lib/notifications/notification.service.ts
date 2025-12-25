import { SmsProvider, EmailProvider, SmsMessage, EmailMessage } from './interfaces';
import { MockSmsProvider } from './providers/mock-sms';
import { MockEmailProvider } from './providers/mock-email';
import { logger } from '@/lib/logger';
import { Lead, LeadStatus } from '@/domain';

/**
 * Notification service - handles SMS and Email notifications
 * Provider-agnostic design allows swapping providers easily
 */
export class NotificationService {
  private smsProvider: SmsProvider;
  private emailProvider: EmailProvider;

  constructor(smsProvider?: SmsProvider, emailProvider?: EmailProvider) {
    // Default to mock providers for development
    this.smsProvider = smsProvider || new MockSmsProvider();
    this.emailProvider = emailProvider || new MockEmailProvider();

    logger.info('Notification service initialized', {
      smsProvider: this.smsProvider.getName(),
      emailProvider: this.emailProvider.getName(),
    });
  }

  /**
   * Send SMS notification (async, non-blocking)
   */
  private async sendSmsAsync(message: SmsMessage): Promise<void> {
    try {
      const result = await this.smsProvider.send(message);
      if (!result.success) {
        logger.warn('SMS notification failed', { error: result.error, to: message.to });
      }
    } catch (error) {
      logger.error('SMS notification error', error);
    }
  }

  /**
   * Send Email notification (async, non-blocking)
   */
  private async sendEmailAsync(message: EmailMessage): Promise<void> {
    try {
      const result = await this.emailProvider.send(message);
      if (!result.success) {
        logger.warn('Email notification failed', { error: result.error, to: message.to });
      }
    } catch (error) {
      logger.error('Email notification error', error);
    }
  }

  /**
   * Notify when a new lead is created
   * Sends SMS to customer and email to admin
   */
  async notifyLeadCreated(lead: Lead): Promise<void> {
    // Fire-and-forget: don't await, notifications run in background
    this.sendSmsAsync({
      to: lead.phone,
      message: `Thank you for your interest! We received your request for ${lead.tariffSnapshot.tariffName} (${lead.tariffSnapshot.ispName}). We'll contact you soon. - NetTap`,
    }).catch(() => {}); // Ignore errors

    if (lead.email) {
      this.sendEmailAsync({
        to: lead.email,
        subject: 'Your Internet Tariff Request - NetTap',
        body: `Dear ${lead.fullName},\n\nThank you for using NetTap!\n\nWe have received your request for:\n- Tariff: ${lead.tariffSnapshot.tariffName}\n- Provider: ${lead.tariffSnapshot.ispName}\n- Speed: ${lead.tariffSnapshot.speedMbps} Mbps\n- Price: ${lead.tariffSnapshot.priceMonthly} AZN/month\n\nOur team will contact you shortly to finalize the details.\n\nBest regards,\nNetTap Team`,
      }).catch(() => {}); // Ignore errors
    }
  }

  /**
   * Notify when lead is assigned to ISP
   * Sends SMS to customer and notification to ISP
   */
  async notifyLeadAssigned(lead: Lead, ispName: string): Promise<void> {
    // Notify customer
    this.sendSmsAsync({
      to: lead.phone,
      message: `Your internet request has been assigned to ${ispName}. They will contact you soon. - NetTap`,
    }).catch(() => {});

    // Notify ISP (would send to ISP's contact email/phone in production)
    logger.info('ISP notification: New lead assigned', {
      leadId: lead.id,
      ispName,
      customerPhone: lead.phone,
    });
  }

  /**
   * Notify when lead status is updated
   * Different messages based on status
   */
  async notifyStatusUpdated(lead: Lead, _oldStatus: LeadStatus, newStatus: LeadStatus): Promise<void> {
    let message = '';

    switch (newStatus) {
      case LeadStatus.CONTACTED:
        message = `We have contacted you regarding your internet request. - NetTap`;
        break;
      case LeadStatus.QUALIFIED:
        message = `Good news! You qualify for ${lead.tariffSnapshot.tariffName}. We'll proceed with installation. - NetTap`;
        break;
      case LeadStatus.IN_PROGRESS:
        message = `Your internet installation is in progress. You'll be connected soon! - NetTap`;
        break;
      case LeadStatus.CONVERTED:
        message = `Congratulations! Your internet service is now active. Welcome to ${lead.tariffSnapshot.ispName}! - NetTap`;
        break;
      case LeadStatus.REJECTED:
        message = `Unfortunately, we couldn't process your request at this time. Please contact us for alternatives. - NetTap`;
        break;
      case LeadStatus.CANCELLED:
        message = `Your internet request has been cancelled. Feel free to submit a new request anytime. - NetTap`;
        break;
      default:
        return; // Don't send notification for other statuses
    }

    if (message) {
      this.sendSmsAsync({
        to: lead.phone,
        message,
      }).catch(() => {});
    }
  }
}

// Singleton instance
let notificationServiceInstance: NotificationService | null = null;

/**
 * Get notification service instance
 */
export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}

/**
 * Reset notification service (for testing)
 */
export function resetNotificationService(): void {
  notificationServiceInstance = null;
}
