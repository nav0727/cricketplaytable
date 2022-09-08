const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// converting to database

const convertPlayersDbToResObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertPlayersTableDbToResObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayersMatchDbToResObj = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

const conData = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//Get players API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayersDbToResObj(eachPlayer))
  );
});

// Get Player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayersDbToResObj(player));
});

//update player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// get match  API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertPlayersTableDbToResObj(match));
});

//get Player Match details

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayMatchQuery = ` SELECT match_Id,
  match,year 
  FROM match_details NATURAL JOIN player_match_score WHERE  player_match_score.player_id=${playerId};`;

  const matchArray = await database.all(getPlayMatchQuery);
  response.send(matchArray.map((each) => convertPlayersTableDbToResObj(each)));
});

//get all players of Match Id API

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `SELECT * FROM 
        (match_details INNER JOIN player_match_score ON match_details.match_id=player_match_score.match_id )
         AS T INNER JOIN player_details ON T.player_id=player_details.player_id 
         WHERE match_details.match_id=${matchId};`;

  const matchArray = await database.all(getMatchPlayerQuery);
  response.send(matchArray.map((each) => convertPlayersDbToResObj(each)));
});

//get players of Match Scores API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getMatchPlayerQuery = `SELECT 
  player_id as playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM 
  player_details NATURAL JOIN player_match_score  WHERE player_id=${playerId};`;

  const matches = await database.get(getMatchPlayerQuery);
  response.send(matches);
});

module.exports = app;
