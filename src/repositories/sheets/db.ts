import { google } from 'googleapis';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

class GoogleSheetsConnection {
  private sheets: any = null;
  private auth: any = null;

  async getSheets() {
    if (!this.sheets) {
      await this.initialize();
    }
    return this.sheets;
  }

  private async initialize() {
    try {
      // Use service account or API key based on config
      if (config.database.sheetsCredentials) {
        // Service account authentication
        const credentials = JSON.parse(config.database.sheetsCredentials);
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      } else if (config.database.sheetsApiKey) {
        // API key authentication (read-only)
        this.auth = config.database.sheetsApiKey;
      } else {
        throw new Error('Google Sheets credentials not configured');
      }

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      logger.info('Google Sheets connection initialized');
    } catch (error) {
      logger.error('Failed to initialize Google Sheets connection', error);
      throw error;
    }
  }

  async readRange(range: string): Promise<any[][]> {
    const sheets = await this.getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.database.sheetsId,
      range,
    });

    return response.data.values || [];
  }

  async appendRow(range: string, values: any[]): Promise<void> {
    const sheets = await this.getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.database.sheetsId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    });
  }

  async updateRow(range: string, values: any[]): Promise<void> {
    const sheets = await this.getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.database.sheetsId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    });
  }

  async batchUpdate(requests: any[]): Promise<void> {
    const sheets = await this.getSheets();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.database.sheetsId,
      requestBody: {
        requests,
      },
    });
  }
}

export const sheetsDb = new GoogleSheetsConnection();
