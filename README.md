# 🛡️ Redactify

> A powerful code redaction tool that removes business logic, secrets, and sensitive information from codebases, replacing them with generic placeholders.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vitejs.dev/)

**Perfect for:** Sharing code on Stack Overflow • Creating documentation • Security audits • Portfolio samples • Training data

## Features

- 🔒 **Secret Detection**: Automatically identifies and redacts API keys, passwords, tokens, private keys, and credentials
- 🎯 **Complete Identifier Redaction**: Replace ALL classes, functions, and variables with generic names
- 🌐 **Multi-Language Support**: Full support for JavaScript/TypeScript, C#, and PHP (see [LANGUAGE_SUPPORT.md](LANGUAGE_SUPPORT.md))
- 🔗 **URL Redaction**: Replace all URLs with generic placeholders
- 💬 **Comment Removal**: Strip or genericize all comments
- 📝 **String Sanitization**: Redact business-specific string literals
- 💻 **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- 📁 **File System Support**: Process files using LightningFS
- ⚙️ **Granular Controls**: Toggle each redaction feature on/off independently
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- 📊 **Detailed Statistics**: See exactly what was changed and how many times

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates a **single HTML file** at `dist/index.html` with all JavaScript and CSS inlined. 

✅ **Works with `file://` protocol** - Can be opened directly in any browser!
✅ **No server needed** - Double-click to run
✅ **Ultra-portable** - Share as a single file


📖 **Full documentation:** See [DOCS.md](DOCS.md) for detailed usage, deployment options, and troubleshooting.

## How It Works

1. Upload or paste your code
2. Configure redaction settings (all enabled by default):
   - **Secrets**: API keys, passwords, tokens, AWS keys, private keys
   - **Classes**: All class names → GenericClass1, GenericClass2, etc.
   - **Functions**: All function/method names → genericFunction1, etc.
   - **Variables**: All variable names → variable1, variable2, etc.
   - **Comments**: All comments → generic placeholders
   - **Strings**: Business-specific strings → generic values
   - **URLs**: All URLs → https://example.com/api
3. Click "Redact Code" to process
4. Review the changes in the statistics panel
5. Download the completely anonymized codebase with zero business information

## 🛠️ Tech Stack

- **React 18** - Modern UI framework
- **Monaco Editor** - VS Code's powerful editor
- **LightningFS** - In-browser file system
- **TailwindCSS** - Utility-first styling
- **Vite** - Lightning-fast build tool
- **Lucide React** - Beautiful icons

## 🚀 Deployment

**Web Hosting:**
- Netlify: Drag `dist/` to [netlify.com/drop](https://app.netlify.com/drop)
- Vercel: `npx vercel --prod`
- GitHub Pages: Enable in Settings → Pages

**Desktop App:** See [DOCS.md](DOCS.md#deployment) for Electron packaging.

## 🐛 Troubleshooting

**Monaco Editor not loading?**
- Requires internet connection for CDN
- Try a different browser

**Build issues?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Performance slow?**
- Reduce file size
- Disable some redaction options
- Use Chrome/Edge for best performance

## 🔒 Privacy

All processing happens **entirely in your browser**. No code is sent to any server. Your code never leaves your machine.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## ⭐ Show Your Support

If you find this tool useful, please consider giving it a star on GitHub!
