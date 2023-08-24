const axios = require("axios");
const { getCurrentlyPlayingTrack }  = require("./spotifyFetchTrack.js");
const { spotifyApi } = require("./spotifyAuth.js");


const getCurrentLyrics = async () => {
    try {
        const currentTrack = await getCurrentlyPlayingTrack(spotifyApi);
        console.log("LOL");
        const trackLink = currentTrack.item.external_urls.spotify;
    
        const response = await axios.get(`https://spotify-lyric-api.herokuapp.com/?url=${trackLink}`)    
        const lyrics = response.data;
        console.log(lyrics)
    } catch {

    }
}

getCurrentLyrics();