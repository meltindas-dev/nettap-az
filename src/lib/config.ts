/**
 * Application configuration loaded from environment variables
 */
export const config = {
  database: {
    type: (process.env.DATABASE_TYPE || 'memory') as 'postgres' | 'sheets' | 'memory',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    name: process.env.POSTGRES_DB || 'nettap',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    
    // Google Sheets configuration
    sheetsId: process.env.GOOGLE_SHEETS_ID || '',
    sheetsCredentials: process.env.GOOGLE_SHEETS_CREDENTIALS || '', // JSON service account
    sheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  notifications: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@nettap.az',
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@nettap.az',
    },
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.database.type === 'postgres') {
    if (!config.database.password && config.app.nodeEnv === 'production') {
      errors.push('POSTGRES_PASSWORD is required in production');
    }
  } else if (config.database.type === 'sheets') {
    if (!config.database.sheetsId) {
      errors.push('GOOGLE_SHEETS_ID is required for sheets mode');
    }
    if (!config.database.sheetsCredentials && !config.database.sheetsApiKey) {
      errors.push('Either GOOGLE_SHEETS_CREDENTIALS or GOOGLE_SHEETS_API_KEY is required');
    }
  }

  if (config.app.nodeEnv === 'production') {
    if (!config.auth.jwtSecret || config.auth.jwtSecret === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
