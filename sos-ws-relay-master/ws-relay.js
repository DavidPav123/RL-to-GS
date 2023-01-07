const WebSocket = require("ws");
const prompt = require("prompt");
const fs = require("fs");
const { success, error, warn, info, log, indent } = require("cli-msg");
const atob = require("atob");
let argv = require("minimist")(process.argv);

let fileNum = 0;
let promptsPassed = false;

function addPromptOverrideProperty(key, val) {
  if (!prompt.override) {
    prompt.override = {};
  }
  prompt.override[key] = val;
}

if (argv.hasOwnProperty("delay")) {
  addPromptOverrideProperty("delay", argv.delay);
}
if (argv.hasOwnProperty("port")) {
  addPromptOverrideProperty("port", argv.port);
}
if (argv.hasOwnProperty("rocketLeagueHost")) {
  addPromptOverrideProperty("rocketLeagueHost", argv.rocketLeagueHost);
}

//Add timeout, in case of programmatic usage where a user may not be fully present
if (argv.timeout) {
  let timeoutMs = parseInt(argv.timeout, 10);
  if (timeoutMs > 0) {
    setTimeout(() => {
      if (!promptsPassed) {
        console.error(
          `\n\nPrompts not completed within timeout limit (${timeoutMs}ms). Exiting`
        );
        process.exit(100);
      }
    }, timeoutMs);
  }
}

prompt.get(
  [
    {
      description: "Relay delay in milliseconds (used in cloud productions)",
      pattern: /^\d+$/,
      message: "Must be a number",
      name: "delay",
      required: true,
      default: "0",
    },
    {
      description: "Port number for this websocket server",
      pattern: /^\d+$/,
      message: "Must be a number",
      name: "port",
      required: true,
      default: "49322",
    },
    {
      description: "Hostname:Port that Rocket League is running on",
      name: "rocketLeagueHost",
      required: true,
      default: "localhost:49122",
    },
  ],
  function (e, r) {
    promptsPassed = true;
    /**
     * Rocket League WebSocket client
     * @type {WebSocket}
     */
    let wsClient;
    let relayMsDelay = parseInt(r.delay, 10);

    const wss = new WebSocket.Server({ port: r.port });
    let connections = {};
    info.wb("Opened WebSocket server on port " + r.port);

    wss.on("connection", function connection(ws) {
      let id = (+new Date()).toString();
      success.wb("Received connection: " + id);
      connections[id] = {
        connection: ws,
        registeredFunctions: [],
      };

      ws.send(
        JSON.stringify({
          event: "wsRelay:info",
          data: "Connected!",
        })
      );

      ws.on("message", function incoming(message) {
        sendRelayMessage(id, message);
      });

      ws.on("close", function close() {
        // Might run into race conditions with accessing connections for sending, but cant be arsed to account for this.
        // If a connection closes something will be fucked anyway
        delete connections[id];
      });
    });

    initRocketLeagueWebsocket(r.rocketLeagueHost);
    setInterval(function () {
      if (wsClient.readyState === WebSocket.CLOSED) {
        warn.wb(
          "Rocket League WebSocket Server Closed. Attempting to reconnect"
        );
        initRocketLeagueWebsocket(r.rocketLeagueHost);
      }
    }, 10000);

    function sendRelayMessage(senderConnectionId, message) {
      let json = JSON.parse(message);

      //Detect if something happens
      if (json.event == "game:update_state") {
        //Wirte to a file and save it in the current directory
        var stream = fs.createWriteStream(
          `game${fileNum}.json`
        );
        stream.once("open", function (fd) {
          stream.write(message);
          stream.end();
        });
      } else if (json.event == "game:match_ended") {
        fileNum++;
      }

      log.wb(senderConnectionId + "> Sent " + json.event);
      let channelEvent = json["event"].split(":");
      if (channelEvent[0] === "wsRelay") {
        if (channelEvent[1] === "register") {
          if (
            connections[senderConnectionId].registeredFunctions.indexOf(
              json["data"]
            ) < 0
          ) {
            connections[senderConnectionId].registeredFunctions.push(
              json["data"]
            );
            info.wb(
              senderConnectionId + "> Registered to receive: " + json["data"]
            );
          } else {
            warn.wb(
              senderConnectionId +
                "> Attempted to register an already registered function: " +
                json["data"]
            );
          }
        } else if (channelEvent[1] === "unregister") {
          let idx = connections[senderConnectionId].registeredFunctions.indexOf(
            json["data"]
          );
          if (idx > -1) {
            connections[senderConnectionId].registeredFunctions.splice(idx, 1);
            info.wb(senderConnectionId + "> Unregistered: " + json["data"]);
          } else {
            warn.wb(
              senderConnectionId +
                "> Attempted to unregister a non-registered function: " +
                json["data"]
            );
          }
        }
        return;
      }
      for (let k in connections) {
        if (senderConnectionId === k) {
          continue;
        }
        if (!connections.hasOwnProperty(k)) {
          continue;
        }
        if (connections[k].registeredFunctions.indexOf(json["event"]) > -1) {
          setTimeout(() => {
            try {
              connections[k].connection.send(message);
            } catch (e) {
              //The connection can close between the exist check, and sending, so we catch it here and ignore
            }
          }, 0);
        }
      }
    }

    function initRocketLeagueWebsocket(rocketLeagueHost) {
      wsClient = new WebSocket("ws://" + rocketLeagueHost);

      wsClient.onopen = function open() {
        success.wb("Connected to Rocket League on " + rocketLeagueHost);
      };
      wsClient.onmessage = function (message) {
        let sendMessage = message.data;
        if (sendMessage.substr(0, 1) !== "{") {
          sendMessage = atob(message.data);
        }
        setTimeout(() => {
          sendRelayMessage(0, sendMessage);
        }, relayMsDelay);
      };
      wsClient.onerror = function (err) {
        error.wb(
          `Error connecting to Rocket League on host "${rocketLeagueHost}"\nIs the plugin loaded into Rocket League? Run the command "plugin load sos" from the BakkesMod console to make sure`
        );
      };
    }
  }
);

