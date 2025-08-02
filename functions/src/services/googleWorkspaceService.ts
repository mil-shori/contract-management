import admin from 'firebase-admin';
import { google } from 'googleapis';

export class GoogleWorkspaceService {
  private static instance: GoogleWorkspaceService;
  
  public static getInstance(): GoogleWorkspaceService {
    if (!GoogleWorkspaceService.instance) {
      GoogleWorkspaceService.instance = new GoogleWorkspaceService();
    }
    return GoogleWorkspaceService.instance;
  }

  // OAuth2クライアント作成
  private createOAuth2Client(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  // Google Drive API連携
  async saveToDrive(accessToken: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: ['1234567890'], // 契約書フォルダID（実際の実装では動的に取得）
        },
        media: {
          mimeType,
          body: fileBuffer,
        },
      });

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
      };
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      throw new Error('Failed to save file to Google Drive');
    }
  }

  // Google Driveからファイル取得
  async getFromDrive(accessToken: string, fileId: string) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.get({
        fileId,
        alt: 'media',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file from Google Drive:', error);
      throw new Error('Failed to get file from Google Drive');
    }
  }

  // Google Calendar連携 - イベント作成
  async createCalendarEvent(accessToken: string, eventData: {
    summary: string;
    description?: string;
    startDateTime: Date;
    endDateTime: Date;
    attendees?: string[];
  }) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime.toISOString(),
          timeZone: 'Asia/Tokyo',
        },
        end: {
          dateTime: eventData.endDateTime.toISOString(),
          timeZone: 'Asia/Tokyo',
        },
        attendees: eventData.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1日前
            { method: 'popup', minutes: 30 }, // 30分前
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Gmail API連携 - メール送信
  async sendEmail(accessToken: string, emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      // メール作成
      const messageParts = [
        `To: ${emailData.to.join(', ')}`,
        emailData.cc && `Cc: ${emailData.cc.join(', ')}`,
        emailData.bcc && `Bcc: ${emailData.bcc.join(', ')}`,
        `Subject: ${emailData.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        emailData.body,
      ].filter(Boolean);

      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        messageId: response.data.id,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Google Sheets API連携 - データエクスポート
  async exportToSheets(accessToken: string, data: any[], sheetName: string) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const sheets = google.sheets({ version: 'v4', auth });

      // 新しいスプレッドシート作成
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `契約データ_${new Date().toISOString().split('T')[0]}`,
          },
          sheets: [
            {
              properties: {
                title: sheetName,
              },
            },
          ],
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId!;

      // データをシートに書き込み
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const values = [
          headers,
          ...data.map(row => headers.map(header => row[header] || '')),
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values,
          },
        });
      }

      return {
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      };
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      throw new Error('Failed to export to Google Sheets');
    }
  }

  // Google Docs API連携 - 契約書テンプレート作成
  async createDocumentFromTemplate(accessToken: string, templateData: {
    title: string;
    content: string;
    replacements?: Record<string, string>;
  }) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const docs = google.docs({ version: 'v1', auth });

      // 新しいドキュメント作成
      const document = await docs.documents.create({
        requestBody: {
          title: templateData.title,
        },
      });

      const documentId = document.data.documentId!;

      // コンテンツ挿入
      const requests = [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: templateData.content,
          },
        },
      ];

      // テキスト置換
      if (templateData.replacements) {
        for (const [placeholder, replacement] of Object.entries(templateData.replacements)) {
          requests.push({
            replaceAllText: {
              containsText: {
                text: placeholder,
                matchCase: false,
              },
              replaceText: replacement,
            },
          });
        }
      }

      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests,
        },
      });

      return {
        documentId,
        documentUrl: `https://docs.google.com/document/d/${documentId}`,
      };
    } catch (error) {
      console.error('Error creating Google Doc:', error);
      throw new Error('Failed to create Google Document');
    }
  }

  // ユーザー情報取得
  async getUserInfo(accessToken: string) {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const people = google.people({ version: 'v1', auth });

      const response = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,organizations,photos',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information');
    }
  }
}