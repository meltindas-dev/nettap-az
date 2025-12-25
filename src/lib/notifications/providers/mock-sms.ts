import { SmsProvider, SmsMessage, NotificationResult } from '../interfaces';
import { logger } from '@/lib/logger';

/**
 * Mock SMS provider for development and testing
 * Simulates SMS sending by logging messages
 */
export class MockSmsProvider implements SmsProvider {
  getName(): string {
    return 'MockSMS';
  }

  async send(message: SmsMessage): Promise<NotificationResult> {
    try {
      // Validate phone number format (basic E.164 check)
      if (!message.to.match(/^\+\d{10,15}$/)) {
        throw new Error('Invalid phone number format. Use E.164 format (e.g., +994501234567)');
      }

      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Log the message
      logger.info('📱 SMS sent (mock)', {
        provider: this.getName(),
        to: message.to,
        from: message.from || 'NetTap',
        message: message.message.substring(0, 50) + '...',
      });

      return {
        success: true,
        messageId: `mock_sms_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      logger.error('Failed to send SMS', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
