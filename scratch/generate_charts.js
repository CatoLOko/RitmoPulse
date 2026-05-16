const fs = require('fs');
const path = require('path');

const songlistPath = path.join(__dirname, '../data/songlist.json');
const songlist = JSON.parse(fs.readFileSync(songlistPath, 'utf8'));

const DURATION_MS = 10 * 60 * 1000; // 10 minutes

songlist.forEach(song => {
    const chartPath = path.join(__dirname, '..', song.chartFile);
    let chartData = {
        song: song.name,
        bpm: song.bpm,
        scrollSpeed: song.scrollSpeed,
        events: [],
        notes: []
    };

    if (fs.existsSync(chartPath)) {
        const existingData = JSON.parse(fs.readFileSync(chartPath, 'utf8'));
        // Preserve events, but remove 'mirror'
        if (existingData.events) {
            chartData.events = existingData.events.filter(e => e.type !== 'mirror');
        }
    }

    const msPerBeat = 60000 / song.bpm;
    let time = 3000; // start after 3 seconds

    // Generate notes until DURATION_MS
    let beatCount = 0;
    while (time < DURATION_MS) {
        // Pattern 1: Kick on beat 1 & 3 (lane 0)
        // Pattern 2: Snare on beat 2 & 4 (lane 2)
        // Pattern 3: Hi-hats on half beats (lane 1 or 3)
        
        let lane = 0;
        let type = 'tap';
        let duration = 0;

        const beatInMeasure = beatCount % 4;

        if (beatInMeasure === 0) {
            lane = 0; // Kick
        } else if (beatInMeasure === 2) {
            lane = 2; // Snare
        } else {
            // Hi-hats or other
            lane = (Math.random() > 0.5) ? 1 : 3;
            
            // Occasionally make it a sustain
            if (Math.random() > 0.8) {
                type = 'sustain';
                duration = msPerBeat * 0.8;
            }
        }

        chartData.notes.push({
            time: Math.round(time),
            lane: lane,
            type: type
        });
        if (duration > 0) {
            chartData.notes[chartData.notes.length - 1].duration = Math.round(duration);
        }

        // Add 8th notes occasionally for 'riffs'
        if (Math.random() > 0.7) {
            chartData.notes.push({
                time: Math.round(time + msPerBeat / 2),
                lane: (lane + 1) % 4,
                type: 'tap'
            });
        }

        time += msPerBeat;
        beatCount++;
    }

    fs.writeFileSync(chartPath, JSON.stringify(chartData, null, 2), 'utf8');
    console.log(`Generated chart for ${song.name}: ${chartData.notes.length} notes`);
});
