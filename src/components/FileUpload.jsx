import { useState, useRef } from 'react'
import { Upload, File } from 'lucide-react'

function FileUpload({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      onFileUpload(file, e.target.result)
    }
    reader.readAsText(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.swift,.kt,.txt"
      />
      <div className="flex flex-col items-center space-y-3">
        <div className={`
          p-4 rounded-full
          ${isDragging ? 'bg-blue-500/20' : 'bg-slate-700/50'}
        `}>
          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
        </div>
        <div>
          <p className="text-white font-medium mb-1">
            Drop a file here or click to browse
          </p>
          <p className="text-sm text-slate-400">
            Supports: JS, TS, Python, Java, C++, Go, Rust, and more
          </p>
        </div>
      </div>
    </div>
  )
}

export default FileUpload
