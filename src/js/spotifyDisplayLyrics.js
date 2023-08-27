const path = require("path");
const fs = require("fs");

const { getCurrentLyrics } = require("./spotifyFetchLyrics");
const { getCurrentlyPlayingTrack, getCurrentTrackTime }  = require("./spotifyFetchTrack.js");

const loadLyrics = async () => {
    getCurrentLyrics();
    
    const lyricsJson = fs.readFileSync(path.join(__dirname, "../lyrics.json"));
    console.log(JSON.parse(lyricsJson));
    const playbackTime = await getCurrentTrackTime(spotifyApi);
}

loadLyrics();