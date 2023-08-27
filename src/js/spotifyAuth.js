const SpotifyWebApi = require("spotify-web-api-node");
const express = require("express");
const fs = require("fs");
const path = require("path");

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

const app = express();

const spotifyApi= new SpotifyWebApi({
    clientId: clientID,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

if (process.env.SPOTIFY_ACCESS_TOKEN != null) {

    const envPath = path.join(__dirname, "../../.env");
    const fileMTime = fs.statSync(envPath).mtime;

    const date = new Date(fileMTime);

    const hour = date.getHours()
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const totalSecondsAfterModified = hour * 3600 + minutes * 60 + seconds;
    const expirationTime = totalSecondsAfterModified + 3600;

    if (totalSecondsAfterModified >= expirationTime) {
        console.log("Token is expired.");
    } else {
        console.log("Token is available");
        spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
    }
};

app.get("/login", (req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes)
    res.redirect(authorizeURL);
});

app.get("/callback", async (req, res) => {
    const authCode = req.query.code;

    if (spotifyApi.getAccessToken()) {
        res.send("Access token already exists.");
    } else {;
        try {
            const data = await spotifyApi.authorizationCodeGrant(authCode);

            const accessToken = data.body["access_token"];
            const refreshToken = data.body["refresh_token"];

            spotifyApi.setAccessToken(accessToken);
            spotifyApi.setRefreshToken(refreshToken);

            fs.writeFileSync('.env', `\nSPOTIFY_ACCESS_TOKEN=${accessToken}\nSPOTIFY_REFRESH_TOKEN=${refreshToken}`, { flag: 'a' });

            res.send("Successful!")
        } catch (err) {
            console.error("Error exchanging auth-code for tokens: ", err);
            res.status(500).send("Error obtaining tokens");
        }
    }
});

app.listen(PORT, () => {
    console.log("App listening on PORT 8000")
});

module.exports = { spotifyApi }