function getValues() {
  const file = fs.readFileSync("../scoreboard.html", "utf8");
  const doc = new jsdom.JSDOM(file);

  const blueScore = doc.window.document.getElementById("blueScore").innerHTML;
  const orangeScore =
    doc.window.document.getElementById("orangeScore").innerHTML;

  const blueName1 = doc.window.document.getElementById("bluePlayer1").innerHTML;
  const blueName2 = doc.window.document.getElementById("bluePlayer2").innerHTML;
  const blueName0 = doc.window.document.getElementById("bluePlayer0").innerHTML;
  const orangeName1 =
    doc.window.document.getElementById("orangePlayer1").innerHTML;
  const orangeName2 =
    doc.window.document.getElementById("orangePlayer2").innerHTML;
  const orangeName0 =
    doc.window.document.getElementById("orangePlayer0").innerHTML;

  const blueScore0 = doc.window.document.getElementById("blueScore0").innerHTML;
  const blueScore1 = doc.window.document.getElementById("blueScore1").innerHTML;
  const blueScore2 = doc.window.document.getElementById("blueScore2").innerHTML;
  const orangeScore0 =
    doc.window.document.getElementById("orangeScore0").innerHTML;
  const orangeScore1 =
    doc.window.document.getElementById("orangeScore1").innerHTML;
  const orangeScore2 =
    doc.window.document.getElementById("orangeScore2").innerHTML;

  const blueGoals0 = doc.window.document.getElementById("blueGoals0").innerHTML;
  const blueGoals1 = doc.window.document.getElementById("blueGoals1").innerHTML;
  const blueGoals2 = doc.window.document.getElementById("blueGoals2").innerHTML;
  const orangeGoals0 =
    doc.window.document.getElementById("orangeGoals0").innerHTML;
  const orangeGoals1 =
    doc.window.document.getElementById("orangeGoals1").innerHTML;
  const orangeGoals2 =
    doc.window.document.getElementById("orangeGoals2").innerHTML;

  const blueAsst0 = doc.window.document.getElementById("blueAsst0").innerHTML;
  const blueAsst1 = doc.window.document.getElementById("blueAsst1").innerHTML;
  const blueAsst2 = doc.window.document.getElementById("blueAsst2").innerHTML;
  const orangeAsst0 =
    doc.window.document.getElementById("orangeAsst0").innerHTML;
  const orangeAsst1 =
    doc.window.document.getElementById("orangeAsst1").innerHTML;
  const orangeAsst2 =
    doc.window.document.getElementById("orangeAsst2").innerHTML;

  const blueSaves0 = doc.window.document.getElementById("blueSaves0").innerHTML;
  const blueSaves1 = doc.window.document.getElementById("blueSaves1").innerHTML;
  const blueSaves2 = doc.window.document.getElementById("blueSaves2").innerHTML;
  const orangeSaves0 =
    doc.window.document.getElementById("orangeSaves0").innerHTML;
  const orangeSaves1 =
    doc.window.document.getElementById("orangeSaves1").innerHTML;
  const orangeSaves2 =
    doc.window.document.getElementById("orangeSaves2").innerHTML;

  const blueShots0 = doc.window.document.getElementById("blueShots0").innerHTML;
  const blueShots1 = doc.window.document.getElementById("blueShots1").innerHTML;
  const blueShots2 = doc.window.document.getElementById("blueShots2").innerHTML;
  const orangeShots0 =
    doc.window.document.getElementById("orangeShots0").innerHTML;
  const orangeShots1 =
    doc.window.document.getElementById("orangeShots1").innerHTML;
  const orangeShots2 =
    doc.window.document.getElementById("orangeShots2").innerHTML;

  const blueDemos0 = doc.window.document.getElementById("blueDemos0").innerHTML;
  const blueDemos1 = doc.window.document.getElementById("blueDemos1").innerHTML;
  const blueDemos2 = doc.window.document.getElementById("blueDemos2").innerHTML;
  const orangeDemos0 =
    doc.window.document.getElementById("orangeDemos0").innerHTML;
  const orangeDemos1 =
    doc.window.document.getElementById("orangeDemos1").innerHTML;
  const orangeDemos2 =
    doc.window.document.getElementById("orangeDemos2").innerHTML;

  //Put all of the above variables into a array and return it
  var valueArr = [
    blueScore,
    orangeScore,
    blueName1,
    blueName2,
    blueName0,
    orangeName1,
    orangeName2,
    orangeName0,
    blueScore0,
    blueScore1,
    blueScore2,
    orangeScore0,
    orangeScore1,
    orangeScore2,
    blueGoals0,
    blueGoals1,
    blueGoals2,
    orangeGoals0,
    orangeGoals1,
    orangeGoals2,
    blueAsst0,
    blueAsst1,
    blueAsst2,
    orangeAsst0,
    orangeAsst1,
    orangeAsst2,
    blueSaves0,
    blueSaves1,
    blueSaves2,
    orangeSaves0,
    orangeSaves1,
    orangeSaves2,
    blueShots0,
    blueShots1,
    blueShots2,
    orangeShots0,
    orangeShots1,
    orangeShots2,
    blueDemos0,
    blueDemos1,
    blueDemos2,
    orangeDemos0,
    orangeDemos1,
    orangeDemos2,
  ];
  return valueArr.toString();
}
