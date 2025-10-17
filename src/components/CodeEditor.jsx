import { Editor } from '@monaco-editor/react'

function CodeEditor({ value, onChange, language, readOnly = false }) {
  const handleEditorChange = (value) => {
    if (!readOnly && onChange) {
      onChange(value)
    }
  }

  return (
    <div className="h-[600px]">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  )
}

export default CodeEditor
