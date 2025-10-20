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
    // Reserved keywords that should never be treated as variables
    const reservedKeywords = new Set([
      'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
      'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch',
      'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof', 'void',
      'this', 'super', 'extends', 'import', 'export', 'default', 'async',
      'await', 'yield', 'static', 'get', 'set', 'constructor', 'from', 'as'
    ]);
    
    // const, let, var declarations (simple)
    const declPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*[=;,]|\s*$)/g;
    let match;
    while ((match = declPattern.exec(code)) !== null) {
      if (!reservedKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Destructuring patterns - extract all identifiers
    // Object destructuring: const { a, b: c, d } = ...
    const objDestructPattern = /(?:const|let|var)\s*\{([^}]+)\}/g;
    while ((match = objDestructPattern.exec(code)) !== null) {
      const content = match[1];
      // Extract all identifiers from destructuring
      // Split by comma and extract variable names
      const parts = content.split(',');
      parts.forEach(part => {
        // Handle both { a } and { a: b } patterns
        const colonSplit = part.split(':');
        colonSplit.forEach(segment => {
          const identMatch = segment.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (identMatch && !reservedKeywords.has(identMatch[1])) {
            variables.add(identMatch[1]);
          }
        });
      });
    }
    
    // Array destructuring: const [a, b, ...rest] = ...
    const arrDestructPattern = /(?:const|let|var)\s*\[([^\]]+)\]/g;
    while ((match = arrDestructPattern.exec(code)) !== null) {
      const content = match[1];
      // Match all identifiers including rest parameters
      const identifiers = content.match(/\.{0,3}([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
      if (identifiers) {
        identifiers.forEach(id => {
          const cleanId = id.replace(/^\.{3}/, '').trim();
          if (cleanId && !reservedKeywords.has(cleanId)) {
            variables.add(cleanId);
          }
        });
      }
    }
    
    // Function parameters (including destructuring in params)
    const funcPattern = /function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(([^)]*)\)/g;
    while ((match = funcPattern.exec(code)) !== null) {
      extractParameterNames(match[1], variables, reservedKeywords);
    }
    
    // Arrow function parameters (all forms)
    // Form 1: const x = (a, b) => ...
    const arrowPattern1 = /(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*\(([^)]*)\)\s*=>/g;
    while ((match = arrowPattern1.exec(code)) !== null) {
      extractParameterNames(match[1], variables, reservedKeywords);
    }
    
    // Form 2: const x = a => ... (single param, no parens)
    const arrowPattern2 = /(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g;
    while ((match = arrowPattern2.exec(code)) !== null) {
      if (!reservedKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Arrow functions in callbacks: .map(x => ...), .filter(({ a, b }) => ...)
    const callbackPattern = /\.(?:map|filter|reduce|forEach|find|some|every)\s*\(\s*(?:\(([^)]*)\)|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*=>/g;
    while ((match = callbackPattern.exec(code)) !== null) {
      const params = match[1] || match[2];
      if (params) extractParameterNames(params, variables, reservedKeywords);
    }
    
    // Method parameters: methodName(param1, param2) { ... }
    // This catches parameters from object methods and class methods
    const methodParamPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{/g;
    while ((match = methodParamPattern.exec(code)) !== null) {
      // Only extract parameters, not the method name (that's handled in function extraction)
      if (match[2]) {
        extractParameterNames(match[2], variables, reservedKeywords);
      }
    }
    
    // For-of and for-in loops: for (const item of items)
    const forOfPattern = /for\s*\(\s*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+(?:of|in)\s+/g;
    while ((match = forOfPattern.exec(code)) !== null) {
      variables.add(match[1]);
    }
    
    // Catch blocks: catch (error)
    const catchPattern = /catch\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;
    while ((match = catchPattern.exec(code)) !== null) {
      variables.add(match[1]);
    }
    
    // Import statements: import { a, b as c } from '...'
    const importPattern = /import\s*\{([^}]+)\}\s*from/g;
    while ((match = importPattern.exec(code)) !== null) {
      const imports = match[1].split(',');
      imports.forEach(imp => {
        const parts = imp.trim().split(/\s+as\s+/);
        // Get the local name (after 'as' if present, otherwise the import name)
        const localName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        if (localName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(localName)) {
          variables.add(localName);
        }
      });
    }
    
    // Default imports: import x from '...'
    const defaultImportPattern = /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from/g;
    while ((match = defaultImportPattern.exec(code)) !== null) {
      variables.add(match[1]);
    }
    
    // Export statements: export { a, b }
    const exportPattern = /export\s*\{([^}]+)\}/g;
    while ((match = exportPattern.exec(code)) !== null) {
      const exports = match[1].split(',');
      exports.forEach(exp => {
        const name = exp.trim().split(/\s+as\s+/)[0].trim();
        if (name && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
          variables.add(name);
        }
      });
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
  
  // C# patterns
  if (language === 'csharp') {
    const csharpKeywords = new Set([
      'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char',
      'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
      'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false',
      'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit',
      'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace',
      'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private',
      'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
      'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch',
      'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked',
      'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while', 'var'
    ]);
    
    // Variable declarations: var x = ..., int y = ..., string name = ...
    const csharpVarPattern = /(?:var|int|string|bool|double|float|decimal|long|short|byte|char|object|dynamic)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=;,]/g;
    let match;
    while ((match = csharpVarPattern.exec(code)) !== null) {
      if (!csharpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Method parameters: void Method(int param1, string param2)
    const csharpMethodPattern = /(?:void|int|string|bool|double|float|decimal|long|short|byte|char|object|Task|async\s+Task|[A-Z][a-zA-Z0-9_<>]*)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\)/g;
    while ((match = csharpMethodPattern.exec(code)) !== null) {
      if (match[1]) {
        // Extract parameter names
        const params = match[1].split(',');
        params.forEach(param => {
          const paramMatch = param.trim().match(/(?:ref|out|params)?\s*(?:[a-zA-Z_][a-zA-Z0-9_<>]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
          if (paramMatch && !csharpKeywords.has(paramMatch[1])) {
            variables.add(paramMatch[1]);
          }
        });
      }
    }
    
    // Foreach loops: foreach (var item in items)
    const foreachPattern = /foreach\s*\(\s*(?:var|[a-zA-Z_][a-zA-Z0-9_<>]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+/g;
    while ((match = foreachPattern.exec(code)) !== null) {
      if (!csharpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // For loops: for (int i = 0; ...)
    const forPattern = /for\s*\(\s*(?:var|int|long)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    while ((match = forPattern.exec(code)) !== null) {
      if (!csharpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Catch blocks: catch (Exception ex)
    const catchPattern = /catch\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
    while ((match = catchPattern.exec(code)) !== null) {
      if (!csharpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Lambda parameters: (x, y) => ..., x => ...
    const lambdaPattern = /(?:\(([^)]+)\)|([a-zA-Z_][a-zA-Z0-9_]*))\s*=>/g;
    while ((match = lambdaPattern.exec(code)) !== null) {
      const params = match[1] || match[2];
      if (params) {
        params.split(',').forEach(param => {
          const paramName = param.trim().split(/\s+/).pop();
          if (paramName && !csharpKeywords.has(paramName)) {
            variables.add(paramName);
          }
        });
      }
    }
    
    // Using statements: using var stream = ...
    const usingPattern = /using\s*\(\s*(?:var|[a-zA-Z_][a-zA-Z0-9_<>]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    while ((match = usingPattern.exec(code)) !== null) {
      if (!csharpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
  }
  
  // PHP patterns
  if (language === 'php') {
    const phpKeywords = new Set([
      'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch',
      'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do',
      'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach',
      'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final',
      'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if',
      'implements', 'include', 'include_once', 'instanceof', 'insteadof',
      'interface', 'isset', 'list', 'match', 'namespace', 'new', 'or', 'print',
      'private', 'protected', 'public', 'readonly', 'require', 'require_once',
      'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use',
      'var', 'while', 'xor', 'yield', 'yield from'
    ]);
    
    // PHP variables: $variableName
    const phpVarPattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = phpVarPattern.exec(code)) !== null) {
      // Exclude superglobals
      const superglobals = ['GLOBALS', '_SERVER', '_GET', '_POST', '_FILES', '_COOKIE', '_SESSION', '_REQUEST', '_ENV', 'this'];
      if (!superglobals.includes(match[1]) && !phpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Function parameters: function name($param1, $param2)
    const phpFuncPattern = /function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\)/g;
    while ((match = phpFuncPattern.exec(code)) !== null) {
      if (match[1]) {
        const params = match[1].match(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g);
        if (params) {
          params.forEach(param => {
            const name = param.substring(1); // Remove $
            if (!phpKeywords.has(name)) {
              variables.add(name);
            }
          });
        }
      }
    }
    
    // Arrow functions: fn($x) => ...
    const phpArrowPattern = /fn\s*\(([^)]*)\)\s*=>/g;
    while ((match = phpArrowPattern.exec(code)) !== null) {
      if (match[1]) {
        const params = match[1].match(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g);
        if (params) {
          params.forEach(param => {
            const name = param.substring(1);
            if (!phpKeywords.has(name)) {
              variables.add(name);
            }
          });
        }
      }
    }
    
    // Foreach loops: foreach ($items as $item)
    const foreachPattern = /foreach\s*\([^)]*\s+as\s+\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = foreachPattern.exec(code)) !== null) {
      if (!phpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
    
    // Foreach with key: foreach ($items as $key => $value)
    const foreachKeyPattern = /foreach\s*\([^)]*\s+as\s+\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=>\s*\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = foreachKeyPattern.exec(code)) !== null) {
      if (!phpKeywords.has(match[1])) variables.add(match[1]);
      if (!phpKeywords.has(match[2])) variables.add(match[2]);
    }
    
    // Catch blocks: catch (Exception $e)
    const catchPattern = /catch\s*\(\s*[a-zA-Z_\\][a-zA-Z0-9_\\]*\s+\$([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
    while ((match = catchPattern.exec(code)) !== null) {
      if (!phpKeywords.has(match[1])) {
        variables.add(match[1]);
      }
    }
  }
  
  return Array.from(variables);
}

/**
 * Helper function to extract parameter names from function parameter strings
 * Handles destructuring, default values, and rest parameters
 */
function extractParameterNames(paramString, variables, reservedKeywords = new Set()) {
  if (!paramString || !paramString.trim()) return;
  
  // Handle object destructuring in parameters: { a, b: c, d }
  const objDestructMatches = paramString.match(/\{([^}]+)\}/g);
  if (objDestructMatches) {
    objDestructMatches.forEach(match => {
      const content = match.slice(1, -1); // Remove { }
      const parts = content.split(',');
      parts.forEach(part => {
        const colonSplit = part.split(':');
        colonSplit.forEach(segment => {
          const identMatch = segment.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (identMatch && !reservedKeywords.has(identMatch[1])) {
            variables.add(identMatch[1]);
          }
        });
      });
    });
  }
  
  // Handle array destructuring in parameters: [a, b, ...rest]
  const arrDestructMatches = paramString.match(/\[([^\]]+)\]/g);
  if (arrDestructMatches) {
    arrDestructMatches.forEach(match => {
      const content = match.slice(1, -1); // Remove [ ]
      const identifiers = content.match(/\.{0,3}([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
      if (identifiers) {
        identifiers.forEach(id => {
          const cleanId = id.replace(/^\.{3}/, '').trim();
          if (cleanId && !reservedKeywords.has(cleanId)) {
            variables.add(cleanId);
          }
        });
      }
    });
  }
  
  // Handle simple parameters (remove destructuring patterns first)
  const simpleParams = paramString
    .replace(/\{[^}]+\}/g, '') // Remove object destructuring
    .replace(/\[[^\]]+\]/g, '') // Remove array destructuring
    .split(',')
    .map(p => p.trim().split(/[=:\s]/)[0].replace(/\.{3}/, '').trim())
    .filter(p => p && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p) && !reservedKeywords.has(p));
  
  simpleParams.forEach(p => variables.add(p));
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
  
  // Keywords that should never be treated as function names
  const keywords = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof',
    'instanceof', 'void', 'this', 'super', 'class', 'extends', 'import', 'export',
    'default', 'const', 'let', 'var', 'function', 'async', 'await', 'yield',
    'static', 'get', 'set', 'constructor'
  ]);
  
  // JavaScript/TypeScript patterns
  if (language === 'javascript' || language === 'typescript') {
    // function declarations
    const funcPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let match;
    while ((match = funcPattern.exec(code)) !== null) {
      if (!keywords.has(match[1])) {
        functions.add(match[1]);
      }
    }
    
    // method definitions (be more careful to avoid false positives)
    const methodPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    while ((match = methodPattern.exec(code)) !== null) {
      if (!keywords.has(match[1])) {
        functions.add(match[1]);
      }
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
  
  // C# patterns
  if (language === 'csharp') {
    // Method declarations: public void MethodName(...), async Task<T> MethodName(...)
    const csharpMethodPattern = /(?:public|private|protected|internal|static|virtual|override|async)?\s*(?:void|int|string|bool|double|float|decimal|long|short|byte|char|object|Task|Task<[^>]+>|[A-Z][a-zA-Z0-9_<>]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;
    while ((match = csharpMethodPattern.exec(code)) !== null) {
      // Exclude common keywords and property getters/setters
      const excluded = ['get', 'set', 'add', 'remove', 'if', 'while', 'for', 'foreach', 'switch', 'catch', 'using'];
      if (!excluded.includes(match[1])) {
        functions.add(match[1]);
      }
    }
  }
  
  // PHP patterns
  if (language === 'php') {
    // Function declarations: function functionName(...)
    const phpFuncPattern = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;
    while ((match = phpFuncPattern.exec(code)) !== null) {
      functions.add(match[1]);
    }
    
    // Method declarations: public function methodName(...)
    const phpMethodPattern = /(?:public|private|protected|static)?\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    while ((match = phpMethodPattern.exec(code)) !== null) {
      // Exclude magic methods
      if (!match[1].startsWith('__')) {
        functions.add(match[1]);
      }
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
 * Escapes special regex characters in a string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
      const regex = new RegExp(`\\b${escapeRegex(className)}\\b`, 'g');
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
      const regex = new RegExp(`\\b${escapeRegex(funcName)}\\b`, 'g');
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
      
      // Replace whole word only - escape special regex characters
      const regex = new RegExp(`\\b${escapeRegex(varName)}\\b`, 'g');
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
    
    // PHP comments
    if (language === 'php') {
      // PHP also uses # for single-line comments
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
