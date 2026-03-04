import { db } from '../db';
import { exportDatabase, importDatabase, prepareBackup, type BackupData } from './backup';

const FILE_NAME = 'invoice_creator_backup.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

export interface GoogleDriveState {
    lastSync: string | null;
    isLoggedIn: boolean;
    userEmail: string | null;
}

export const googleDriveSync = {
    accessToken: null as string | null,

    async login(): Promise<string> {
        return new Promise((resolve, reject) => {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error) {
                        reject(response);
                    }
                    this.accessToken = response.access_token;
                    localStorage.setItem('gdrive_token', response.access_token);
                    localStorage.setItem('gdrive_token_expires', (Date.now() + response.expires_in * 1000).toString());
                    resolve(response.access_token);
                }
            });
            client.requestAccessToken();
        });
    },

    async getValidToken(): Promise<string | null> {
        const token = localStorage.getItem('gdrive_token');
        const expires = localStorage.getItem('gdrive_token_expires');

        if (token && expires && Date.now() < parseInt(expires)) {
            this.accessToken = token;
            return token;
        }
        return null;
    },

    async logout() {
        this.accessToken = null;
        localStorage.removeItem('gdrive_token');
        localStorage.removeItem('gdrive_token_expires');
    },

    async syncToCloud(): Promise<void> {
        const token = await this.getValidToken();
        if (!token) throw new Error('Not logged in');

        // 1. Prepare Data using the centralized logic
        const backup: BackupData = await prepareBackup();

        // 2. Find if file exists in appDataFolder
        const fileId = await this.findFile(token);

        // 3. Upload or Update
        if (fileId) {
            await this.updateFile(fileId, backup, token);
        } else {
            await this.createFile(backup, token);
        }

        localStorage.setItem('gdrive_last_sync', new Date().toISOString());
    },

    async findFile(token: string): Promise<string | null> {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0].id : null;
    },

    async updateFile(fileId: string, data: any, token: string) {
        await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );
    },

    async createFile(data: any, token: string) {
        const metadata = {
            name: FILE_NAME,
            parents: ['appDataFolder']
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
        });
    },

    async syncFromCloud(): Promise<boolean> {
        const token = await this.getValidToken();
        if (!token) return false;

        const fileId = await this.findFile(token);
        if (!fileId) return false;

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        const backup: BackupData = await response.json();

        // Create a mock File object to reuse importDatabase logic
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const file = new File([blob], FILE_NAME, { type: 'application/json' });

        await importDatabase(file);
        return true;
    }
};
