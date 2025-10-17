# Example Files

This folder contains sample code files for testing Redactify's redaction features.

## ⚠️ Important Note

**All API keys, secrets, and credentials in these files are FAKE examples created for demonstration purposes only.**

They are intentionally formatted to look like real secrets so that Redactify can properly detect and redact them. None of these are valid credentials.

## Files

### `sample-code.js`
Basic example demonstrating:
- API keys and secrets
- Database connection strings
- Customer management class
- Payment processing
- Email configuration

### `comprehensive-example.js`
Advanced example demonstrating:
- Multiple types of secrets (API keys, AWS keys, JWT secrets)
- Business-specific URLs
- Class definitions
- Function declarations
- Variable assignments
- Comments with business logic
- Email templates
- Authentication utilities

## How to Use

1. Start Redactify: `npm run dev`
2. Upload one of these example files
3. Click "Redact Code"
4. Observe how all secrets, classes, functions, and variables are replaced with generic names
5. Review the statistics panel to see what was changed

## Expected Results

When you redact these files, you should see:
- All API keys → `REDACTED_API_KEY`, `REDACTED_SECRET`, etc.
- All class names → `GenericClass1`, `GenericClass2`, etc.
- All function names → `genericFunction1`, `genericFunction2`, etc.
- All variable names → `variable1`, `variable2`, etc.
- All comments → `// Generic comment`
- All URLs → `https://example.com/api`

The resulting code will contain only the logic structure with zero business information.
