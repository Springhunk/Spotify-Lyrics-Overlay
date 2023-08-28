const fs = require("fs");
const path = require("path");
const axios = require("axios");

const { getCurrentlyPlayingTrack }  = require("./spotifyFetchTrack.js");
const { spotifyApi } = require("./spotifyAuth.js");


const getCurrentLyrics = async () => {
    try {
        const currentTrack = await getCurrentlyPlayingTrack(spotifyApi);
        const trackLink = currentTrack.item.external_urls.spotify;
    
        const response = await axios.get(`https://spotify-lyric-api.herokuapp.com/?url=${trackLink}`)    
        const lyrics = response.data;

        const filePath = path.join(__dirname, "../lyrics.json");
        await fs.promises.writeFile(filePath, JSON.stringify(lyrics, null, 2));
    } catch {
        console.log("Error fetching lyrics, please try again.");
    };
}

module.exports = { getCurrentLyrics };