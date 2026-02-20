# AI梦境解析器 (Dream Interpreter)

探索潜意识的奥秘，解读梦境的启示

## 功能特性

- 🔮 AI智能梦境解析 - 基于火山方舟大模型
- 🎭 双流派解读 - 弗洛伊德式 / 荣格式
- ✨ 梦幻界面 - 粒子动画 + 霓虹光效
- 📥 PDF报告生成
- ☁️ Vercel一键部署

## 本地开发

### 1. 安装依赖

```bash
cd client
npm install
```

### 2. 配置API Key

创建 `.env.local` 文件：
```
VITE_API_URL=http://localhost:3001/api
```

从火山方舟获取API Key后，创建 `client/.env` 文件：
```
ARK_API_KEY=您的火山方舟API_KEY
```

### 3. 启动开发服务器

```bash
# 终端1 - 后端API
cd client/api
npm install
node index.js

# 终端2 - 前端
cd client
npm run dev
```

### 4. 访问应用

打开浏览器访问: http://localhost:5173

## Vercel部署

### 方式一：GitHub一键部署

1. 将代码推送到GitHub
2. 在Vercel官网 Import Git Repository
3. 配置环境变量：

| 变量名 | 值 |
|--------|-----|
| `ARK_API_KEY` | `baeac3bb-34b5-4033-bba4-b9defd1113cb` |

4. 点击 Deploy 即可

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel
# 按提示配置环境变量 ARK_API_KEY
```

## 使用说明

1. 在文本框中详细描述你的梦境
2. 选择解读流派（弗洛伊德式/荣格式）
3. 点击"开始解梦"按钮
结果
5.4. 查看解析 点击"生成PDF报告"下载报告

## 项目结构

```
dream-interpreter/
├── client/
│   ├── api/              # Vercel Serverless API
│   │   └── index.js
│   ├── src/
│   │   ├── App.jsx       # 主应用组件
│   │   └── App.css       # 样式文件
│   ├── vercel.json       # Vercel配置
│   └── package.json
├── server/               # 独立Node.js后端(可选)
└── README.md
```

## 技术栈

- **前端**: React + Vite + Framer Motion
- **后端**: Vercel Serverless Functions
- **AI**: 火山方舟 doubao-seed-1-6-251015
- **PDF**: PDFKit
