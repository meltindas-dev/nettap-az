import { EmailProvider, EmailMessage, NotificationResult } from '../interfaces';
import { logger } from '@/lib/logger';

/**
 * Mock Email provider for development and testing
 * Simulates email sending by logging messages
 */
export class MockEmailProvider implements EmailProvider {
  getName(): string {
    return 'MockEmail';
  }

  async send(message: EmailMessage): Promise<NotificationResult> {
    try {
      // Validate email format
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of recipients) {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email address: ${email}`);
        }
      }

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Log the message
      logger.info('📧 Email sent (mock)', {
        provider: this.getName(),
        to: recipients,
        from: message.from || 'noreply@nettap.az',
        subject: message.subject,
        bodyPreview: message.body.substring(0, 50) + '...',
      });

      return {
        success: true,
        messageId: `mock_email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      logger.error('Failed to send email', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
