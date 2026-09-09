import path from "path";
import dotenv from "dotenv";
import Server from "./models/server";

// PM2 a menudo arranca con otro cwd; cargar .env junto al proyecto (../ desde dist/).
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const server = new Server();
  server.start();
}

main();
