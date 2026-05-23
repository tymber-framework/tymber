import { App } from "@tymber/core";
<% if (db === "postgres") { %>
import { PostgresDB } from "@tymber/postgres";
import * as pg from "pg";
<% } %>
<% if (db === "sqlite") { %>
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { SQLiteDB } from "@tymber/sqlite";
<% } %>
<% if (modules.includes("admin")) { %>
import { AdminModule } from "@tymber/admin";
<% } %>
<% if (modules.includes("config")) { %>
import { ConfigModule } from "@tymber/config";
<% } %>
<% if (modules.includes("openapi")) { %>
import { OpenApiModule } from "@tymber/openapi";
<% } %>
<% if (modules.includes("user")) { %>
import { UserModule } from "@tymber/user";
<% } %>
import { MainModule } from "./module.js";

<% if (db === "postgres") { %>
const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);
<% } %>
<% if (db === "sqlite") { %>
const dbFile = await open({
  filename: "/tmp/<%= projectName %>.db",
  driver: sqlite3.Database,
});

const db = new SQLiteDB(dbFile);
<% } %>

const app = await App.create({
  components: [db],
  modules: [
    <% if (modules.includes("admin")) { %>
    AdminModule,
    <% } %>
    <% if (modules.includes("config")) { %>
    ConfigModule,
    <% } %>
    <% if (modules.includes("openapi")) { %>
    OpenApiModule,
    <% } %>
    <% if (modules.includes("user")) { %>
    UserModule,
    <% } %>
    MainModule
  ],
});

export default {
  port: 8080,
  fetch: app.fetch,
};
