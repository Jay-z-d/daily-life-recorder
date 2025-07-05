# 本地文件存储系统设置指南 📁

## 🆕 新特性

你的日记内容现在存储在**本地文件系统**中，而不是浏览器的localStorage！

### 存储位置
- 📁 日记内容：`src/data/entries.json`
- ⚙️ 应用设置：`src/data/settings.json`

## 🚀 快速启动（完整版）

### 1. 安装前端依赖
```bash
npm install
```

### 2. 安装后端依赖
```bash
npm run setup
```

### 3. 同时启动前端和后端
```bash
npm start
```

这个命令会同时启动：
- 🖥️ 前端应用 (http://localhost:3000)
- 🔧 后端API服务器 (http://localhost:3001)

### 4. 打开浏览器
访问 `http://localhost:3000`

## 📋 分别启动（调试模式）

### 启动后端服务器
```bash
# 在第一个终端窗口
npm run server:dev
```

### 启动前端应用
```bash
# 在第二个终端窗口
npm run dev
```

## 📂 项目结构

```
daily-life-recorder/
├── src/
│   ├── data/                    # 📁 数据存储目录
│   │   ├── entries.json         #    日记条目
│   │   └── settings.json        #    应用设置
│   ├── api/
│   │   └── dataService.ts       # 🔌 API服务层
│   ├── types.ts                 # 📝 类型定义
│   ├── daily-life-recorder.tsx  # 🎨 主应用组件
│   ├── main.tsx                 # 🚀 应用入口
│   └── index.css                # 💄 样式文件
├── server/
│   ├── server.js                # 🔧 Node.js后端服务器
│   └── package.json             # 📦 后端依赖配置
├── package.json                 # 📦 前端依赖配置
└── ... (其他配置文件)
```

## 🔧 API端点

后端提供以下API端点：

### 日记管理
- `GET /api/entries` - 获取所有日记
- `POST /api/entries/add` - 添加新日记
- `PUT /api/entries/:id` - 更新日记
- `DELETE /api/entries/:id` - 删除日记

### 设置管理
- `GET /api/settings` - 获取设置
- `POST /api/settings` - 保存设置

### 数据导入导出
- `GET /api/export` - 导出数据
- `POST /api/import` - 导入数据

### 健康检查
- `GET /api/health` - 服务器状态检查

## 💾 数据格式

### entries.json
```json
[
  {
    "id": "1705123456789",
    "date": "2024-01-13T12:34:56.789Z",
    "content": "今天天气很好，心情不错...",
    "mood": "happy"
  }
]
```

### settings.json
```json
{
  "theme": "light",
  "autoSave": true,
  "showMoodOnCalendar": true
}
```

## 🔄 数据迁移

如果你之前使用的是localStorage版本，数据迁移很简单：

### 从浏览器导出数据
1. 在旧版本中，进入设置页面
2. 点击"导出数据"按钮
3. 下载备份文件

### 导入到新系统
1. 启动新版本应用
2. 进入设置页面
3. 点击"导入数据"按钮
4. 选择之前下载的备份文件

## ✨ 新功能优势

### 🔒 数据安全
- **真实文件存储**：数据保存在实际的JSON文件中
- **版本控制友好**：可以用Git管理你的日记
- **永不丢失**：不会因为清除浏览器数据而丢失

### 📱 跨设备同步
- **云盘同步**：将data文件夹同步到云盘
- **多设备访问**：在任何设备上都能访问你的日记
- **备份简单**：直接复制data文件夹即可备份

### 🛠️ 开发友好
- **实时查看**：可以直接在文件中查看数据
- **批量处理**：可以用脚本批量处理日记数据
- **数据分析**：更容易进行数据分析和统计

## 🐛 故障排除

### 后端服务器无法启动
```bash
# 检查端口是否被占用
netstat -an | findstr :3001

# 使用不同端口
cd server
PORT=3002 npm start
```

### 前端无法连接后端
1. 确认后端服务器正在运行
2. 检查控制台是否有CORS错误
3. 检查`src/api/dataService.ts`中的API_BASE_URL

### 数据文件不存在
- 后端会自动创建data目录和文件
- 如果有问题，手动创建`src/data/`目录

### 权限问题
- 确保应用有写入`src/data/`目录的权限
- 在Windows上可能需要以管理员身份运行

## 📊 性能监控

### 查看日志
```bash
# 后端日志
cd server
npm run dev

# 前端控制台
打开浏览器开发者工具 -> Console
```

### 健康检查
访问 `http://localhost:3001/api/health` 检查后端状态

## 🔐 安全注意事项

- 后端仅监听本地端口，不对外暴露
- 数据文件仅在本地存储，不上传到任何服务器
- 建议定期备份data文件夹

## 📞 获取帮助

如果遇到问题：
1. 查看终端输出的错误信息
2. 检查浏览器控制台的错误
3. 确认Node.js版本 >= 16
4. 查看详细的README.md文档

---

**享受更安全、更可靠的日记记录体验！** 🎉 