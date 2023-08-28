const path = require("path");
const fs = require("fs");

const SpotifyWebApi = require("spotify-web-api-node");
const { spotifyApi } = require("./spotifyAuth");

const { getCurrentlyPlayingTrack ,getCurrentTrackProgress } = require("./spotifyFetchTrack");
const { getCurrentLyrics } = require("./spotifyFetchLyrics");

const loadLyrics = async () => {
    getCurrentLyrics();
    
    const lyricsJson = fs.readFileSync(path.join(__dirname, "../lyrics.json"));
    console.log(JSON.parse(lyricsJson));
};

const delay = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async () => {
    let isPaused = false;
    
    const checkPlaybackState = async () => {
        const playbackState = await spotifyApi.getMyCurrentPlaybackState()
        return playbackState.body.is_playing;
    };

    let previousTrack = null;

    const detectNewSong = async (spotifyApi) => {
        try {
            const currentTrack = await getCurrentlyPlayingTrack(spotifyApi);
            
            if (!previousTrack || currentTrack.item.id !== previousTrack.item.id) {
                const artists = currentTrack.item.artists.map(artist => artist.name).join(", ");
                
                console.log(`New song is playing: ${currentTrack.item.name} - ${artists}`);
            }
            
            previousTrack = currentTrack;
        } catch (error) {
            console.error("Error:", error);
        }
    };

    while (true) {
        let playbackStatePlaying = await checkPlaybackState();

        if (playbackStatePlaying) {
            let trackProgress = await getCurrentTrackProgress(spotifyApi);
            await detectNewSong(spotifyApi)

            if (trackProgress === null) {
                console.log("Track paused");
                isPaused = true;
            } else {
                isPaused = false;
            };
        };
        await delay(1000);

        if (isPaused) {
            console.log("Loop paused");
            continue;
        };
    };
};

run();
loadLyrics();