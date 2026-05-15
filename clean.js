const fs = require('fs');
const path = require('path');

// 1. Rewrite songlist.json
const songlist = [
  {
    "id": "take-on-me",
    "name": "Take On Me",
    "artist": "A-ha",
    "bpm": 168,
    "difficulty": 3,
    "scrollSpeed": 1.3,
    "chartFile": "data/charts/take-on-me.json",
    "audioFile": "assets/songs/Take On Me.mp3",
    "coverArt": "assets/covers/take-on-me.png"
  },
  {
    "id": "midnight-city",
    "name": "Midnight City",
    "artist": "M83",
    "bpm": 105,
    "difficulty": 3,
    "scrollSpeed": 1.2,
    "chartFile": "data/charts/midnight-city.json",
    "audioFile": "assets/songs/Midnight City.mp3",
    "coverArt": "assets/covers/midnight-city.png"
  },
  {
    "id": "bohemian-rhapsody",
    "name": "Bohemian Rhapsody",
    "artist": "Queen",
    "bpm": 72,
    "difficulty": 4,
    "scrollSpeed": 1.1,
    "chartFile": "data/charts/bohemian-rhapsody.json",
    "audioFile": "assets/songs/Bohemian Rhapsody.mp3",
    "coverArt": "assets/covers/bohemian-rhapsody.png"
  },
  {
    "id": "justice-for-all",
    "name": "...And Justice for All",
    "artist": "Metallica",
    "bpm": 104,
    "difficulty": 4,
    "scrollSpeed": 1.4,
    "chartFile": "data/charts/justice-for-all.json",
    "audioFile": "assets/songs/justice-for-all.mp3",
    "coverArt": "assets/covers/justice-for-all.png"
  },
  {
    "id": "thunderstruck",
    "name": "Thunderstruck",
    "artist": "AC/DC",
    "bpm": 134,
    "difficulty": 5,
    "scrollSpeed": 1.8,
    "chartFile": "data/charts/thunderstruck.json",
    "audioFile": "assets/songs/Thunderstruck.mp3",
    "coverArt": "assets/covers/thunderstruck.png"
  }
];

fs.writeFileSync('data/songlist.json', JSON.stringify(songlist, null, 2));

// 2. Clean up JSON files
const chartsDir = 'data/charts';
const files = fs.readdirSync(chartsDir);

files.forEach(file => {
  if (file.endsWith('.json')) {
    const p = path.join(chartsDir, file);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    if (data.events) {
      data.events = data.events.filter(e => e.type !== 'wobble');
    }
    if (data.notes) {
      data.notes = data.notes.map(n => {
        if (n.type === 'bomb') {
          n.type = 'tap'; // Convert bombs to regular taps
        }
        return n;
      });
    }
    
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
});
console.log('Done!');
