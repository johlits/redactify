/**
 * Core redaction engine that removes sensitive information from code
 */

// Patterns for detecting secrets
const SECRET_PATTERNS = [
  // API Keys
  { pattern: /(['"`])(?:api[_-]?key|apikey|api[_-]?secret)['"`]\s*[:=]\s*['"`]([^'"`]+)['"`]/gi, replacement: '$1api_key$1: $1REDACTED_API_KEY$1' },
  { pattern: /(['"`])(?:secret[_-]?key|secret)['"`]\s*[:=]\s*['"`]([^'"`]+)['"`]/gi, replacement: '$1secret_key$1: $1REDACTED_SECRET$1' },
  
  // Tokens
  { pattern: /(['"`])(?:token|access[_-]?token|auth[_-]?token)['"`]\s*[:=]\s*['"`]([^'"`]+)['"`]/gi, replacement: '$1token$1: $1REDACTED_TOKEN$1' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, replacement: 'Bearer REDACTED_TOKEN' },
  
  // Passwords
  { pattern: /(['"`])(?:password|passwd|pwd)['"`]\s*[:=]\s*['"`]([^'"`]+)['"`]/gi, replacement: '$1password$1: $1REDACTED_PASSWORD$1' },
  
  // Database URLs
  { pattern: /(mongodb|mysql|postgresql|postgres):\/\/([^:]+):([^@]+)@/gi, replacement: '$1://username:REDACTED_PASSWORD@' },
  
  // AWS Keys
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: 'REDACTED_AWS_ACCESS_KEY' },
  { pattern: /(['"`])aws[_-]?secret[_-]?access[_-]?key['"`]\s*[:=]\s*['"`]([^'"`]+)['"`]/gi, replacement: '$1aws_secret_access_key$1: $1REDACTED_AWS_SECRET$1' },
  
  // Private keys
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, replacement: '-----BEGIN PRIVATE KEY-----\nREDACTED_PRIVATE_KEY\n-----END PRIVATE KEY-----' },
  
  // Email addresses (in strings)
  { pattern: /(['"`])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(['"`])/g, replacement: '$1user@example.com$2' },
  
  // IP addresses (private)
  { pattern: /\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g, replacement: '0.0.0.0' },
  
  // URLs with secrets in query params
  { pattern: /([?&])(key|token|secret|password|apikey)=([^&\s'"]+)/gi, replacement: '$1$2=REDACTED' },
];

// Common business-specific terms to redact
const BUSINESS_TERMS = [
  'company', 'corp', 'inc', 'ltd', 'llc',
  'customer', 'client', 'vendor', 'supplier',
  'invoice', 'payment', 'billing', 'subscription',
  'order', 'purchase', 'transaction',
  'product', 'service', 'catalog',
];

/**
 * Extracts variable names from code
 */
function extractVariableNames(code, language = 'javascript') {
  const variables = new Set();
  
  // JavaScript/TypeScript patterns
  if (language === 'javascript' || language === 'typescript') {
    // const, let, var declarations
    const declPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    while ((match = declPattern.exec(code)) !== null) {
      variables.add(match[1]);
    }
    
    // Function parameters
    const funcPattern = /function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(([^)]*)\)/g;
    while ((match = funcPattern.exec(code)) !== null) {
      const params = match[1].split(',').map(p => p.trim().split(/[=:\s]/)[0]);
      params.forEach(p => p && variables.add(p));
    }
    
    // Arrow function parameters
    const arrowPattern = /(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*\(([^)]*)\)\s*=>/g;
    while ((match = arrowPattern.exec(code)) !== null) {
      const params = match[1].split(',').map(p => p.trim().split(/[=:\s]/)[0]);
      params.forEach(p => p && variables.add(p));
    }
  }
  
  // Python patterns
  if (language === 'python') {
    const pyPattern = /(?:^|\s)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm;
    let match;
    while ((match = pyPattern.exec(code)) !== null) {
      variables.add(match[1]);
    }
  }
  
  return Array.from(variables);
}

/**
 * Extracts class names from code
 */
function extractClassNames(code, language = 'javascript') {
  const classes = new Set();
  
  // JavaScript/TypeScript patterns
  if (language === 'javascript' || language === 'typescript') {
    // class declarations
    const classPattern = /class\s+([A-Z][a-zA-Z0-9_$]*)/g;
    let match;
    while ((match = classPattern.exec(code)) !== null) {
      classes.add(match[1]);
    }
  }
  
  // Python patterns
  if (language === 'python') {
    const pyClassPattern = /class\s+([A-Z][a-zA-Z0-9_]*)\s*[:(]/g;
    let match;
    while ((match = pyClassPattern.exec(code)) !== null) {
      classes.add(match[1]);
    }
  }
  
  // Java/C#/similar patterns
  if (['java', 'csharp', 'cpp'].includes(language)) {
    const classPattern = /(?:class|interface)\s+([A-Z][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = classPattern.exec(code)) !== null) {
      classes.add(match[1]);
    }
  }
  
  return Array.from(classes);
}

/**
 * Extracts function names from code
 */
function extractFunctionNames(code, language = 'javascript') {
  const functions = new Set();
  
  // JavaScript/TypeScript patterns
  if (language === 'javascript' || language === 'typescript') {
    // function declarations
    const funcPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let match;
    while ((match = funcPattern.exec(code)) !== null) {
      functions.add(match[1]);
    }
    
    // method definitions
    const methodPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    while ((match = methodPattern.exec(code)) !== null) {
      functions.add(match[1]);
    }
  }
  
  // Python patterns
  if (language === 'python') {
    const pyFuncPattern = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;
    while ((match = pyFuncPattern.exec(code)) !== null) {
      functions.add(match[1]);
    }
  }
  
  return Array.from(functions);
}

/**
 * Checks if a variable name contains business-specific terms
 */
function isBusinessVariable(varName) {
  const lowerName = varName.toLowerCase();
  return BUSINESS_TERMS.some(term => lowerName.includes(term));
}

/**
 * Generates a generic variable name
 */
function generateGenericName(originalName, index, nameMap) {
  // Preserve common programming conventions
  if (/^[A-Z_]+$/.test(originalName)) {
    return `CONSTANT_${index}`;
  }
  if (/^[A-Z]/.test(originalName)) {
    return `Variable${index}`;
  }
  if (originalName.startsWith('_')) {
    return `_variable${index}`;
  }
  return `variable${index}`;
}

/**
 * Main redaction function
 */
export function redactCode(code, options = {}) {
  const {
    redactSecrets = true,
    redactAllVariables = true,
    redactAllClasses = true,
    redactAllFunctions = true,
    redactComments = true,
    redactStrings = true,
    redactUrls = true,
    language = 'javascript'
  } = options;
  
  let redactedCode = code;
  const changes = [];
  const nameMap = new Map();
  
  // Step 1: Redact secrets
  if (redactSecrets) {
    SECRET_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = [...redactedCode.matchAll(pattern)];
      if (matches.length > 0) {
        redactedCode = redactedCode.replace(pattern, replacement);
        changes.push({
          type: 'secret',
          count: matches.length,
          pattern: pattern.toString()
        });
      }
    });
  }
  
  // Step 2: Redact ALL class names
  if (redactAllClasses) {
    const classes = extractClassNames(code, language);
    classes.forEach((className, index) => {
      const genericName = `GenericClass${index + 1}`;
      nameMap.set(className, genericName);
      
      // Replace whole word only
      const regex = new RegExp(`\\b${className}\\b`, 'g');
      const beforeCount = (redactedCode.match(regex) || []).length;
      if (beforeCount > 0) {
        redactedCode = redactedCode.replace(regex, genericName);
        changes.push({
          type: 'class',
          original: className,
          replacement: genericName,
          count: beforeCount
        });
      }
    });
  }
  
  // Step 3: Redact ALL function names
  if (redactAllFunctions) {
    const functions = extractFunctionNames(code, language);
    // Filter out already renamed items and common built-ins
    const builtIns = ['constructor', 'render', 'componentDidMount', 'componentWillUnmount', 'useState', 'useEffect'];
    const functionsToRedact = functions.filter(f => !nameMap.has(f) && !builtIns.includes(f));
    
    functionsToRedact.forEach((funcName, index) => {
      const genericName = `genericFunction${index + 1}`;
      nameMap.set(funcName, genericName);
      
      // Replace whole word only
      const regex = new RegExp(`\\b${funcName}\\b`, 'g');
      const beforeCount = (redactedCode.match(regex) || []).length;
      if (beforeCount > 0) {
        redactedCode = redactedCode.replace(regex, genericName);
        changes.push({
          type: 'function',
          original: funcName,
          replacement: genericName,
          count: beforeCount
        });
      }
    });
  }
  
  // Step 4: Redact ALL variable names
  if (redactAllVariables) {
    const variables = extractVariableNames(code, language);
    // Filter out already renamed items
    const variablesToRedact = variables.filter(v => !nameMap.has(v));
    
    variablesToRedact.forEach((varName, index) => {
      const genericName = generateGenericName(varName, index + 1, nameMap);
      nameMap.set(varName, genericName);
      
      // Replace whole word only
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      const beforeCount = (redactedCode.match(regex) || []).length;
      if (beforeCount > 0) {
        redactedCode = redactedCode.replace(regex, genericName);
        changes.push({
          type: 'variable',
          original: varName,
          replacement: genericName,
          count: beforeCount
        });
      }
    });
  }
  
  // Step 5: Redact URLs
  if (redactUrls) {
    // HTTP/HTTPS URLs
    const urlPattern = /https?:\/\/[^\s'"<>]+/g;
    const urls = [...redactedCode.matchAll(urlPattern)];
    if (urls.length > 0) {
      redactedCode = redactedCode.replace(urlPattern, 'https://example.com/api');
      changes.push({
        type: 'url',
        count: urls.length
      });
    }
  }
  
  // Step 6: Redact string literals with business content
  if (redactStrings) {
    // Replace strings containing business terms
    redactedCode = redactedCode.replace(
      /(['"`])([^'"` ]{3,})\1/g,
      (match, quote, content) => {
        const lower = content.toLowerCase();
        if (BUSINESS_TERMS.some(term => lower.includes(term))) {
          return `${quote}generic_value${quote}`;
        }
        return match;
      }
    );
  }
  
  // Step 7: Redact comments
  if (redactComments) {
    // Single-line comments
    redactedCode = redactedCode.replace(
      /\/\/.*$/gm,
      '// Generic comment'
    );
    
    // Multi-line comments
    redactedCode = redactedCode.replace(
      /\/\*[\s\S]*?\*\//g,
      '/* Generic comment */'
    );
    
    // Python comments
    if (language === 'python') {
      redactedCode = redactedCode.replace(
        /#.*$/gm,
        '# Generic comment'
      );
    }
  }
  
  return {
    redactedCode,
    changes,
    summary: {
      secretsRedacted: changes.filter(c => c.type === 'secret').length,
      variablesRedacted: changes.filter(c => c.type === 'variable').length,
      classesRedacted: changes.filter(c => c.type === 'class').length,
      functionsRedacted: changes.filter(c => c.type === 'function').length,
      urlsRedacted: changes.filter(c => c.type === 'url').length,
      totalChanges: changes.length
    }
  };
}

/**
 * Detects the language from file extension
 */
export function detectLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
  };
  return languageMap[ext] || 'plaintext';
}

/**
 * Batch redact multiple files
 */
export function redactFiles(files, options = {}) {
  return files.map(file => {
    const language = detectLanguage(file.name);
    const result = redactCode(file.content, { ...options, language });
    return {
      ...file,
      redactedContent: result.redactedCode,
      changes: result.changes,
      summary: result.summary
    };
  });
}
