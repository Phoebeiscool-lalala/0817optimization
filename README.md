# Global Labor Law Intelligence Dashboard

AI-powered global labor regulatory monitoring system covering 30+ countries.

## Features

- **Real-time Monitoring**: Track labor law updates across 30+ countries
- **Interactive Map**: GeoJSON-based visualization with Leaflet.js
- **Multi-language**: Chinese / English / Spanish UI
- **Smart Filtering**: By region, country, regulation type, and keyword search
- **Dark Mode**: Full dark/light theme support
- **Responsive Design**: Works on desktop and tablet
- **AI Insights**: Auto-generated impact summaries and compliance alerts

## Project Structure

```
├── index.html               # Main entry point (deploy root)
├── data/
│   └── laws.json            # Labor law database (52 entries, 30+ countries)
├── src/
│   ├── styles/
│   │   └── main.css         # All styles (CSS variables, dark mode, responsive)
│   └── scripts/
│       └── app.js           # Application logic (filters, rendering, map, i18n)
├── package.json
├── .gitignore
└── README.md
```

## Quick Start

```bash
# Install dependencies (optional, for local dev server)
npm install

# Start local development server
npm run dev

# Or simply open index.html in your browser
```

## Deployment

### Cloudflare Pages (Recommended - accessible from China)
```bash
npm run deploy:cf
```

### Netlify
Drag and drop the repo root folder to [Netlify Drop](https://app.netlify.com/drop).

### GitHub Pages
Enable GitHub Pages in Settings → Pages → Source: "Deploy from a branch" (main, root).

## Data Format

Laws are stored in `public/data/laws.json` with the following schema per entry:

```json
{
  "id": "au01",
  "country": "Australia",
  "countryCode": "AU",
  "region": "Oceania",
  "flag": "🇦🇺",
  "law": "Fair Work Act 2009 – Modern Awards Update",
  "category": "Working Time",
  "summary": "English summary...",
  "summaryZh": "中文摘要...",
  "status": "effective",
  "effectiveDate": "2026-07-01",
  "lastUpdated": "2026-07-15",
  "source": "https://www.fwc.gov.au",
  "changes": ["..."],
  "hrImpact": ["..."],
  "modules": ["薪酬管理", "工时与加班"]
}
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework dependencies)
- **Map**: Leaflet.js (loaded async, graceful degradation if CDN unavailable)
- **Data**: Static JSON (no backend required)
- **Styling**: CSS Custom Properties for theming

## License

MIT
