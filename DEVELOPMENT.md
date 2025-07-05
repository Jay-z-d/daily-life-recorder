# 开发者指南 💻

## 项目架构

### 技术选型
- **React 18** - 使用最新的React Hook和Concurrent Features
- **TypeScript** - 提供类型安全和更好的开发体验
- **Tailwind CSS** - 实用优先的CSS框架
- **Vite** - 快速的构建工具和开发服务器
- **Context API** - 全局状态管理

### 核心架构模式
- **组件化设计** - 每个功能模块都是独立的React组件
- **Context + Hook** - 使用React Context进行状态管理
- **TypeScript接口** - 严格的类型定义和检查
- **本地存储** - 使用localStorage进行数据持久化

## 📂 文件结构详解

```
src/
├── daily-life-recorder.tsx    # 主应用组件，包含所有逻辑
├── main.tsx                   # 应用入口点
└── index.css                  # 全局样式和Tailwind导入
```

## 🧩 组件架构

### 1. AppProvider (状态管理)
```typescript
// 全局状态管理
interface AppContextType {
  entries: Entry[];
  settings: Settings;
  // ... 其他状态和方法
}
```

**职责：**
- 管理应用的全局状态
- 处理数据的CRUD操作
- 提供数据持久化（localStorage）
- 导出/导入功能

### 2. Navigation (导航组件)
```typescript
// 左侧导航栏
const Navigation = () => {
  // 导航逻辑
}
```

**职责：**
- 页面路由切换
- 支持收缩/展开
- 响应式设计

### 3. Header (头部组件)
```typescript
// 顶部头部
const Header = () => {
  // 头部逻辑
}
```

**职责：**
- 显示当前日期
- 主题切换按钮
- 新建记录按钮

### 4. EntryCard (记录卡片)
```typescript
interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}
```

**职责：**
- 显示单条记录
- 编辑和删除操作
- 心情状态展示

### 5. EntryModal (编辑模态框)
```typescript
interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: Entry | null;
}
```

**职责：**
- 创建/编辑记录
- 心情选择器
- 表单验证

## 🔧 扩展开发

### 添加新页面
1. 在 `renderPage()` 函数中添加新的case
2. 创建新的页面组件
3. 在导航中添加新的菜单项

```typescript
// 1. 添加新页面组件
const AnalyticsPage = () => {
  return <div>Analytics Page</div>;
};

// 2. 在renderPage中添加路由
const renderPage = () => {
  switch (currentPage) {
    case 'analytics':
      return <AnalyticsPage />;
    // ... 其他页面
  }
};

// 3. 在Navigation中添加菜单
const navItems = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  // ... 其他菜单
];
```

### 添加新的心情类型
```typescript
// 在 moodOptions 数组中添加新选项
const moodOptions = [
  { value: 'excited', label: 'Excited', color: '#FF6B6B', emoji: '🤩' },
  // ... 其他心情
];
```

### 扩展数据结构
```typescript
// 扩展 Entry 接口
interface Entry {
  id: string;
  date: string;
  content: string;
  mood: string;
  tags?: string[];      // 新增：标签
  location?: string;    // 新增：位置
  images?: string[];    // 新增：图片
}
```

### 添加新的设置选项
```typescript
interface Settings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  showMoodOnCalendar: boolean;
  language: 'zh' | 'en';           // 新增：语言设置
  enableNotifications: boolean;    // 新增：通知设置
}
```

## 🎨 样式定制

### 主题色彩
```typescript
// 在 tailwind.config.js 中自定义颜色
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

### 自定义组件样式
```typescript
// 创建可复用的样式类
const buttonStyles = {
  primary: "bg-blue-500 hover:bg-blue-600 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
};
```

## 🔄 状态管理模式

### 添加新的状态
```typescript
// 1. 在 AppProvider 中添加状态
const [newState, setNewState] = useState(initialValue);

// 2. 在 Context 接口中添加类型
interface AppContextType {
  newState: YourType;
  setNewState: (value: YourType) => void;
}

// 3. 在 value 对象中提供
const value: AppContextType = {
  newState,
  setNewState,
  // ... 其他状态
};
```

### 数据持久化
```typescript
// 添加新的存储键
const NEW_STORAGE_KEY = 'daily-life-new-data';

// 在 useEffect 中处理读取和保存
useEffect(() => {
  const saved = localStorage.getItem(NEW_STORAGE_KEY);
  if (saved) {
    setNewState(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(newState));
}, [newState]);
```

## 🧪 测试指南

### 组件测试
```typescript
// 使用 React Testing Library
import { render, screen } from '@testing-library/react';
import { EntryCard } from './EntryCard';

test('renders entry card', () => {
  const mockEntry = {
    id: '1',
    date: '2024-01-01',
    content: 'Test content',
    mood: 'happy'
  };
  
  render(<EntryCard entry={mockEntry} onEdit={() => {}} onDelete={() => {}} />);
  expect(screen.getByText('Test content')).toBeInTheDocument();
});
```

### 状态管理测试
```typescript
// 测试 Context 和 Hook
import { renderHook } from '@testing-library/react';
import { useApp } from './useApp';

test('useApp hook', () => {
  const { result } = renderHook(() => useApp(), {
    wrapper: AppProvider
  });
  
  expect(result.current.entries).toEqual([]);
});
```

## 📦 构建和部署

### 构建生产版本
```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### 部署到静态托管
```bash
# 部署到 Netlify
netlify deploy --prod --dir=dist

# 部署到 Vercel
vercel --prod
```

## 🔍 调试技巧

### React DevTools
- 安装 React DevTools 浏览器扩展
- 查看组件树和状态变化
- 调试 Context 数据流

### 控制台调试
```typescript
// 添加调试信息
console.log('Current entries:', entries);
console.log('Current settings:', settings);
```

### 性能优化
```typescript
// 使用 React.memo 优化组件
const EntryCard = React.memo(({ entry, onEdit, onDelete }) => {
  // 组件逻辑
});

// 使用 useMemo 和 useCallback 优化计算
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

## 🛡️ 错误处理

### 错误边界
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

### Try-Catch 包装
```typescript
const safeOperation = async () => {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    // 显示用户友好的错误信息
    showErrorMessage('操作失败，请重试');
  }
};
```

## 📚 推荐资源

### 文档
- [React 官方文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Vite 指南](https://vitejs.dev/guide/)

### 工具
- [React DevTools](https://github.com/facebook/react/tree/main/packages/react-devtools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

**Happy Coding! 🎉** 