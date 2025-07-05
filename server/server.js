// Node.js 后端服务器 - 处理数据文件读写
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 数据文件路径
const DATA_DIR = path.join(__dirname, '../src/data');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// 确保数据目录存在
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 读取JSON文件
async function readJSONFile(filePath, defaultValue = null) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`File not found or invalid: ${filePath}, using default value`);
    return defaultValue;
  }
}

// 写入JSON文件
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file: ${filePath}`, error);
    return false;
  }
}

// API 路由

// 获取所有日记条目
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await readJSONFile(ENTRIES_FILE, []);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// 保存所有日记条目
app.post('/api/entries', async (req, res) => {
  try {
    const entries = req.body;
    const success = await writeJSONFile(ENTRIES_FILE, entries);
    if (success) {
      res.json({ message: 'Entries saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save entries' });
    }
  } catch (error) {
    console.error('Error saving entries:', error);
    res.status(500).json({ error: 'Failed to save entries' });
  }
});

// 添加新的日记条目
app.post('/api/entries/add', async (req, res) => {
  try {
    const entryData = req.body;
    const entries = await readJSONFile(ENTRIES_FILE, []);
    
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: '',
      mood: 'neutral',
      ...entryData
    };
    
    entries.unshift(newEntry);
    const success = await writeJSONFile(ENTRIES_FILE, entries);
    
    if (success) {
      res.json(newEntry);
    } else {
      res.status(500).json({ error: 'Failed to add entry' });
    }
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// 更新日记条目
app.put('/api/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id;
    const updates = req.body;
    const entries = await readJSONFile(ENTRIES_FILE, []);
    
    const entryIndex = entries.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    entries[entryIndex] = { ...entries[entryIndex], ...updates };
    const success = await writeJSONFile(ENTRIES_FILE, entries);
    
    if (success) {
      res.json({ message: 'Entry updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update entry' });
    }
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// 删除日记条目
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id;
    const entries = await readJSONFile(ENTRIES_FILE, []);
    
    const filteredEntries = entries.filter(entry => entry.id !== entryId);
    const success = await writeJSONFile(ENTRIES_FILE, filteredEntries);
    
    if (success) {
      res.json({ message: 'Entry deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// 获取设置
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readJSONFile(SETTINGS_FILE, {
      theme: 'light',
      autoSave: true,
      showMoodOnCalendar: true
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 保存设置
app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    const success = await writeJSONFile(SETTINGS_FILE, settings);
    
    if (success) {
      res.json({ message: 'Settings saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// 导出数据
app.get('/api/export', async (req, res) => {
  try {
    const entries = await readJSONFile(ENTRIES_FILE, []);
    const settings = await readJSONFile(SETTINGS_FILE, {
      theme: 'light',
      autoSave: true,
      showMoodOnCalendar: true
    });
    
    const exportData = {
      entries,
      settings,
      exportDate: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="daily-life-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// 导入数据
app.post('/api/import', async (req, res) => {
  try {
    const importData = req.body;
    
    if (importData.entries) {
      await writeJSONFile(ENTRIES_FILE, importData.entries);
    }
    
    if (importData.settings) {
      await writeJSONFile(SETTINGS_FILE, importData.settings);
    }
    
    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 启动服务器
async function startServer() {
  try {
    await ensureDataDirectory();
    
    app.listen(PORT, () => {
      console.log(`🚀 数据服务器已启动在端口 ${PORT}`);
      console.log(`📁 数据文件目录: ${DATA_DIR}`);
      console.log(`🌐 API地址: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer(); 