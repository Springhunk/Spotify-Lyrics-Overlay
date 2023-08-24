const SpotifyWebApi = require("spotify-web-api-node");

const getCurrentlyPlayingTrack = (spotifyApi) => {
    return spotifyApi.getMyCurrentPlayingTrack()
        .then((data) => {
            // console.log("Playing " + JSON.stringify(data.body, null, 2));
            return data.body;
        })
        .catch(() => {

        });
}

module.exports = {
    getCurrentlyPlayingTrack
};