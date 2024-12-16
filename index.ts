import http from "http";
import app from "./app";
import "./database";
import fs from 'fs';
// import { setupWebSocket } from "./controllers/airdrop.controller";
/**
 * Starting our application
 */


const folderName = "./uploads";
try {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
} catch (err) {
  console.error(err);
}

const server = http.createServer(app);
// setupWebSocket(server);
server.listen(app.get("port"), () =>
  console.log(`>> Server is running on ${app.get("port")}`)
);
