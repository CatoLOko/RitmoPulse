# 🎸 Project Pulse — Rhythm Game

A 2D browser-based rhythm game inspired by **Guitar Hero** and **Rift of the Necrodancer**, built with [Phaser 3](https://phaser.io/).

## 🎮 Play

👉 **[Play on GitHub Pages](https://sl101.github.io/RitmoPulse/)** *(update URL after enabling Pages)*

## ✨ Features

- **4-lane note highway** with downward scrolling (Guitar Hero style)
- **Tap & Sustain notes** with hold mechanics
- **Precision judgment system**: Perfect / Great / Good / Miss
- **Combo multiplier**: 1x → 2x → 4x → 8x
- **Health bar**: miss too many notes and it's Game Over!
- **Full scoring system** with S/A/B/C/D/F rankings
- **Particle effects** and visual feedback on hits
- **Neon/synthwave aesthetic** with procedurally generated graphics
- **No build tools required** — pure static HTML/JS

## 🎵 Songs

| Song | Artist | BPM | Difficulty |
|------|--------|-----|------------|
| Neon Pulse | Project Pulse OST | 120 | ★★☆☆☆ |
| ...And Justice for All | Metallica | 104 | ★★★★☆ |

## 🎹 Controls

| Key | Action |
|-----|--------|
| ← / A | Left lane |
| ↓ / S | Down lane |
| ↑ / W | Up lane |
| → / D | Right lane |
| Enter | Select / Confirm |
| ESC | Pause / Back |

## 🚀 Deploy on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch**
4. Select **main** branch, root folder `/`
5. Click **Save** — your game will be live in ~1 minute!

## 🏗️ Project Structure

```
RitmoPulse/
├── index.html          # Entry point
├── style.css           # Page styles
├── src/
│   ├── main.js         # Phaser game config
│   ├── config.js       # Game constants
│   ├── scenes/         # Game scenes (Splash, Menu, Game, etc.)
│   ├── systems/        # Core systems (Audio, Input, Scoring, Notes)
│   └── ui/             # HUD and UI components
├── data/
│   ├── songlist.json   # Song registry
│   └── charts/         # Note chart files (JSON)
└── assets/
    └── songs/          # Audio files (MP3/OGG)
```

## 📝 Adding New Songs

1. Place your audio file in `assets/songs/`
2. Create a chart JSON in `data/charts/` with this format:
```json
{
  "song": "Song Name",
  "bpm": 120,
  "notes": [
    { "time": 1500, "lane": 0, "type": "tap" },
    { "time": 2000, "lane": 2, "type": "sustain", "duration": 500 }
  ]
}
```
3. Register it in `data/songlist.json`

## 🛠️ Tech Stack

- **Phaser 3** (v3.80.1) via CDN
- **Web Audio API** for precise audio synchronization
- **Vanilla JavaScript** (ES6 modules)
- **No build tools** — works as a static site

---

*Built with ❤️ and 🎸*
