// db-client.js
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DBNAME || "bndlabs_db";

if (!uri) {
  throw new Error("❌ MONGODB_URI is missing in .env");
}

let client;
let db;

export async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  db = client.db(dbName);

  console.log("🔥 Connected to MongoDB Atlas:", dbName);
  return db;
}

export function getCollection(name) {
  if (!db) throw new Error("❌ Database not initialized. Call connectDB() first.");
  return db.collection(name);
}

export async function closeDB() {
  if (client) await client.close();
  db = null;
}
