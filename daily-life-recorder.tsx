import React, { useState, useEffect, createContext, useContext } from 'react';
import { Calendar, Edit3, Home, BarChart3, Settings, Plus, X, Save, Download, Upload, Moon, Sun, User, Trash2, Camera } from 'lucide-react';

// Types
interface Entry {
  id: string;
  date: string;
  content: string;
  mood: string;
}

interface Settings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  showMoodOnCalendar: boolean;
}

interface AppContextType {
  entries: Entry[];
  settings: Settings;
  currentPage: string;
  selectedDate: Date;
  showModal: string | null;
  editingEntry: Entry | null;
  setCurrentPage: (page: string) => void;
  setSelectedDate: (date: Date) => void;
  setShowModal: (modal: string | null) => void;
  setEditingEntry: (entry: Entry | null) => void;
  addEntry: (entry: Partial<Entry>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  exportData: () => void;
  importData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
}

// Context for managing app state
const AppContext = createContext<AppContextType | undefined>(undefined);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Mock data structure and storage
const STORAGE_KEY = 'daily-life-recorder-data';
const SETTINGS_KEY = 'daily-life-recorder-settings';

const defaultSettings = {
  theme: 'light',
  autoSave: true,
  showMoodOnCalendar: true
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
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save data to localStorage whenever entries or settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const addEntry = (entry) => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...entry
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const updateEntry = (id, updates) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  };

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const exportData = () => {
    const data = { entries, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-life-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const data = JSON.parse(result);
            if (data.entries) setEntries(data.entries);
            if (data.settings) setSettings(data.settings);
          }
        } catch (error) {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    }
  };

  const value = {
    entries,
    settings,
    currentPage,
    selectedDate,
    showModal,
    editingEntry,
    setCurrentPage,
    setSelectedDate,
    setShowModal,
    setEditingEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    exportData,
    importData,
    setSettings
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Navigation Component
const Navigation = () => {
  const { currentPage, setCurrentPage, settings } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'journal', label: 'Journal', icon: Edit3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'mood', label: 'Mood Tracker', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
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
              Life Recorder
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
  const { settings, setSettings, setShowModal } = useApp();
  
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
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
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
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
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
  const { settings } = useApp();
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
              {new Date(entry.date).toLocaleDateString()}
            </h3>
            <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {mood?.label}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(entry)}
            className={`p-2 rounded-lg transition-colors ${
              settings.theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className={`p-2 rounded-lg transition-colors ${
              settings.theme === 'dark' 
                ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400' 
                : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <p className={`${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
        {entry.content}
      </p>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const { entries, setShowModal, setEditingEntry, deleteEntry, settings } = useApp();
  const recentEntries = entries.slice(0, 5);
  
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowModal('editEntry');
  };

  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-500 via-amber-500 to-emerald-500 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Your Life, Your Story
          </h1>
          <div className="inline-block bg-purple-900/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-6">
            <p className="text-lg">
              Record moments, track moods, and reflect on your journey
            </p>
          </div>
          <button
            onClick={() => setShowModal('newEntry')}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Start Writing
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Total Entries
          </h3>
          <p className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
            {entries.length}
          </p>
        </div>
        
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            This Week
          </h3>
          <p className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
            {entries.filter(e => {
              const entryDate = new Date(e.date);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return entryDate >= weekAgo;
            }).length}
          </p>
        </div>
        
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 border ${settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Top Mood
          </h3>
          <div className="flex items-center gap-2">
            {Object.keys(moodCounts).length > 0 ? (
              <>
                <span className="text-2xl">
                  {moodOptions.find(m => m.value === Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b))?.emoji}
                </span>
                <p className={`text-lg font-semibold ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {moodOptions.find(m => m.value === Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b))?.label}
                </p>
              </>
            ) : (
              <p className={`text-lg ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No entries yet
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Recent Entries */}
      <section>
        <h2 className={`text-2xl font-bold mb-6 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Recent Entries
        </h2>
        {recentEntries.length === 0 ? (
          <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
            <Edit3 className={`w-16 h-16 mx-auto mb-4 ${settings.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No entries yet
            </h3>
            <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Start recording your daily life and thoughts
            </p>
            <button
              onClick={() => setShowModal('newEntry')}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors"
            >
              Create Your First Entry
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
  const { entries, setShowModal, setEditingEntry, deleteEntry, settings } = useApp();
  
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowModal('editEntry');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Journal Entries
        </h1>
        <button
          onClick={() => setShowModal('newEntry')}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>
      
      {entries.length === 0 ? (
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
          <Edit3 className={`w-16 h-16 mx-auto mb-4 ${settings.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            No journal entries yet
          </h3>
          <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Start documenting your thoughts and experiences
          </p>
          <button
            onClick={() => setShowModal('newEntry')}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors"
          >
            Write Your First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
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
  const { entries, settings } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEntryForDate = (day: number | null): Entry | undefined => {
    if (!day) return undefined;
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return entries.find(entry => new Date(entry.date).toDateString() === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Calendar View
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className={`p-2 rounded-lg transition-colors ${
              settings.theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            ←
          </button>
          <h2 className={`text-xl font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {monthYear}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className={`p-2 rounded-lg transition-colors ${
              settings.theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            →
          </button>
        </div>
      </div>
      
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={`text-center font-semibold p-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const entry = getEntryForDate(day);
            const mood = entry ? moodOptions.find(m => m.value === entry.mood) : null;
            
            return (
              <div
                key={index}
                className={`h-16 rounded-lg border transition-colors ${
                  day
                    ? settings.theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
                    : 'border-transparent'
                } ${
                  entry
                    ? settings.theme === 'dark'
                      ? 'bg-gray-700'
                      : 'bg-gray-50'
                    : settings.theme === 'dark'
                      ? 'bg-gray-800'
                      : 'bg-white'
                }`}
              >
                {day && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <span className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {day}
                    </span>
                    {mood && (
                      <span className="text-xs mt-1">
                        {mood.emoji}
                      </span>
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
  const { entries, settings } = useApp();
  
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const moodByDay = last7Days.map(date => {
    const entry = entries.find(e => new Date(e.date).toDateString() === date.toDateString());
    const mood = entry ? moodOptions.find(m => m.value === entry.mood) : null;
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      mood: mood,
      hasEntry: !!entry
    };
  });

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Mood Tracker
      </h1>
      
      {/* Mood Distribution */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Overall Mood Distribution
        </h2>
        <div className="space-y-4">
          {moodOptions.map(mood => {
            const count = moodCounts[mood.value] || 0;
            const percentage = entries.length > 0 ? (count / entries.length) * 100 : 0;
            
            return (
              <div key={mood.value} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24">
                  <span className="text-lg">{mood.emoji}</span>
                  <span className={`text-sm font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {mood.label}
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: mood.color
                    }}
                  />
                </div>
                <span className={`text-sm font-medium w-12 text-right ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Last 7 Days */}
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Last 7 Days
        </h2>
        <div className="grid grid-cols-7 gap-4">
          {moodByDay.map((day, index) => (
            <div key={index} className={`text-center p-4 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {day.date}
              </div>
              <div className="text-2xl mb-2">
                {day.mood ? day.mood.emoji : '😶'}
              </div>
              <div className={`text-xs ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {day.hasEntry ? day.mood?.label : 'No entry'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Page Component
const SettingsPage = () => {
  const { settings, setSettings, exportData, importData } = useApp();
  
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Settings
      </h1>
      
      <div className="grid gap-6">
        {/* Theme Settings */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Dark Mode
                </label>
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Switch between light and dark themes
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('theme', settings.theme === 'light' ? 'dark' : 'light')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.theme === 'dark' ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Journal Settings */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Journal Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Auto-save
                </label>
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Automatically save entries as you type
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoSave ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Show Mood on Calendar
                </label>
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Display mood emojis on calendar dates
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('showMoodOnCalendar', !settings.showMoodOnCalendar)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showMoodOnCalendar ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showMoodOnCalendar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className={`${settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Data Management
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Export Data
                </label>
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Download all your entries as a backup file
                </p>
              </div>
              <button
                onClick={exportData}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Import Data
                </label>
                <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Restore entries from a backup file
                </p>
              </div>
              <label className="bg-white text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
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
  const { addEntry, updateEntry, settings } = useApp();
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || 'neutral');
  
  useEffect(() => {
    if (entry) {
      setContent(entry.content || '');
      setMood(entry.mood || 'neutral');
    } else {
      setContent('');
      setMood('neutral');
    }
  }, [entry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entry) {
      updateEntry(entry.id, { content, mood });
    } else {
      addEntry({ content, mood });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {entry ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
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
              How are you feeling?
            </label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
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
            <label className={`block text-sm font-medium mb-2 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your day, thoughts, or anything you'd like to remember..."
              className={`w-full h-32 p-3 rounded-lg border resize-none ${
                settings.theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {entry ? 'Update Entry' : 'Save Entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                settings.theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
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
            