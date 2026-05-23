import { createTestDB } from "@tymber/<%= db %>";
<% if (modules.includes("admin")) { %>
import {
  type BaseTestContext,
  type AdminUserId,
  createTestApp,
} from "@tymber/core";
import { AdminModule, initTestDB } from "@tymber/admin";
<% } else { %>
import { type BaseTestContext, createTestApp } from "@tymber/core";
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

export interface TestContext extends BaseTestContext {
  <% if (modules.includes("admin")) { %>
  adminSessionId: string;
  adminUserId: AdminUserId;
  <% } %>
}

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
    <% if (modules.includes("admin")) { %>
    adminSessionId,
    adminUserId,
    <% } %>
  };
}
