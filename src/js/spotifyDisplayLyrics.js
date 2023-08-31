const path = require("path");
const fs = require("fs");

const SpotifyWebApi = require("spotify-web-api-node");
const { spotifyApi } = require("./spotifyAuth");

const { getCurrentlyPlayingTrack ,getCurrentTrackProgress } = require("./spotifyFetchTrack");
const { getCurrentLyrics } = require("./spotifyFetchLyrics");

let lyricsJson = null;

const loadLyrics = async () => {
    await getCurrentLyrics();
    
    lyricsJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../lyrics.json")))["lines"];
};

const delay = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async () => {
    await loadLyrics();
    let offset = 500;
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
                await loadLyrics();
            }
            
            previousTrack = currentTrack;
        } catch (error) {
            console.error("Error:", error);
        }
    };

    let previousIndex = 0;

    const syncLyrics = (trackProgress, lyrics) => {
        let lyricsIndex = 0;

        lyrics.forEach((line) => {
            const lineStartTime = parseInt(line.startTimeMs);
            const lowerBound = trackProgress - offset;
            const upperBound = trackProgress + offset;
            lyricsIndex++;

            if (lineStartTime >= lowerBound && lineStartTime <= upperBound) {
                if (previousIndex != lyricsIndex) { ;
                    console.log("Index: "+ lyricsIndex);
                    console.log("Current Line: "+ line.words);
                    let linesToShow = lyricsJson.slice(lyricsIndex, lyricsIndex+4);
                    linesToShow.forEach((line) => {
                        console.log(line.words);
                    });
                    previousIndex = lyricsIndex;
                }
            };
        });

    };

    while (true) {
        let playbackStatePlaying = await checkPlaybackState();

        if (playbackStatePlaying) {
            let trackProgress = await getCurrentTrackProgress(spotifyApi);
            syncLyrics(trackProgress, lyricsJson);
            await detectNewSong(spotifyApi)

            if (trackProgress === null) {
                console.log("Track paused");
                isPaused = true;
            } else {
                isPaused = false;
            };
        } else {

        };
        // 500 usually
        await delay(250);

        if (isPaused) {
            console.log("Loop paused");
            continue;
        };
    };
};

run();