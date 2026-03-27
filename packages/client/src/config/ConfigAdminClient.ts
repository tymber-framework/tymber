import { Client } from "../Client.js";

interface ConfigRevision {
  id: number;
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
  };
  comment: string;
}

interface ConfigRevisionWithValues extends ConfigRevision {
  values: Record<string, any>;
}

export class ConfigAdminClient extends Client {
  listConfigRevisions(query?: {
    page?: number;
    size?: number;
    sort?: "created_at:asc" | "created_at:desc";
    createdBy?: number;
  }) {
    return this.fetch<{ items: ConfigRevision[] }>({
      method: "GET",
      path: "/api/admin/config_revisions",
      query,
    });
  }

  createConfigRevision(payload: {
    values: Record<string, any>;
    comment: string;
  }) {
    return this.fetch({
      method: "POST",
      path: "/api/admin/config_revisions",
      payload,
    });
  }

  public revertToRevision(revisionId: number, payload: { comment: string }) {
    return this.fetch({
      method: "POST",
      path: `/api/admin/config_revisions/${revisionId}/_revert`,
      payload,
    });
  }
}
