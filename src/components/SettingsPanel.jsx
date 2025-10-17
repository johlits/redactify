import { Shield, Variable, Briefcase, Code2, MessageSquare, Link, Type } from 'lucide-react'

function SettingsPanel({ settings, onChange }) {
  const handleToggle = (key) => {
    onChange({
      ...settings,
      [key]: !settings[key]
    })
  }

  const options = [
    {
      key: 'redactSecrets',
      icon: Shield,
      title: 'Redact Secrets',
      description: 'Remove API keys, passwords, tokens, and other sensitive credentials',
      color: 'red'
    },
    {
      key: 'redactAllClasses',
      icon: Code2,
      title: 'Redact ALL Classes',
      description: 'Replace all class names with generic names (GenericClass1, GenericClass2, etc.)',
      color: 'purple'
    },
    {
      key: 'redactAllFunctions',
      icon: Briefcase,
      title: 'Redact ALL Functions',
      description: 'Replace all function/method names with generic names (genericFunction1, etc.)',
      color: 'blue'
    },
    {
      key: 'redactAllVariables',
      icon: Variable,
      title: 'Redact ALL Variables',
      description: 'Replace all variable names with generic names (variable1, variable2, etc.)',
      color: 'green'
    },
    {
      key: 'redactComments',
      icon: MessageSquare,
      title: 'Redact Comments',
      description: 'Replace all comments with generic placeholder comments',
      color: 'slate'
    },
    {
      key: 'redactStrings',
      icon: Type,
      title: 'Redact Business Strings',
      description: 'Replace string literals containing business-specific terms',
      color: 'yellow'
    },
    {
      key: 'redactUrls',
      icon: Link,
      title: 'Redact URLs',
      description: 'Replace all URLs with generic placeholder URLs',
      color: 'cyan'
    }
  ]

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Redaction Settings</h3>
      <div className="space-y-4">
        {options.map(({ key, icon: Icon, title, description }) => (
          <div key={key} className="flex items-start space-x-4">
            <button
              onClick={() => handleToggle(key)}
              className={`
                flex-shrink-0 w-12 h-6 rounded-full transition-colors relative
                ${settings[key] ? 'bg-blue-600' : 'bg-slate-600'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${settings[key] ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Icon className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-medium text-white">{title}</h4>
              </div>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SettingsPanel
