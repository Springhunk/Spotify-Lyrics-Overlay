const SpotifyWebApi = require("spotify-web-api-node");
const express = require("express");
const fs = require("fs");

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

const { getCurrentlyPlayingTrack }  = require("./spotifyFetchTrack.js");

const spotifyApi= new SpotifyWebApi({
    clientId: clientID,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

if (process.env.SPOTIFY_ACCESS_TOKEN != null) {
    spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
}

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
