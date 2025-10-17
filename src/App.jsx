import { useState } from 'react'
import { FileText, Shield, Download, Upload, Settings } from 'lucide-react'
import CodeEditor from './components/CodeEditor'
import FileUpload from './components/FileUpload'
import SettingsPanel from './components/SettingsPanel'
import StatsPanel from './components/StatsPanel'
import { redactCode, detectLanguage } from './utils/redactor'

function App() {
  const [originalCode, setOriginalCode] = useState('')
  const [redactedCode, setRedactedCode] = useState('')
  const [fileName, setFileName] = useState('untitled.js')
  const [language, setLanguage] = useState('javascript')
  const [stats, setStats] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    redactSecrets: true,
    redactAllVariables: true,
    redactAllClasses: true,
    redactAllFunctions: true,
    redactComments: true,
    redactStrings: true,
    redactUrls: true
  })

  const handleFileUpload = (file, content) => {
    setFileName(file.name)
    setOriginalCode(content)
    const detectedLang = detectLanguage(file.name)
    setLanguage(detectedLang)
    setRedactedCode('')
    setStats(null)
  }

  const handleRedact = () => {
    if (!originalCode) return
    
    const result = redactCode(originalCode, {
      ...settings,
      language
    })
    
    setRedactedCode(result.redactedCode)
    setStats({
      ...result.summary,
      changes: result.changes
    })
  }

  const handleDownload = () => {
    if (!redactedCode) return
    
    const blob = new Blob([redactedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `redacted_${fileName}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOriginalCodeChange = (value) => {
    setOriginalCode(value)
    setRedactedCode('')
    setStats(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">Redactify</h1>
              <span className="text-sm text-slate-400">Code Redaction Tool</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6">
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>
        )}

        {/* File Upload */}
        <div className="mb-6">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">File:</span>
            <span className="text-sm font-medium text-white bg-slate-800 px-3 py-1 rounded">
              {fileName}
            </span>
            <span className="text-sm text-slate-400">Language:</span>
            <span className="text-sm font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded">
              {language}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRedact}
              disabled={!originalCode}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <Shield className="w-4 h-4" />
              <span>Redact Code</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!redactedCode}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {stats && (
          <div className="mb-6">
            <StatsPanel stats={stats} />
          </div>
        )}

        {/* Code Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Code */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-medium text-white">Original Code</h2>
              </div>
              <span className="text-xs text-slate-400">
                {originalCode.split('\n').length} lines
              </span>
            </div>
            <CodeEditor
              value={originalCode}
              onChange={handleOriginalCodeChange}
              language={language}
              readOnly={false}
            />
          </div>

          {/* Redacted Code */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-medium text-white">Redacted Code</h2>
              </div>
              {redactedCode && (
                <span className="text-xs text-green-400">
                  {redactedCode.split('\n').length} lines
                </span>
              )}
            </div>
            <CodeEditor
              value={redactedCode || '// Redacted code will appear here...'}
              onChange={() => {}}
              language={language}
              readOnly={true}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-6 text-center text-sm text-slate-500">
        <p>Redactify - Secure your codebase before sharing</p>
      </footer>
    </div>
  )
}

export default App
