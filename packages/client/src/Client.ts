type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

interface HttpRequest {
  method?: HttpMethod;
  path: string;
  query?: Record<string, any>;
  payload?: any;
  headers?: Record<string, string>;
}

/**
 * Represents a client for sending HTTP requests.
 */
export class Client {
  constructor(
    private readonly baseUrl: string,
    private readonly defaultHeaders?: Record<string, string>,
  ) {}

  public async fetch<T = any>({
    method,
    path,
    query,
    payload,
    headers,
  }: HttpRequest) {
    const requestHeaders = new Headers(this.defaultHeaders);
    requestHeaders.set("x-csrf-token", "1");
    requestHeaders.set(
      "credentials",
      this.baseUrl.startsWith("/") ? "same-origin" : "include",
    );

    if (headers) {
      Object.keys(headers).forEach((key) => {
        requestHeaders.set(key, headers[key]);
      });
    }

    const options: RequestInit = {
      method: method || "GET",
      headers: requestHeaders,
    };

    if (payload) {
      requestHeaders.set("content-type", "application/json");
      options.body = JSON.stringify(payload);
    }

    let url = this.baseUrl + path;

    if (query) {
      url += "?" + new URLSearchParams(query);
    }

    const res = await fetch(url, options);

    let body;

    const contentTypeHeader = res.headers.get("content-type");
    if (contentTypeHeader) {
      const contentType = contentTypeHeader.split(";")[0];
      switch (contentType) {
        case "application/json":
          body = await res.json();
          break;
        default:
          body = await res.text();
          break;
      }
    }

    return {
      status: res.status,
      headers: res.headers,
      body: body as T,
    };
  }
}
