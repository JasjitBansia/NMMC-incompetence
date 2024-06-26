import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import credentials from "./credentials.json" assert { type: "json" };
let logged = false;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const jwt = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(credentials.sheetURL, jwt);

async function ping() {
  await doc.loadInfo();
  try {
    let request = await fetch("https://www.nmmc.gov.in/navimumbai/");
    if (logged === false) {
      await doc.sheetsByIndex[0].addRow({
        URL: "https://www.nmmc.gov.in/navimumbai/",
        "Status Code": request.status,
        Status: "Website is up",
        Date: new Date().toLocaleDateString(),
        Time: new Date().toLocaleTimeString(),
      });
      logged = true;
    }
  } catch (error) {
    if (logged === true) {
      await doc.sheetsByIndex[0].addRow({
        URL: "https://www.nmmc.gov.in/navimumbai/",
        "Status Code": 0,
        Status: "Website is down",
        Date: new Date().toLocaleDateString(),
        Time: new Date().toLocaleTimeString(),
      });
      logged = false;
    }
  }
}
setInterval(ping, 30000);
setInterval(() => {
  logged = false;
}, 86400000);
