const SpotifyWebApi = require("spotify-web-api-node");

const getCurrentTrackTime = (spotifyApi) => {
    return spotifyApi.getMyCurrentPlaybackState()
        .then((data) => {
            console.log(JSON.stringify(data.body, null, 2));
            return data.body;
        })
        .catch(() => {
            console.log("Error getting current playback state.");
        });
};

const getCurrentlyPlayingTrack = (spotifyApi) => {
    return spotifyApi.getMyCurrentPlayingTrack()
        .then((data) => {
            return data.body;
        })
        .catch(() => {
            console.log("Error getting track.");
        });
};

module.exports = {
    getCurrentlyPlayingTrack,
    getCurrentTrackTime
};