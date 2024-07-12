import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import credentials from "./credentials.json" assert { type: "json" };
import { MongoClient } from "mongodb";
const URL = "https://www.nmmc.gov.in/navimumbai/";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
let status;
const jwt = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

const client = await MongoClient.connect(credentials.mongoDB_connection_string);
console.log("Connected to db");
const db = client.db("Data").collection("logs");

const doc = new GoogleSpreadsheet(credentials.sheetURL, jwt);

async function findLastRecord() {
  let query = await db.find({}).toArray();
  let object = query[query.length - 1];
  return object;
}

async function addData(status, code) {
  await db.insertOne({
    url: URL,
    "status code": code,
    status: status,
    date: new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
    time: new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
    timestamp: Date.now(),
  });
}

async function updateSheet() {
  let object = await findLastRecord();
  let downLogArray = await db.find({ status: "Website is down" }).toArray();
  let [hours, minutes] = [0, 0];
  let seconds = 0;
  if (downLogArray.length > 0 && object.status === "Website is up") {
    let sec =
      (object.timestamp - downLogArray[downLogArray.length - 1].timestamp) /
      1000;
    for (let i = 1; i <= sec; i++) {
      seconds++;
      if (seconds > 59) {
        minutes++;
        seconds = 0;
      }
      if (minutes > 59) {
        hours++;
        minutes = 0;
      }
    }
  }
  await doc.sheetsByIndex[0].addRow({
    URL: object.url,
    "Status Code": object["status code"],
    Status: object.status,
    Date: object.date,
    Time: object.time,
    Downtime: `${
      object.status === "Website is up"
        ? `${hours < 10 ? `0${hours}` : hours}: ${
            minutes < 10 ? `0${minutes}` : minutes
          }:${seconds < 10 ? `0${seconds}` : seconds}`
        : ""
    }`,
  });
}
async function ping() {
  await doc.loadInfo();
  let object = await findLastRecord();
  try {
    let request = await fetch(URL);
    status = "Website is up";
    if (!object || status !== object.status) {
      await addData(status, request.status);
      updateSheet();
    }
  } catch (error) {
    status = "Website is down";
    if (!object || status !== object.status) {
      await addData(status, "000");
      updateSheet();
    }
  }
}
setInterval(ping, 30000);
