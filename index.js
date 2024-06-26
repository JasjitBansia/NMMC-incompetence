import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import credentials from "./credentials.json" assert { type: "json" };
let logged = false;
let initiallydown = true;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const jwt = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(credentials.sheetURL, jwt);
async function addData(status, code) {
  await doc.sheetsByIndex[0].addRow({
    URL: "https://www.nmmc.gov.in/navimumbai/",
    "Status Code": code,
    Status: `Website is ${status}`,
    Date: new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
    Time: new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
  });
}
async function ping() {
  await doc.loadInfo();
  try {
    let request = await fetch("https://www.nmmc.gov.in/navimumbai/");
    if (logged === false) {
      await addData("up", request.status);
      logged = true;
      initiallydown = false;
    }
  } catch (error) {
    if (logged === true || initiallydown === true) {
      await addData("down", "000");
      logged = false;
      initiallydown = false;
    }
  }
}
setInterval(ping, 30000);
