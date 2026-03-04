import { supabase } from './supabase';
import { AppSettings } from '@/hooks/useSettings';

const STORAGE_KEY = 'bhgo_offline_data';
const SYNC_TIME_KEY = 'bhgo_last_sync';

export interface SyncStatus {
    loading: boolean;
    progress: number;
    error: string | null;
    lastSync: string | null;
}

export const offlineManager = {
    /**
     * Fetches all data from Supabase and saves to localStorage
     */
    async syncAllData(settings: AppSettings, onProgress?: (progress: number) => void): Promise<void> {
        const tableName = settings.tableName;
        let allData: any[] = [];
        let hasMore = true;
        let from = 0;
        const pageSize = 1000;

        // Get total count first for progress
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        const total = count || 0;

        while (hasMore) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .range(from, from + pageSize - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                from += pageSize;
                if (onProgress && total > 0) {
                    onProgress(Math.min(95, Math.floor((allData.length / total) * 100)));
                }
            } else {
                hasMore = false;
            }

            if (allData.length >= total) hasMore = false;
        }

        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
            localStorage.setItem(SYNC_TIME_KEY, new Date().toISOString());
            if (onProgress) onProgress(100);
        } catch (e) {
            console.error('Storage error:', e);
            throw new Error('Veriler cihaza kaydedilemedi. Hafıza dolu olabilir.');
        }
    },

    /**
     * Retrieves data from localStorage
     */
    getLocalData(): any[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Parse error:', e);
            return [];
        }
    },

    /**
     * Retrieves last sync time
     */
    getLastSync(): string | null {
        return localStorage.getItem(SYNC_TIME_KEY);
    },

    /**
     * Clears all local data
     */
    clearLocalData(): void {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SYNC_TIME_KEY);
    }
};
