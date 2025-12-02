import { type Context } from "./Context.js";
import { type HttpMethod } from "./Router.js";

export interface HttpContext<Payload = any, PathParams = any, QueryParams = any>
  extends Context {
  method: HttpMethod;
  payload: Payload;
  path: string;
  pathParams: PathParams;
  query: QueryParams;
  headers: Headers;
  cookies: Record<string, string>;
  abortSignal: AbortSignal;

  responseHeaders: Headers;
  sessionId?: string;
  adminSessionId?: string;

  render: (
    view: string | string[],
    data?: Record<string, any>,
  ) => Promise<Response>;

  redirect(path: string, type?: HttpRedirectCode): Response;
}

export enum HttpRedirectCode {
  HTTP_301_MOVED_PERMANENTLY = 301,
  HTTP_302_FOUND = 302,
  HTTP_303_SEE_OTHER = 303,
  HTTP_307_TEMPORARY_REDIRECT = 307,
  HTTP_308_PERMANENT_REDIRECT = 308,
}
