const { app, BrowserWindow, ipcRenderer, ipcMain } = require('electron');
const path = require("path");
const fs = require("fs");

const { spotifyApi } = require("./js/spotifyAuth");

const { getCurrentlyPlayingTrack, getCurrentTrackProgress } = require("./js/spotifyFetchTrack");
const { getCurrentLyrics } = require("./js/spotifyFetchLyrics");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

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

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setAlwaysOnTop(true, "floating");

  run();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
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
        if (previousIndex != lyricsIndex) {
          let lyricsToDisplay = [line.words];
          // displayLyricsOnWindow(line.words); // Emit the event
          console.log("Index: " + lyricsIndex);
          console.log("Current Line: " + line.words);
          let linesToShow = lyricsJson.slice(lyricsIndex, lyricsIndex + 4);
          linesToShow.forEach((line) => {
            lyricsToDisplay.push(line.words);
            console.log(line.words);
          });
          displayLyricsOnWindow(lyricsToDisplay);
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