export async function doFetch({ path, method, payload, query }) {
  const requestHeaders = new Headers();

  requestHeaders.set("x-csrf-token", "1");
  requestHeaders.set("credentials", "include");

  const options = {
    method,
    headers: requestHeaders,
  };

  if (payload) {
    requestHeaders.set("content-type", "application/json");
    options.body = JSON.stringify(payload);
  }

  if (query) {
    path += "?" + new URLSearchParams(query);
  }

  try {
    const res = await fetch(path, options);

    let body;

    if (res.headers.get("content-type") === "application/json") {
      body = await res.json();
    } else if (res.headers.has("content-type")) {
      body = await res.arrayBuffer();
    }

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      body,
    };
  } catch (_e) {
    // network error
    return {
      ok: false,
    };
  }
}
