# 🚀 Deployment Guide for GitHub Pages

This guide will help you deploy the English Daily Practice app to GitHub Pages.

## Prerequisites

- Git installed on your system
- GitHub account
- Node.js and npm installed

## Step 1: Prepare Your Repository

1. Create a new repository on GitHub named `en-daily.github.io` or use your existing one
2. Clone the repository locally if you haven't already

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build for Production

Run the production build command:

```bash
npm run build:prod
```

This will create optimized files in the `dist/en-daily/` directory with the correct base href.

## Step 4: Deploy to GitHub Pages

### Option A: Manual Deployment

1. Copy all files from `dist/en-daily/` to the root of your GitHub Pages repository

2. Ensure the `sentence` folder is included

3. Commit and push:
```bash
git add .
git commit -m "Deploy English Daily Practice app"
git push origin main
```

### Option B: Using gh-pages Package

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add deploy script to `package.json`:
```json
"scripts": {
  "deploy": "ng build --configuration production --base-href /en-daily.github.io/ && npx gh-pages -d dist/en-daily"
}
```

3. Deploy:
```bash
npm run deploy
```

## Step 5: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings**
3. Navigate to **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `gh-pages` (if using gh-pages package) or `main`
   - Folder: `/ (root)`
5. Click **Save**

## Step 6: Access Your App

Your app will be available at:
```
https://feiniao9711.github.io/en-daily.github.io/
```

Note: It may take a few minutes for GitHub Pages to build and deploy your site.

## Adding Daily Sentences

To add new sentences for each day:

1. Create a new file in `src/sentence/` directory
2. Name it with the date format: `YYYYMMDD.txt` (e.g., `20260501.txt`)
3. Add sentences, one per line
4. Rebuild and redeploy:
```bash
npm run build:prod
# Then deploy using your preferred method
```

## Troubleshooting

### 404 Error on Refresh

If you get a 404 error when refreshing the page, this is because GitHub Pages doesn't support client-side routing by default. The app uses hash-based routing which should work fine.

### Assets Not Loading

Ensure the `base href` in the build command matches your repository name:
```bash
ng build --configuration production --base-href /en-daily.github.io/
```

### Sentence Files Not Found

Make sure the `sentence` folder is included in the `assets` array in `angular.json`:
```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  "src/sentence"
]
```

## Continuous Deployment (Optional)

You can set up GitHub Actions for automatic deployment:

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build:prod
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist/en-daily
```

2. Commit and push this file
3. GitHub Actions will automatically deploy on every push to main

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `src/` directory with your domain name
2. Add `"src/CNAME"` to the assets array in `angular.json`
3. Configure your domain's DNS settings to point to GitHub Pages
4. Rebuild and redeploy

## Security Considerations

- The app requires microphone access - ensure users are informed
- Speech Recognition API requires HTTPS (GitHub Pages provides this)
- No sensitive data is stored or transmitted

## Performance Tips

1. **Optimize sentence files**: Keep files small (5-10 sentences per day)
2. **Enable caching**: GitHub Pages automatically caches static assets
3. **Monitor bundle size**: Run `npm run build:prod` and check the output

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are deployed correctly
3. Test in Chrome browser (recommended)
4. Open an issue on GitHub

---

Happy deploying! 🎉