# Shorts Counter

A Chrome extension that tracks your YouTube Shorts watching habits with a beautiful Liquid Glass UI.

## Features

- 📊 Track time spent watching YouTube Shorts
- 🎯 Set daily time limits with visual progress indicators
- 🎨 Beautiful Liquid Glass / Aurora themed UI
- 📈 View detailed statistics in the Dashboard
- ⚙️ Configurable overlay and experimental UI modes

## Structure

- `extension/` - Chrome Extension (Vite + React + TypeScript)
- `shorts-tracker/` - Next.js companion web app

## Development

### Extension

```bash
cd extension
npm install
npm run dev
```

To build for production:
```bash
npm run build
```

Then load the `extension/dist` folder as an unpacked extension in Chrome.

### Web App

```bash
cd shorts-tracker
npm install
npm run dev
```

## License

MIT
