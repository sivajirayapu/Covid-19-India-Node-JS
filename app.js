const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000");
    });
  } catch (e) {
    console.log(`db error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1 get all states

const convertToDbResponse = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertToDbResponseDistrict = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const query = `SELECT * FROM state;`;
  const dbResponse = await database.all(query);
  response.send(dbResponse.map((eachState) => convertToDbResponse(eachState)));
});

// API 2 specified stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const dbResponse = await database.get(query);
  response.send(convertToDbResponse(dbResponse));
});

//API  3 create new state

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const dbResponse = await database.run(query);
  response.send("District Successfully Added");
});

// API 4 specified district id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbResponse = await database.get(query);
  response.send(convertToDbResponseDistrict(dbResponse));
});

// API 5 delete district id from district table

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(query);
  response.send("District Removed");
});

//API 6 update the specified districtId

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `UPDATE district SET district_name = '${districtName}', state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths};`;
  const dbResponse = await database.run(query);
  response.send("District Details Updated");
});

// API 7 return statistics of specific districtId
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) FROM district WHERE state_id = ${stateId};`;
  const stats = await database.get(query);
  //   console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// API 8 return stateName of specified

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query1 = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const specifiedDistrict = await database.get(query1);

  const query2 = `SELECT state_name FROM state WHERE state_id = ${specifiedDistrict.state_id};`;
  const result = await database.get(query2);

  response.send(convertToDbResponse(result));
});

module.exports = app;
