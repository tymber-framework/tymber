import { type Context } from "./Context.js";
import { type HttpMethod } from "./Router.js";
import { type Locale } from "./contrib/accept-language-parser.js";

export interface HttpContext<
  Payload = never,
  PathParams = never,
  QueryParams = never,
> extends Context {
  method: HttpMethod;
  payload: Payload;
  path: string;
  pathParams: PathParams;
  query: QueryParams;
  headers: Headers;
  cookies: Record<string, string>;
  signal: AbortSignal;

  locale: Locale;
  responseHeaders: Headers;
  sessionId?: string;
  adminSessionId?: string;

  render: (
    view: string | string[],
    data?: Record<string, any>,
  ) => Promise<Response>;

  onFinish: (listener: (res: Response) => void | Promise<void>) => void;

  redirect(path: string, type?: HttpRedirectCode): Response;
}

export enum HttpRedirectCode {
  HTTP_301_MOVED_PERMANENTLY = 301,
  HTTP_302_FOUND = 302,
  HTTP_303_SEE_OTHER = 303,
  HTTP_307_TEMPORARY_REDIRECT = 307,
  HTTP_308_PERMANENT_REDIRECT = 308,
}
