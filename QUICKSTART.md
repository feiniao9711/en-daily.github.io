# ⚡ Quick Start Guide

Get the English Daily Practice app running in 5 minutes!

## 🎯 For Developers

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm start
```

### 3. Open Browser
Navigate to `http://localhost:4200`

That's it! The app is now running locally.

## 🌐 For GitHub Pages Deployment

### Quick Deploy
```bash
# Build for production
npm run build:prod

# The output will be in dist/en-daily/
# Copy these files to your GitHub Pages repository
```

## 📝 Adding Today's Sentences

1. Create a file: `src/sentence/YYYYMMDD.txt`
   - Example: `src/sentence/20260430.txt`

2. Add sentences (one per line):
```text
Hello, how are you today?
I am learning English pronunciation.
Practice makes perfect.
```

3. Restart the dev server or rebuild

## 🎤 Testing the App

1. Click "Start Today's Practice"
2. Click "Listen" to hear the sentence
3. Click "Start Recording" and speak
4. Click "Stop & Submit" to see your score
5. Click "Next Sentence" to continue

## ⚠️ Important Notes

- **Use Chrome browser** for best compatibility
- **Allow microphone access** when prompted
- **Speak clearly** for better recognition
- **Internet required** for speech recognition

## 🔧 Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build:prod

# Run tests
npm test

# Check for updates
npm outdated
```

## 📱 Mobile Testing

To test on mobile devices:

1. Find your local IP address:
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

2. Start the server:
```bash
npm start
```

3. Access from mobile:
```
http://YOUR_IP_ADDRESS:4200
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 4200 in use | Run `ng serve --port 4201` |
| Microphone not working | Check browser permissions |
| Speech recognition fails | Use Chrome, check internet |
| Sentence file not found | Check filename format: YYYYMMDD.txt |

## 📚 Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guide
- Customize styles in `src/app/app.component.scss`
- Add more sentences in `src/sentence/` directory

## 💡 Pro Tips

1. **Daily Updates**: Create sentence files in advance for the whole week
2. **Difficulty Levels**: Use shorter sentences for beginners, longer for advanced
3. **Themes**: Group sentences by topic (greetings, business, travel, etc.)
4. **Backup**: Keep sentence files in a separate repository

---

Need help? Check the full [README.md](README.md) or open an issue on GitHub!