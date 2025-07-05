// 数据服务API - 用于处理本地文件读写
import { Entry, Settings } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export class DataService {
  // 读取所有日记条目
  static async getEntries(): Promise<Entry[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/entries`);
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching entries:', error);
      return [];
    }
  }

  // 保存日记条目
  static async saveEntries(entries: Entry[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entries),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving entries:', error);
      return false;
    }
  }

  // 添加新的日记条目
  static async addEntry(entry: Partial<Entry>): Promise<Entry | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/entries/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      if (!response.ok) {
        throw new Error('Failed to add entry');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding entry:', error);
      return null;
    }
  }

  // 更新日记条目
  static async updateEntry(id: string, updates: Partial<Entry>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating entry:', error);
      return false;
    }
  }

  // 删除日记条目
  static async deleteEntry(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  }

  // 读取设置
  static async getSettings(): Promise<Settings> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        theme: 'light' as const,
        autoSave: true,
        showMoodOnCalendar: true,
        customTexts: {
          appTitle: '生活记录器',
          appSubtitle: '记录美好时刻，追踪心情变化，反思人生旅程',
          heroTitle: '你的生活，你的故事',
          heroSubtitle: '记录美好时刻，追踪心情变化，反思人生旅程',
          startButtonText: '开始写作'
        }
      };
    }
  }

  // 保存设置
  static async saveSettings(settings: Settings): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // 导出数据
  static async exportData(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/export`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      return await response.text();
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // 导入数据
  static async importData(data: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });
      return response.ok;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
} 