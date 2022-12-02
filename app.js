const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error is ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API1
//Returns a list of all states in the state table
const convertToResponseAPI1 = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};
app.get("/states/", async (request, response) => {
  const statesDetails = `select * from state`;
  const statesDetailsQuery = await db.all(statesDetails);
  response.send(
    statesDetailsQuery.map((eachState) => convertToResponseAPI1(eachState))
  );
});

//API2
//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateDetails = `select * from state where state_id = ${stateId}`;
  const stateDetailsQuery = await db.get(stateDetails);
  response.send(convertToResponseAPI1(stateDetailsQuery));
});

//API3
//Create a district in the district table, `district_id` is auto-incremented

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtsDetails = `insert into district (district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  const districtsDetailsQuery = await db.run(districtsDetails);
  response.send("District Successfully Added");
});

//API4
//Returns a district based on the district ID

const convertToResponseAPI4 = (object) => {
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

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = `select * from district where district_id = ${districtId}`;
  const districtDetailsQuery = await db.get(districtDetails);
  response.send(convertToResponseAPI4(districtDetailsQuery));
});

//API5
//Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedDistrictDetails = `delete from district where district_id = ${districtId}`;
  const deletedDistrictDetailsQuery = await db.run(deletedDistrictDetails);
  response.send("District Removed");
});

//API6
//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updatedDistrict = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId}`;
  const updatedDistrictQuery = await db.run(updatedDistrict);
  response.send("District Details Updated");
});

//API7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetails = `select sum(cases) as totalCases,sum(cured) as totalCured,
    sum(active) as totalActive,sum(deaths) as totalDeaths from district where state_id = ${stateId}`;
  const getStateDetailsQuery = await db.get(getStateDetails);
  response.send(getStateDetailsQuery);
});

//API8
//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdByDistrictId = `select state_id  from district where district_id = ${districtId}`;
  const getStateIdByDistrictIdQuery = await db.get(getStateIdByDistrictId);
  const getDistrictDetails = `select state_name as stateName from state 
    where state_id = ${getStateIdByDistrictIdQuery.state_id};`;
  const getDistrictDetailsQuery = await db.get(getDistrictDetails);
  response.send(getDistrictDetailsQuery);
});
module.exports = app;
