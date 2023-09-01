// Track Progress
const getCurrentTrackProgress = async (spotifyApi) => {
    try {
        const playbackState = await spotifyApi.getMyCurrentPlaybackState();
        if (playbackState.body.is_playing) {
            const progressMs = playbackState.body.progress_ms;
            // console.log('Current track progress:', progressMs, 'milliseconds');
            return progressMs;
        } else {
            console.log('No track is currently playing.');
            return null;
        }
    } catch (error) {
        console.error('Error getting current track progress:', error.message);
    };
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
    getCurrentTrackProgress,
};