import { createTestDB } from "@tymber/<%= db %>";
import { type BaseTestContext, createTestApp } from "@tymber/core";
<% if (modules.includes("admin")) { %>
import { AdminModule, initTestDB } from "@tymber/admin";
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
import { MainModule } from "../src/module.js";

export interface TestContext extends BaseTestContext {}

export async function setup(): Promise<TestContext> {
  const ctx = await createTestApp(() => createTestDB(), [
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
  ]);

  <% if (modules.includes("admin")) { %>
  const { adminSessionId, adminUserId } = await initTestDB(ctx.db);
  <% } %>
  <% if (modules.includes("config")) { %>
  process.env.CONFIG_SECRET_KEYS = "S3cr3T";
  <% } %>

  return {
    ...ctx,
  };
}
