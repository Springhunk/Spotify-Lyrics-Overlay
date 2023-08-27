const fs = require("fs");
const path = require("path");
const axios = require("axios");

const { getCurrentlyPlayingTrack, getCurrentTrackTime }  = require("./spotifyFetchTrack.js");
const { spotifyApi } = require("./spotifyAuth.js");


const getCurrentLyrics = async () => {
    try {
        const currentTrack = await getCurrentlyPlayingTrack(spotifyApi);
        const trackLink = currentTrack.item.external_urls.spotify;
    
        const response = await axios.get(`https://spotify-lyric-api.herokuapp.com/?url=${trackLink}`)    
        const lyrics = response.data;

        const playbackTime = await getCurrentTrackTime(spotifyApi);

        // console.log(lyrics);
        console.log(playbackTime.progress_ms);

        const filePath = path.join(__dirname, "../lyrics.json");
        fs.writeFileSync(filePath, JSON.stringify(lyrics, null, 2));
    } catch {
        console.log("Error fetching lyrics, please try again.");
    };
}

module.exports = { getCurrentLyrics };