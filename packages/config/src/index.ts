import { FS, type Module } from "@tymber/core";
import { ConfigRepository } from "./repositories/ConfigRepository.js";
import { DBConfigService } from "./services/DBConfigService.js";
import { CreateConfigRevision } from "./admin-endpoints/CreateConfigRevision.js";
import { ListConfigRevisions } from "./admin-endpoints/ListConfigRevisions.js";
import { RevertToRevision } from "./admin-endpoints/RevertToRevision.js";

export const ConfigModule: Module = {
  name: "@tymber/config",
  version: "0.0.1",

  adminSidebarItems: [],
  assetsDir: FS.join(import.meta.dirname, "..", "assets"),

  init(app) {
    app.component(ConfigRepository);
    app.component(DBConfigService);

    app.adminEndpoint(
      "POST",
      "/api/admin/config_revisions",
      CreateConfigRevision,
    );
    app.adminEndpoint(
      "GET",
      "/api/admin/config_revisions",
      ListConfigRevisions,
    );
    app.adminEndpoint(
      "POST",
      "/api/admin/config_revisions/:revisionId/_revert",
      RevertToRevision,
    );
  },
};
