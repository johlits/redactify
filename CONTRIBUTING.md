# Contributing to Redactify

Thank you for your interest in contributing to Redactify! 🎉

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/redactify.git
   cd redactify
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start the development server**
   ```bash
   npm run dev
   ```

## Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Test your changes thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Wait for review

## Code Style

- Use **functional components** with hooks
- Follow **React best practices**
- Use **TailwindCSS** for styling
- Keep components **small and focused**
- Write **descriptive variable names**
- Add **comments** for complex logic

## Project Structure

```
redactify/
├── src/
│   ├── components/      # React components
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── examples/           # Example files for testing
├── public/            # Static assets
└── README.md          # Documentation
```

## Adding New Redaction Features

1. Update `src/utils/redactor.js` with new patterns
2. Add corresponding option in `src/App.jsx` settings
3. Update `src/components/SettingsPanel.jsx` with new toggle
4. Update `src/components/StatsPanel.jsx` to display stats
5. Test with example files
6. Update documentation

## Testing

Before submitting a PR:

1. Test with the example files in `examples/`
2. Try different programming languages
3. Toggle different settings combinations
4. Verify the statistics are accurate
5. Check the download functionality

## Reporting Issues

When reporting issues, please include:

- **Description** of the problem
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Browser and OS** information

## Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists
- Clearly describe the use case
- Explain why it would be valuable
- Consider submitting a PR yourself

## Questions?

Feel free to open an issue for any questions or discussions.

Thank you for contributing! 🚀
