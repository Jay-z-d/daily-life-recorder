// 类型定义文件
import React from 'react';

export interface Entry {
  id: string;
  date: string;
  content: string;
  mood: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  showMoodOnCalendar: boolean;
  customTexts: {
    appTitle: string;
    appSubtitle: string;
    heroTitle: string;
    heroSubtitle: string;
    startButtonText: string;
  };
}

export interface AppContextType {
  entries: Entry[];
  settings: Settings;
  currentPage: string;
  selectedDate: Date;
  showModal: string | null;
  editingEntry: Entry | null;
  isLoading: boolean;
  setCurrentPage: (page: string) => void;
  setSelectedDate: (date: Date) => void;
  setShowModal: (modal: string | null) => void;
  setEditingEntry: (entry: Entry | null) => void;
  addEntry: (entry: Partial<Entry>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  exportData: () => Promise<void>;
  importData: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  loadData: () => Promise<void>;
} 