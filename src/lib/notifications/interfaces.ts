/**
 * Notification provider interfaces
 */

/**
 * SMS notification data
 */
export interface SmsMessage {
  to: string; // Phone number in E.164 format (e.g., +994501234567)
  message: string;
  from?: string; // Optional sender ID
}

/**
 * Email notification data
 */
export interface EmailMessage {
  to: string | string[]; // Single email or array of emails
  subject: string;
  body: string;
  html?: string; // Optional HTML body
  from?: string; // Optional sender email
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Notification send result
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * SMS Provider interface
 * Implementations: Twilio, local gateway, mock, etc.
 */
export interface SmsProvider {
  /**
   * Send SMS message
   * @param message SMS message data
   * @returns Promise with send result
   */
  send(message: SmsMessage): Promise<NotificationResult>;

  /**
   * Get provider name for logging
   */
  getName(): string;
}

/**
 * Email Provider interface
 * Implementations: SMTP, SendGrid, mock, etc.
 */
export interface EmailProvider {
  /**
   * Send email message
   * @param message Email message data
   * @returns Promise with send result
   */
  send(message: EmailMessage): Promise<NotificationResult>;

  /**
   * Get provider name for logging
   */
  getName(): string;
}
