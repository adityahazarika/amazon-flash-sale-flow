import fs from "fs";
import path from "path";

const logFilePath = path.resolve(process.cwd(), "app.log"); 

const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

export function log(message) {
  console.log(message);       // console me
  logStream.write(message + "\n"); // file me
}
