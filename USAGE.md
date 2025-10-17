# Redactify Usage Guide

## Quick Start

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Open in browser**: Navigate to `http://localhost:5173`

3. **Upload or paste code**: Drag & drop a file or paste code directly into the left editor

4. **Configure settings** (optional): Click the gear icon to customize redaction options

5. **Redact**: Click the "Redact Code" button

6. **Review**: Check the statistics panel to see what was changed

7. **Download**: Click "Download" to save the redacted code

## Redaction Options

All options are **enabled by default** to provide maximum anonymization. You can toggle them individually:

### 🔒 Redact Secrets
Removes all sensitive credentials and keys:
- API keys (Stripe, AWS, etc.)
- Secret keys and tokens
- Passwords in configuration
- Private keys (RSA, etc.)
- Database credentials in connection strings
- JWT secrets
- Bearer tokens

**Example:**
```javascript
// Before
const api_key = "sk_live_abc123xyz789";

// After
const api_key = "REDACTED_API_KEY";
```

### 🎯 Redact ALL Classes
Replaces every class name with generic names:
- `CustomerManager` → `GenericClass1`
- `InvoiceProcessor` → `GenericClass2`
- `PaymentService` → `GenericClass3`

**Example:**
```javascript
// Before
class CustomerManager {
  constructor() { }
}

// After
class GenericClass1 {
  constructor() { }
}
```

### 🔧 Redact ALL Functions
Replaces every function/method name with generic names:
- `processPayment()` → `genericFunction1()`
- `sendEmail()` → `genericFunction2()`
- `calculateTotal()` → `genericFunction3()`

**Example:**
```javascript
// Before
function processPayment(amount) {
  return amount * 1.1;
}

// After
function genericFunction1(variable1) {
  return variable1 * 1.1;
}
```

### 📝 Redact ALL Variables
Replaces every variable name with generic names:
- `customerEmail` → `variable1`
- `paymentAmount` → `variable2`
- `invoiceTotal` → `variable3`

Preserves naming conventions:
- Constants: `CONSTANT_1`, `CONSTANT_2`
- PascalCase: `Variable1`, `Variable2`
- Private: `_variable1`, `_variable2`

**Example:**
```javascript
// Before
const customerName = "John Doe";
const orderTotal = 100;

// After
const variable1 = "John Doe";
const variable2 = 100;
```

### 💬 Redact Comments
Replaces all comments with generic placeholders:
- Single-line comments: `// Generic comment`
- Multi-line comments: `/* Generic comment */`
- Python comments: `# Generic comment`

**Example:**
```javascript
// Before
// Calculate the customer's total invoice amount
const total = subtotal + tax;

// After
// Generic comment
const variable1 = variable2 + variable3;
```

### 📄 Redact Business Strings
Replaces string literals containing business-specific terms:
- Company names
- Customer/client references
- Product/service names
- Invoice/payment terms

**Example:**
```javascript
// Before
const company = "Acme Corporation";

// After
const variable1 = "generic_value";
```

### 🔗 Redact URLs
Replaces all URLs with generic placeholders:
- `https://api.mycompany.com/v1` → `https://example.com/api`
- `https://payments.stripe.com` → `https://example.com/api`

**Example:**
```javascript
// Before
const apiUrl = "https://api.mycompany.com/v1/customers";

// After
const variable1 = "https://example.com/api";
```

## Use Cases

### 1. Sharing Code for Help
Remove all business logic and secrets before posting code to Stack Overflow, GitHub issues, or forums.

### 2. Code Examples
Create generic examples from production code for documentation or tutorials.

### 3. Security Audits
Prepare code samples for external security reviews without exposing business logic.

### 4. Training Data
Anonymize code for machine learning training datasets.

### 5. Portfolio Samples
Share code samples from proprietary projects without violating NDAs.

## Tips

- **Start with all options enabled** for maximum anonymization
- **Review the statistics panel** to ensure all sensitive data was caught
- **Check the changes list** to see exactly what was replaced
- **Test with the example files** in the `examples/` folder
- **Use the Monaco editor** for syntax highlighting and easy editing

## Example Workflow

1. Copy production code that has a bug
2. Upload to Redactify
3. All business logic, secrets, and identifiers are removed
4. Share the redacted code on Stack Overflow
5. Get help without exposing proprietary information
6. Apply the solution back to your original code

## Supported Languages

- JavaScript / TypeScript
- Python
- Java
- C / C++
- C#
- Go
- Rust
- Ruby
- PHP
- Swift
- Kotlin

## Limitations

- **Built-in functions**: Common built-ins (like `console.log`, `Math.random`) are preserved
- **Syntax**: The tool preserves code structure and syntax
- **Logic**: The actual program logic remains intact
- **Comments**: Can be preserved if you disable comment redaction

## Privacy

All processing happens **entirely in your browser**. No code is sent to any server. Your code never leaves your machine.
