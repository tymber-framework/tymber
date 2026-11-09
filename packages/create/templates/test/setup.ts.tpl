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
<% if (modules.includes("log")) { %>
import { LogModule } from "@tymber/log";
<% } %>
<% if (modules.includes("mail")) { %>
import { MailModule, MailProvider, Mail } from "@tymber/mail";
<% } %>
<% if (modules.includes("openapi")) { %>
import { OpenAPIModule } from "@tymber/openapi";
<% } %>
<% if (modules.includes("sse")) { %>
import { SSEModule } from "@tymber/sse";
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
<% if (modules.includes("mail")) { %>
class TestMailProvider extends MailProvider {
  sendMail(mail: Mail) {
    console.log(`sending ${mail.subject} to ${mail.to}`);
    return Promise.resolve();
  }
}
<% } %>

export async function setup(): Promise<TestContext> {
  <% if (modules.includes("config")) { %>
  process.env.CONFIG_SECRET_KEYS = "S3cr3T";
  <% } %>

  const ctx = await createTestApp(() => createTestDB(), [
    <% if (modules.includes("admin")) { %>
    AdminModule,
    <% } %>
    <% if (modules.includes("config")) { %>
    ConfigModule,
    <% } %>
    <% if (modules.includes("log")) { %>
    LogModule,
    <% } %>
    <% if (modules.includes("mail")) { %>
    MailModule,
    {
      name: "test",
      version: "0.0.0",
      init(app) {
        app.component(TestMailProvider);
      }
    },
    <% } %>
    <% if (modules.includes("openapi")) { %>
    OpenAPIModule,
    <% } %>
    <% if (modules.includes("sse")) { %>
    SSEModule,
    <% } %>
    <% if (modules.includes("user")) { %>
    UserModule,
    <% } %>
    MainModule
  ]);
  <% if (modules.includes("admin")) { %>
  const { adminSessionId, adminUserId } = await initTestDB(ctx.db);
  <% } %>

  return {
    ...ctx,
    <% if (modules.includes("admin")) { %>
    adminSessionId,
    adminUserId,
    <% } %>
  };
}
