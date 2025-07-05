import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Calendar, Edit3, Home, BarChart3, Settings, Plus, X, Save, Download, Upload, Moon, Sun, User, Trash2, Camera, ChevronLeft, ChevronRight, Eye, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Entry, Settings as SettingsType, AppContextType } from './types';
import { DataService } from './api/dataService';



// Context for managing app state
const AppContext = createContext<AppContextType | undefined>(undefined);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const defaultSettings: SettingsType = {
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

const moodOptions = [
  { value: 'amazing', label: 'Amazing', color: '#10B981', emoji: '🤩' },
  { value: 'happy', label: 'Happy', color: '#F59E0B', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', color: '#6B7280', emoji: '😐' },
  { value: 'sad', label: 'Sad', color: '#3B82F6', emoji: '😢' },
  { value: 'awful', label: 'Awful', color: '#EF4444', emoji: '😰' }
];

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from server on mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [entriesData, settingsData]: [Entry[], SettingsType] = await Promise.all([
        DataService.getEntries(),
        DataService.getSettings()
      ]);
      
      setEntries(entriesData);
      // 确保向后兼容，合并默认设置
      setSettings({
        ...defaultSettings,
        ...settingsData,
        customTexts: {
          ...defaultSettings.customTexts,
          ...settingsData.customTexts
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save settings to server whenever settings change
  useEffect(() => {
    if (settings !== defaultSettings) {
      DataService.saveSettings(settings);
    }
  }, [settings]);

  const addEntry = async (entry: Partial<Entry>) => {
    setIsLoading(true);
    try {
      const newEntry = await DataService.addEntry(entry);
      if (newEntry) {
        setEntries(prev => [newEntry, ...prev]);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('添加记录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEntry = async (id: string, updates: Partial<Entry>) => {
    setIsLoading(true);
    try {
      const success = await DataService.updateEntry(id, updates);
      if (success) {
        setEntries(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        ));
      } else {
        alert('更新记录失败，请重试');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('更新记录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await DataService.deleteEntry(id);
      if (success) {
        setEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        alert('删除记录失败，请重试');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('删除记录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const data = await DataService.exportData();
      if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-life-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('导出数据失败，请重试');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('导出数据失败，请重试');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const success = await DataService.importData(result);
            if (success) {
              await loadData(); // 重新加载数据
              alert('数据导入成功！');
            } else {
              alert('导入数据失败，请检查文件格式');
            }
          }
        } catch (error) {
          console.error('Error importing data:', error);
          alert('导入数据失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
    }
  };

  const value: AppContextType = {
    entries,
    settings,
    currentPage,
    selectedDate,
    showModal,
    editingEntry,
    isLoading,
    setCurrentPage,
    setSelectedDate,
    setShowModal,
    setEditingEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    exportData,
    importData,
    setSettings,
    loadData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
  </div>
);

// Navigation Component
const Navigation = () => {
  const { currentPage, setCurrentPage, settings } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'home', label: '主页', icon: Home },
    { id: 'journal', label: '日记', icon: Edit3 },
    { id: 'calendar', label: '日历', icon: Calendar },
    { id: 'mood', label: '心情追踪', icon: BarChart3 },
    { id: 'settings', label: '设置', icon: Settings }
  ];

  return (
    <nav className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <h1 className={`text-xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {settings.customTexts?.appTitle ?? '生活记录器'}
            </h1>
          )}
        </div>
      </div>
      
      <div className="flex-1 py-6">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                currentPage === item.id
                  ? settings.theme === 'dark' 
                    ? 'bg-gray-700 text-white border-r-2 border-purple-500'
                    : 'bg-gray-50 text-gray-900 border-r-2 border-purple-500'
                  : settings.theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Header Component
const Header = () => {
  const { settings, setSettings, setShowModal, isLoading } = useApp();
  
  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  return (
    <header className={`${settings.theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border-b h-18 flex items-center justify-between px-6`}>
      <div className="flex items-center gap-4">
        <h2 className={`text-xl font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {new Date().toLocaleDateString('zh-CN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        {isLoading && <LoadingSpinner />}
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${
            settings.theme === 'dark' 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => setShowModal('newEntry')}
          disabled={isLoading}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>新建记录</span>
        </button>
      </div>
    </header>
  );
};

// Entry Card Component
interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onEdit, onDelete }) => {
  const { settings, isLoading } = useApp();
  const mood = moodOptions.find(m => m.value === entry.mood);
  
  return (
    <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: mood?.color + '20' }}>
            {mood?.emoji}
          </div>
          <div>
            <h3 className={`font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {new Date(entry.date).toLocaleDateString('zh-CN')}
            </h3>
            <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {mood?.label}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(entry)}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              settings.theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              settings.theme === 'dark' 
                ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400' 
                : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} prose prose-sm max-w-none ${settings.theme === 'dark' ? 'prose-invert' : ''}`}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold mb-1">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => <code className={`px-1 py-0.5 rounded text-xs font-mono ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>{children}</code>,
            pre: ({ children }) => <pre className={`p-3 rounded-lg overflow-x-auto text-xs font-mono ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>{children}</pre>,
            blockquote: ({ children }) => <blockquote className={`pl-4 border-l-2 italic ${settings.theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>{children}</blockquote>,
            a: ({ children, href }) => <a href={href} className="text-purple-500 hover:text-purple-600 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          }}
        >
          {entry.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// Modal Components
interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: Entry | null;
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, entry = null }) => {
  const { addEntry, updateEntry, settings, isLoading } = useApp();
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || 'neutral');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  useEffect(() => {
    if (entry) {
      setContent(entry.content || '');
      setMood(entry.mood || 'neutral');
    } else {
      setContent('');
      setMood('neutral');
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entry) {
      await updateEntry(entry.id, { content, mood });
    } else {
      await addEntry({ content, mood });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {entry ? '编辑记录' : '新建记录'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              settings.theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              你的心情如何？
            </label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                    mood === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : settings.theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                今天发生了什么？
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                    isPreviewMode
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : settings.theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isPreviewMode ? (
                    <>
                      <Code className="w-4 h-4" />
                      编辑
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      预览
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {isPreviewMode ? (
              <div className={`w-full h-32 p-3 rounded-lg border overflow-y-auto ${
                settings.theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}>
                                 {content.trim() ? (
                   <ReactMarkdown
                     components={{
                       h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                       h2: ({ children }) => <h2 className="text-base font-semibold mb-1">{children}</h2>,
                       h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                       p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                       ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                       ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                       li: ({ children }) => <li className="mb-1">{children}</li>,
                       strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                       em: ({ children }) => <em className="italic">{children}</em>,
                       code: ({ children }) => <code className={`px-1 py-0.5 rounded text-xs font-mono ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>{children}</code>,
                       pre: ({ children }) => <pre className={`p-3 rounded-lg overflow-x-auto text-xs font-mono ${settings.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>{children}</pre>,
                       blockquote: ({ children }) => <blockquote className={`pl-4 border-l-2 italic ${settings.theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>{children}</blockquote>,
                       a: ({ children, href }) => <a href={href} className="text-purple-500 hover:text-purple-600 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                     }}
                   >
                     {content}
                   </ReactMarkdown>
                 ) : (
                  <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    在编辑模式下输入内容以查看预览...
                  </p>
                )}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="记录你的一天，想法，或任何你想要记住的事情...&#10;&#10;支持 Markdown 语法：&#10;# 标题 1&#10;## 标题 2&#10;**粗体** *斜体*&#10;`代码`&#10;[链接](https://example.com)"
                disabled={isLoading}
                className={`w-full h-32 p-3 rounded-lg border resize-none disabled:opacity-50 ${
                  settings.theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                required
              />
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {entry ? '更新记录' : '保存记录'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                settings.theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const { entries, setShowModal, setEditingEntry, deleteEntry, settings, isLoading } = useApp();
  const recentEntries = entries.slice(0, 5);
  
  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setShowModal('editEntry');
  };

  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
  const topMoodLabel = topMood ? moodOptions.find(m => m.value === topMood[0])?.label : undefined;

  // 计算这周的记录数量
  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const thisWeekEntries = entries.filter(entry => new Date(entry.date) >= startOfWeek).length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-500 via-amber-500 to-emerald-500 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            {settings.customTexts?.heroTitle ?? '你的生活，你的故事'}
          </h1>
          <div className="inline-block bg-purple-900/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-6">
            <p className="text-lg">
              {settings.customTexts?.heroSubtitle ?? '记录美好时刻，追踪心情变化，反思人生旅程'}
            </p>
          </div>
          <button
            onClick={() => setShowModal('newEntry')}
            disabled={isLoading}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {settings.customTexts?.startButtonText ?? '开始写作'}
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
          <h3 className={`text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            总记录数
          </h3>
          <p className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ color: '#8B5CF6' }}>
            {entries.length}
          </p>
        </div>
        
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
          <h3 className={`text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            本周记录
          </h3>
          <p className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ color: '#F59E0B' }}>
            {thisWeekEntries}
          </p>
        </div>
        
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
          <h3 className={`text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            主要心情
          </h3>
          <p className={`text-lg font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {topMoodLabel || '暂无记录'}
          </p>
        </div>
      </div>

      {/* Recent Entries */}
      <section>
        <h2 className={`text-2xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          最近记录
        </h2>
        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className={`mt-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              正在加载数据...
            </p>
          </div>
        ) : recentEntries.length === 0 ? (
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
            <Edit3 className={`w-16 h-16 mx-auto mb-4 ${settings.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              暂无记录
            </h3>
            <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              开始记录你的日常生活和想法吧
            </p>
            <button
              onClick={() => setShowModal('newEntry')}
              disabled={isLoading}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              创建你的第一条记录
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={deleteEntry}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Journal Page Component
const JournalPage = () => {
  const { entries, setShowModal, setEditingEntry, deleteEntry, settings, isLoading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  
  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setShowModal('editEntry');
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;
    return matchesSearch && matchesMood;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          日记本
        </h1>
        <button
          onClick={() => setShowModal('newEntry')}
          disabled={isLoading}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          新建记录
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索日记内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              settings.theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>
        <select
          value={selectedMood}
          onChange={(e) => setSelectedMood(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            settings.theme === 'dark'
              ? 'bg-gray-800 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-purple-500`}
        >
          <option value="all">所有心情</option>
          {moodOptions.map(mood => (
            <option key={mood.value} value={mood.value}>
              {mood.emoji} {mood.label}
            </option>
          ))}
        </select>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className={`mt-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            正在加载数据...
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
          <Edit3 className={`w-16 h-16 mx-auto mb-4 ${settings.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {searchTerm || selectedMood !== 'all' ? '没有找到匹配的记录' : '还没有记录'}
          </h3>
          <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            {searchTerm || selectedMood !== 'all' ? '尝试调整搜索条件' : '开始记录你的生活和想法吧'}
          </p>
          {!searchTerm && selectedMood === 'all' && (
            <button
              onClick={() => setShowModal('newEntry')}
              disabled={isLoading}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              创建第一条记录
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Calendar Page Component
const CalendarPage = () => {
  const { entries, setShowModal, setEditingEntry, settings, isLoading } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setShowModal('editEntry');
  };

  const entriesByDate = entries.reduce((acc, entry) => {
    const date = new Date(entry.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

  const getDaysInMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), day));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          日历
        </h1>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className={`text-xl font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </h2>
        
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => (
            <div key={day} className={`text-center font-medium py-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2 h-20"></div>;
            }
            
            const dateString = day.toDateString();
            const dayEntries = entriesByDate[dateString] || [];
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={day.toISOString()}
                className={`p-2 h-20 border rounded-lg relative ${
                  isToday
                    ? 'bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-600'
                    : settings.theme === 'dark'
                      ? 'border-gray-600 hover:bg-gray-700'
                      : 'border-gray-200 hover:bg-gray-50'
                } transition-colors cursor-pointer`}
              >
                <div className={`text-sm font-medium ${
                  isToday
                    ? 'text-purple-800 dark:text-purple-200'
                    : settings.theme === 'dark'
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
                
                {dayEntries.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex gap-1 overflow-hidden">
                    {dayEntries.slice(0, 2).map(entry => {
                      const mood = moodOptions.find(m => m.value === entry.mood);
                      return (
                        <div
                          key={entry.id}
                          className="w-2 h-2 rounded-full text-xs"
                          style={{ backgroundColor: mood?.color }}
                          title={mood?.label}
                        />
                      );
                    })}
                    {dayEntries.length > 2 && (
                      <div className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        +{dayEntries.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Mood Tracker Page Component
const MoodTrackerPage = () => {
  const { entries, settings, isLoading } = useApp();
  
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodStats = moodOptions.map(mood => ({
    ...mood,
    count: moodCounts[mood.value] || 0,
    percentage: entries.length > 0 ? ((moodCounts[mood.value] || 0) / entries.length * 100) : 0
  }));

  const recentMoods = entries.slice(0, 10).map(entry => ({
    ...entry,
    mood: moodOptions.find(m => m.value === entry.mood)!
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          心情追踪
        </h1>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className={`mt-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            正在加载数据...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
          <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${settings.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            还没有数据
          </h3>
          <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            开始记录日记来追踪你的心情变化
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Statistics */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              心情统计
            </h2>
            <div className="space-y-3">
              {moodStats.map(mood => (
                <div key={mood.value} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: mood.color + '20' }}>
                    {mood.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {mood.label}
                      </span>
                      <span className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {mood.count}次 ({mood.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${mood.percentage}%`,
                          backgroundColor: mood.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Moods */}
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              最近心情
            </h2>
            <div className="space-y-3">
              {recentMoods.map(entry => (
                <div key={entry.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: entry.mood.color + '20' }}>
                    {entry.mood.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {entry.mood.label}
                      </span>
                      <span className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(entry.date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      {entry.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Page Component
const SettingsPage = () => {
  const { settings, setSettings, exportData, importData, isLoading } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    importData(event);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          设置
        </h1>
      </div>

      {/* Custom Text Settings */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          自定义文本
        </h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              应用标题
            </label>
            <input
              type="text"
              value={settings.customTexts?.appTitle ?? '生活记录器'}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customTexts: { 
                  ...defaultSettings.customTexts,
                  ...prev.customTexts, 
                  appTitle: e.target.value 
                }
              }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                settings.theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              主标题
            </label>
            <input
              type="text"
              value={settings.customTexts?.heroTitle ?? '你的生活，你的故事'}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customTexts: { 
                  ...defaultSettings.customTexts,
                  ...prev.customTexts, 
                  heroTitle: e.target.value 
                }
              }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                settings.theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              副标题
            </label>
            <input
              type="text"
              value={settings.customTexts?.heroSubtitle ?? '记录美好时刻，追踪心情变化，反思人生旅程'}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customTexts: { 
                  ...defaultSettings.customTexts,
                  ...prev.customTexts, 
                  heroSubtitle: e.target.value 
                }
              }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                settings.theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              开始按钮文字
            </label>
            <input
              type="text"
              value={settings.customTexts?.startButtonText ?? '开始写作'}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customTexts: { 
                  ...defaultSettings.customTexts,
                  ...prev.customTexts, 
                  startButtonText: e.target.value 
                }
              }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                settings.theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                customTexts: {
                  appTitle: '生活记录器',
                  appSubtitle: '记录美好时刻，追踪心情变化，反思人生旅程',
                  heroTitle: '你的生活，你的故事',
                  heroSubtitle: '记录美好时刻，追踪心情变化，反思人生旅程',
                  startButtonText: '开始写作'
                }
              }))}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                settings.theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              重置为默认文本
            </button>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          主题设置
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              settings.theme === 'light'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sun className="w-4 h-4" />
            浅色主题
          </button>
          <button
            onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              settings.theme === 'dark'
                ? 'border-purple-500 bg-purple-900 text-purple-200'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Moon className="w-4 h-4" />
            深色主题
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          数据管理
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className={`font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              导出数据
            </h3>
            <p className={`text-sm mb-3 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              导出你的所有日记数据为JSON文件
            </p>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : <Download className="w-4 h-4" />}
              导出数据
            </button>
          </div>
          
          <div>
            <h3 className={`font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              导入数据
            </h3>
            <p className={`text-sm mb-3 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              从JSON文件导入日记数据
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isLoading}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 disabled:opacity-50 ${
                settings.theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isLoading ? <LoadingSpinner /> : <Upload className="w-4 h-4" />}
              导入数据
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          关于
        </h2>
        <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {settings.customTexts?.appTitle ?? '生活记录器'} v1.0 - 一个简单而优雅的日记应用，帮助你记录生活中的点点滴滴。
        </p>
      </div>
    </div>
  );
};

// Simple App Component for basic functionality
const App = () => {
  const { currentPage, showModal, setShowModal, editingEntry, setEditingEntry, settings } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'journal':
        return <JournalPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'mood':
        return <MoodTrackerPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
      <div className="flex">
        <Navigation />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
      
      <EntryModal
        isOpen={showModal === 'newEntry' || showModal === 'editEntry'}
        onClose={() => {
          setShowModal(null);
          setEditingEntry(null);
        }}
        entry={editingEntry}
      />
    </div>
  );
};

// Root Component
const DailyLifeRecorder = () => {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
};

export default DailyLifeRecorder; 