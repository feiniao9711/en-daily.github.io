# 📚 English Daily Practice

An interactive Angular web application for daily English pronunciation practice. Users can read sentences, record their pronunciation, and receive instant feedback with scoring.

## ✨ Features

- 📅 **Daily Practice**: Automatically loads sentences based on the current date
- 🎤 **Voice Recording**: Record your pronunciation using the browser's MediaRecorder API
- 🗣️ **Speech Recognition**: Converts your speech to text using Web Speech API
- 📊 **Instant Scoring**: Uses Levenshtein Distance algorithm to calculate pronunciation accuracy
- 📈 **Progress Tracking**: View detailed results for each sentence
- 📱 **Mobile-First Design**: Responsive UI optimized for mobile devices
- 🎨 **Modern UI**: Clean, gradient-based design with smooth animations

## 🚀 Tech Stack

- **Framework**: Angular 17 (Standalone Components)
- **Styling**: SCSS with mobile-first approach
- **APIs**: 
  - Web Speech API (Speech Recognition)
  - MediaRecorder API (Audio Recording)
  - Speech Synthesis API (Text-to-Speech)
- **State Management**: Component-based state management
- **HTTP Client**: Angular HttpClient for loading sentence files

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Chrome browser (recommended for best compatibility)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/feiniao9711/en-daily.github.io.git
cd en-daily.github.io
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:4200/en-daily.github.io
```

## 📁 Project Structure

```
en-daily/
├── src/
│   ├── app/
│   │   ├── app.component.ts       # Main component logic
│   │   ├── app.component.html     # Component template
│   │   └── app.component.scss     # Component styles
│   ├── sentence/                  # Sentence files directory
│   │   └── YYYYMMDD.txt          # Daily sentence files
│   ├── index.html                 # Main HTML file
│   ├── main.ts                    # Application entry point
│   └── styles.scss                # Global styles
├── angular.json                   # Angular configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

## 📝 Adding Daily Sentences

Create a new text file in the `src/sentence/` directory with the format `YYYYMMDD.txt` (e.g., `20260430.txt`).

Each line in the file represents one sentence for practice:

```text
Hello, how are you today?
I am learning English pronunciation.
Practice makes perfect.
The weather is beautiful this morning.
Would you like a cup of coffee?
```

## 🎯 How to Use

1. **Start Practice**: Click "Start Today's Practice" button
2. **Listen**: Click the "Listen" button to hear the sentence
3. **Record**: Click "Start Recording" and speak the sentence
4. **Submit**: Click "Stop & Submit" to process your recording
5. **Review Score**: View your score and recognized text
6. **Next**: Click "Next Sentence" to continue
7. **Results**: After completing all sentences, view your detailed results

## 🏗️ Building for Production

Build the project for production:

```bash
npm run build:prod
```

The build artifacts will be stored in the `dist/` directory.

## 🌐 Deployment to GitHub Pages

1. Build the project:
```bash
npm run build:prod
```

2. Copy the contents of `dist/en-daily/` to your GitHub Pages repository

3. Ensure the `sentence` folder is included in the deployment

4. Push to GitHub:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

5. Enable GitHub Pages in your repository settings

## 🎨 Customization

### Styling

Modify `src/app/app.component.scss` to customize:
- Colors and gradients
- Button styles
- Card layouts
- Animations

### Scoring Algorithm

The scoring algorithm uses Levenshtein Distance. Adjust the calculation in `app.component.ts`:

```typescript
private calculateScore(original: string, recognized: string): number {
  // Customize scoring logic here
}
```

## 🔧 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Speech Recognition | ✅ | ❌ | ❌ | ✅ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| Speech Synthesis | ✅ | ✅ | ✅ | ✅ |

**Note**: For best experience, use **Google Chrome** browser.

## 🐛 Troubleshooting

### Microphone Access Denied
- Grant microphone permissions in browser settings
- Ensure HTTPS is used (required for MediaRecorder API)

### Speech Recognition Not Working
- Use Chrome browser
- Check internet connection (Speech Recognition requires online connection)
- Speak clearly and at a moderate pace

### Sentence File Not Found
- Ensure the file exists in `src/sentence/` directory
- Check the filename format: `YYYYMMDD.txt`
- Verify the file is included in the build (check `angular.json` assets)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ❤️ for English learners worldwide