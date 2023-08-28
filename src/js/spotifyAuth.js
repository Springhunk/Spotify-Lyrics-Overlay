const SpotifyWebApi = require("spotify-web-api-node");
const express = require("express");

const fs = require("fs");
const path = require("path");
const rrl = require("read-last-lines");

PORT = 8000

require("dotenv").config();

const clientID = process.env.SPOTIFY_API_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const redirectUri = "http://localhost:8000/callback";

scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing"
];

const envPath = path.join(__dirname, "../../.env");

const app = express();

const spotifyApi= new SpotifyWebApi({
    clientId: clientID,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

const totalTimeElapsed = (time = new Date().toISOString()) => {
    const date = new Date(time);

    const hour = date.getHours()
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const totalSeconds = hour * 3600 + minutes * 60 + seconds;
    return totalSeconds;
};

if (process.env.SPOTIFY_ACCESS_TOKEN != null) {

    const fileMTime = fs.statSync(envPath).mtime;

    const totalSecondsAfterModified = totalTimeElapsed(fileMTime);
    const expirationTime = totalSecondsAfterModified + 3600;

    const currentTime = totalTimeElapsed()

    if (currentTime >= expirationTime) {
        console.log("Token is expired.");

        rrl.read(envPath, 2).then((lines) => {
            let to_remove = lines.length;
            fs.stat(envPath, (err, stats) => {
                if (err) console.log(err);
                fs.truncate(envPath, stats.size - to_remove, (err) => {
                    if (err) console.log(err)
                });
            });
        });
    } else {
        console.log("Token is available");
        spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
    };
} else {
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + `http://localhost:${PORT}/login`);
};

app.get("/login", (req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes)
    res.redirect(authorizeURL);
});

app.get("/callback", async (req, res) => {
    const authCode = req.query.code;

    if (spotifyApi.getAccessToken()) {
        res.redirect("/close");
    } else {;
        try {
            const data = await spotifyApi.authorizationCodeGrant(authCode);

            const accessToken = data.body["access_token"];
            const refreshToken = data.body["refresh_token"];

            spotifyApi.setAccessToken(accessToken);
            spotifyApi.setRefreshToken(refreshToken);

            fs.writeFileSync('.env', `\nSPOTIFY_ACCESS_TOKEN=${accessToken}\nSPOTIFY_REFRESH_TOKEN=${refreshToken}`, { flag: 'a' });

            res.redirect("/close");
        } catch (err) {
            console.error("Error exchanging auth-code for tokens: ", err);
            res.status(500).send("Error obtaining tokens");
        };
    };
});

app.get("/close", (req, res) => {
    res.sendFile(path.join(__dirname, "../close/close-tab.html"))
});

app.listen(PORT, () => {
    console.log("App listening on PORT 8000")
});

module.exports = { spotifyApi }


