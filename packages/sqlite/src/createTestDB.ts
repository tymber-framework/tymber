import { SQLiteDB } from "./DB.js";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function createTestDB() {
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });
  const testDB = new SQLiteDB(db);

  testDB.close = () => {
    db.close();
  };

  return testDB;
}
