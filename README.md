# ESU ROCKET LEAGUE OVERLAY & SCOREBOARD 

## Overview
This is a web-based Rocket League overlay and scoreboard made to replace Rocket League's own in-game spectator overlay. It is based off the [SOS Overlay System](https://gitlab.com/bakkesplugins/sos) which creates a websocket for Rocket League to connect and send data to so that it can be displayed in real-time through the overlay.

## Pre-reqs
To get started, open a command prompt/powershell and type `node -v` to check if you have node installed. If it is not installed go to https://nodejs.org/en/ to download it so you can continue with setup. Next make sure to download [BakkesMod](https://bakkesmod.com/) as this will be what allows the in-game data to be displayed on the browser.

Also if you made it this far without doing so, download Rocket League...

## Setup
First things first, go to https://github.com/jon-valencia/ESU-RL-Overlay and download the ENTIRE repository. From there you will want to make sure that you have Rocket League and BakkesMod running and then you can go to where you downloaded the repository and open the folder named *sos-ws-relay-master*. From there open a command prompt/powershell (Shift+RClick anywhere in the folder) and type `node ws-relay.js` and press enter until you have connected to Rocket League (example below).
```
PS C:\ESU-RL-Overlay\sos-ws-relay-master> node ws-relay.js
prompt: Relay delay in milliseconds (used in cloud productions):  (0)
prompt: Port number for this websocket server:  (49322)
prompt: Hostname:Port that Rocket League is running on:  (localhost:49122)
 INFO  Opened WebSocket server on port 49322
 SUCCESS  Connected to Rocket League on localhost:49122
 LOG  0> Sent sos:version
```

After connecting to Rocket League, you can go back to the *ESU-RL-Overlay* folder and open up the overlay (and scoreboard) HTML files and start a custom game to verify that it is functioning. After verifying functionality, you can then set it up in your broadcasting software of choice as a browser source.
