const { app, BrowserWindow} = require('electron');
const path = require("path");
const fs = require("fs");

const { spotifyApi, checkToken, replaceToken, timeUntilTokenExpiration } = require("./js/spotifyAuth");

const { getCurrentlyPlayingTrack, getCurrentTrackProgress } = require("./js/spotifyFetchTrack");
const { getCurrentLyrics } = require("./js/spotifyFetchLyrics");

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Window Creation
let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 550,
    height: 350,
    minWidth: 450,
    maxWidth: 700,
    minHeight: 350,
    maxHeight: 350,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    title: "Spotify Lyrics Overlay"
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setAlwaysOnTop(true, "floating");
  
  checkToken();
  run();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


let lyricsJson = null;

const loadLyrics = async () => {
  await getCurrentLyrics();

  let lyricsJsonParse = JSON.parse(fs.readFileSync(path.join(__dirname, "./lyrics.json")));

  if (!lyricsJsonParse["error"]) {
    lyricsJson = lyricsJsonParse["lines"];
  };
};

// Check Availability
const lyricsAvailable = (lyricsJson) => {
  return lyricsJson["error"]; 
};

const displayLyricsOnWindow = (lyrics) => {
  if (mainWindow) {
    mainWindow.webContents.send("update-lyrics", lyrics);
  };
};

const delay = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async () => {
  await loadLyrics();

  // Offset Bounds for Track Progress
  let offset = 500;
  let isPaused = false;

  const checkPlaybackState = async () => {
    const playbackState = await spotifyApi.getMyCurrentPlaybackState()
    return playbackState.body.is_playing;
  };

  let previousTrack = null;

  // Detect New Song
  const detectNewSong = async (spotifyApi) => {
    try {
      const currentTrack = await getCurrentlyPlayingTrack(spotifyApi);

      if (!previousTrack || currentTrack.item.id !== previousTrack.item.id) {
        const artists = currentTrack.item.artists.map(artist => artist.name).join(", ");

        console.log(`New song is playing: ${currentTrack.item.name} - ${artists}`);
        displayLyricsOnWindow([`${currentTrack.item.name} - ${artists}`, "clear"]);
        await loadLyrics();
      }

      previousTrack = currentTrack;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  let previousIndex = 0;

  // Sync Lyrics
  const syncLyrics = (trackProgress, lyrics) => {
    let lyricsIndex = 0;

    lyrics.forEach((line) => {
      const lineStartTime = parseInt(line.startTimeMs);
      const lowerBound = trackProgress - offset;
      const upperBound = trackProgress + offset;
      lyricsIndex++;

      // Check Bounds
      if (lineStartTime >= lowerBound && lineStartTime <= upperBound) {
        if (previousIndex != lyricsIndex) {
          let lyricsToDisplay = [line.words];
          // console.log("Index: " + lyricsIndex);
          // console.log("Current Line: " + line.words);
          let linesToShow = lyricsJson.slice(lyricsIndex, lyricsIndex + 4);
          linesToShow.forEach((line) => {
            lyricsToDisplay.push(line.words);
            // console.log(line.words);
          });

          // Display
          displayLyricsOnWindow(lyricsToDisplay);
          previousIndex = lyricsIndex;
        }
      };
    });
  };

  while (true) {
    try {
      if (timeUntilTokenExpiration < 100) {
        replaceToken();

        await delay(5000);
      } else {;
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
        }
      };

      await delay(500);

      if (isPaused) {
        console.log("Loop paused");
        continue;
      };
    } catch (error) {
      console.log(error);
      console.log("Retrying...");
      checkToken();

      await delay(5000);
    };
  };
};