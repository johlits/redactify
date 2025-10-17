# Redactify Documentation

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/redactify.git
cd redactify
npm install
```

### Development

```bash
npm run dev
# Open http://localhost:5173
```

### Build

```bash
npm run build
# Creates single HTML file at dist/index.html
# Double-click to open - works offline!
```

---

## Usage Guide

### Basic Workflow

1. **Upload or paste code** into the left editor
2. **Configure settings** (click gear icon) - all enabled by default
3. **Click "Redact Code"** to process
4. **Review changes** in statistics panel
5. **Download** the redacted version

### Redaction Options

All options are enabled by default for maximum anonymization:

#### 🔒 Redact Secrets
Removes API keys, passwords, tokens, AWS keys, private keys, database credentials, JWT secrets, bearer tokens.

**Example:**
```javascript
// Before
const api_key = "sk_live_abc123xyz789";

// After  
const api_key = "REDACTED_API_KEY";
```

#### 🎯 Redact ALL Classes
Every class → GenericClass1, GenericClass2, etc.

```javascript
// Before
class CustomerManager { }

// After
class GenericClass1 { }
```

#### 🔧 Redact ALL Functions
Every function → genericFunction1, genericFunction2, etc.

```javascript
// Before
function processPayment() { }

// After
function genericFunction1() { }
```

#### 📝 Redact ALL Variables
Every variable → variable1, variable2, etc.

Preserves naming conventions:
- `CONSTANT_NAME` → `CONSTANT_1`
- `ClassName` → `Variable1`
- `_privateVar` → `_variable1`

#### 💬 Redact Comments
All comments → `// Generic comment`

#### 📄 Redact Business Strings
String literals with business terms → `"generic_value"`

#### 🔗 Redact URLs
All URLs → `https://example.com/api`

### Supported Languages

JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin

---

## Deployment

### Option 1: Single File (Recommended)

The build creates a single HTML file that works offline:

```bash
npm run build
# Share dist/index.html - it's completely self-contained!
```

**Benefits:**
- ✅ Works with file:// protocol
- ✅ No server needed
- ✅ Email-able, USB-friendly
- ✅ ~200 KB single file

### Option 2: Web Hosting

**Netlify (Easiest):**
```bash
npm run build
# Drag dist/ folder to netlify.com/drop
```

**Vercel:**
```bash
npx vercel --prod
```

**GitHub Pages:**
1. Enable in Settings → Pages
2. Or add GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Option 3: Desktop App (Electron)

For native Windows/Mac/Linux applications:

```bash
npm install --save-dev electron electron-builder
```

**Create `electron.js`:**
```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  win.loadFile(path.join(__dirname, 'dist/index.html'))
}

app.whenReady().then(createWindow)
```

**Update package.json:**
```json
{
  "main": "electron.js",
  "scripts": {
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.redactify.app",
    "files": ["dist/**/*", "electron.js"],
    "win": { "target": ["nsis", "portable"] },
    "mac": { "target": ["dmg"] },
    "linux": { "target": ["AppImage", "deb"] }
  }
}
```

**Build:**
```bash
npm run electron:build
```

---

## Troubleshooting

### Monaco Editor Not Loading

**Symptoms:** Code editor appears blank

**Solutions:**
- Check internet connection (Monaco loads from CDN)
- Try different browser (Chrome/Edge recommended)
- Clear browser cache

### Build Fails

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Performance Issues

**For large files:**
- Disable Monaco minimap in `src/components/CodeEditor.jsx`
- Process files in smaller chunks
- Use Chrome/Edge for better performance

**For slow computers:**
- Disable some redaction options
- Close other applications
- Use simpler code editor instead of Monaco

### File Upload Not Working

- Check file type (supported: .js, .jsx, .ts, .tsx, .py, .java, etc.)
- Check file size (very large files >10MB may be slow)
- Try pasting code directly instead

### Download Not Working

- Check browser permissions
- Disable popup blocker
- Try different browser
- Alternative: Copy code manually from right editor

### Redaction Not Working as Expected

**Some variables not redacted?**
- Built-in names preserved (console, Math, Array, etc.)
- Framework methods preserved (useState, useEffect, etc.)
- Check settings panel - ensure options are enabled

---

## Contributing

### Development Setup

```bash
git clone https://github.com/yourusername/redactify.git
cd redactify
npm install
npm run dev
```

### Project Structure

```
redactify/
├── src/
│   ├── components/      # React components
│   ├── utils/          # Utility functions
│   │   ├── redactor.js # Core redaction engine
│   │   └── fileSystem.js
│   ├── App.jsx         # Main app
│   └── main.jsx        # Entry point
├── examples/           # Test files
└── dist/              # Build output
```

### Adding New Redaction Features

1. Update `src/utils/redactor.js` with new patterns
2. Add option in `src/App.jsx` settings
3. Update `src/components/SettingsPanel.jsx`
4. Update `src/components/StatsPanel.jsx` for stats
5. Test with example files
6. Update documentation

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use TailwindCSS for styling
- Keep components small and focused
- Add comments for complex logic

### Submitting Changes

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add: your feature"`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request

### Reporting Issues

Include:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

---

## Browser Compatibility

### Supported

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Opera 76+

### Not Supported

❌ Internet Explorer

---

## Privacy & Security

- **100% client-side** - All processing in browser
- **No server communication** - Code never leaves your machine
- **No data collection** - No analytics or tracking
- **Open source** - Fully auditable code

---

## Use Cases

1. **Stack Overflow** - Share code without exposing business logic
2. **Documentation** - Create generic examples from production code
3. **Security Audits** - Prepare code for external review
4. **Portfolio** - Showcase work without violating NDAs
5. **Training Data** - Anonymize code for ML datasets
6. **Code Reviews** - Share snippets with contractors
7. **Bug Reports** - Reproduce issues without sensitive data

---

## Performance Tips

### For Large Files
- Disable Monaco minimap
- Process in chunks
- Use desktop app

### For Slow Computers
- Disable syntax highlighting
- Reduce redaction options
- Close other applications

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- 📧 Open an issue on GitHub
- 💬 Check existing issues for solutions
- ⭐ Star the repo if you find it useful!
