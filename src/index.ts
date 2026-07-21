import dotenv from "dotenv";
import Server from "./models/server";

dotenv.config();

async function main() {
  const server = new Server();
  server.start();
}

main();
