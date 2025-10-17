import { Shield, Variable, TrendingUp, AlertCircle, Code2, Briefcase, Link, Package, FileText } from 'lucide-react'

function StatsPanel({ stats, isZipMode }) {
  // Handle both single file and zip mode stats
  const secretsRedacted = stats.totalSecrets ?? stats.secretsRedacted ?? 0
  const variablesRedacted = stats.totalVariables ?? stats.variablesRedacted ?? 0
  const classesRedacted = stats.totalClasses ?? stats.classesRedacted ?? 0
  const functionsRedacted = stats.totalFunctions ?? stats.functionsRedacted ?? 0
  const urlsRedacted = stats.totalUrls ?? stats.urlsRedacted ?? 0
  const totalChanges = stats.totalChanges ?? 0
  const changes = stats.changes ?? []

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <span>{isZipMode ? 'Bulk Redaction Summary' : 'Redaction Summary'}</span>
      </h3>
      
      {/* Zip Mode File Stats */}
      {isZipMode && stats.totalFiles && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Total Files</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Redacted</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.redactedCount}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Skipped</span>
            </div>
            <p className="text-2xl font-bold text-slate-400">{stats.skippedCount}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Errors</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.errorCount}</p>
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">Secrets</span>
          </div>
          <p className="text-2xl font-bold text-white">{secretsRedacted || 0}</p>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Classes</span>
          </div>
          <p className="text-2xl font-bold text-white">{classesRedacted || 0}</p>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Functions</span>
          </div>
          <p className="text-2xl font-bold text-white">{functionsRedacted || 0}</p>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Variable className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Variables</span>
          </div>
          <p className="text-2xl font-bold text-white">{variablesRedacted || 0}</p>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Link className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">URLs</span>
          </div>
          <p className="text-2xl font-bold text-white">{urlsRedacted || 0}</p>
        </div>
        
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalChanges || 0}</p>
        </div>
      </div>

      {/* Changes List - Single File Mode */}
      {!isZipMode && changes && changes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Changes Made:</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {changes.map((change, index) => (
              <div key={index} className="bg-slate-900/30 rounded p-3 text-sm">
                {change.type === 'secret' && (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-red-400 font-medium">Secret detected</span>
                      <span className="text-slate-400"> - {change.count} occurrence(s) redacted</span>
                    </div>
                  </div>
                )}
                {change.type === 'class' && (
                  <div className="flex items-start space-x-2">
                    <Code2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-purple-400 font-medium">{change.original}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-green-400 font-medium">{change.replacement}</span>
                      <span className="text-slate-400"> ({change.count} occurrence(s))</span>
                    </div>
                  </div>
                )}
                {change.type === 'function' && (
                  <div className="flex items-start space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-blue-400 font-medium">{change.original}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-green-400 font-medium">{change.replacement}</span>
                      <span className="text-slate-400"> ({change.count} occurrence(s))</span>
                    </div>
                  </div>
                )}
                {change.type === 'variable' && (
                  <div className="flex items-start space-x-2">
                    <Variable className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-green-400 font-medium">{change.original}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-green-400 font-medium">{change.replacement}</span>
                      <span className="text-slate-400"> ({change.count} occurrence(s))</span>
                    </div>
                  </div>
                )}
                {change.type === 'url' && (
                  <div className="flex items-start space-x-2">
                    <Link className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-cyan-400 font-medium">URLs redacted</span>
                      <span className="text-slate-400"> - {change.count} occurrence(s)</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File Details - Zip Mode */}
      {isZipMode && stats.fileDetails && stats.fileDetails.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">
            Files Processed ({stats.fileDetails.length} with changes):
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.fileDetails.map((fileDetail, index) => (
              <div key={index} className="bg-slate-900/30 rounded p-3 text-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-blue-400 font-medium truncate">{fileDetail.file}</span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                    {fileDetail.summary.totalChanges} changes
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {fileDetail.summary.secretsRedacted > 0 && (
                    <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded">
                      {fileDetail.summary.secretsRedacted} secrets
                    </span>
                  )}
                  {fileDetail.summary.classesRedacted > 0 && (
                    <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded">
                      {fileDetail.summary.classesRedacted} classes
                    </span>
                  )}
                  {fileDetail.summary.functionsRedacted > 0 && (
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                      {fileDetail.summary.functionsRedacted} functions
                    </span>
                  )}
                  {fileDetail.summary.variablesRedacted > 0 && (
                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">
                      {fileDetail.summary.variablesRedacted} variables
                    </span>
                  )}
                  {fileDetail.summary.urlsRedacted > 0 && (
                    <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">
                      {fileDetail.summary.urlsRedacted} URLs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsPanel
