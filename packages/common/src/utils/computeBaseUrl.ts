function removeQuotes(str: string) {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1);
  } else {
    return str;
  }
}

function parseForwardedHeader(header: string) {
  const parts = header.split(";").map((part) => part.trim());
  const parsed = {} as Record<string, string>;

  for (const part of parts) {
    const [key, value] = part.split("=");

    if (key && value) {
      parsed[key.toLowerCase()] = removeQuotes(value);
    }
  }

  return `${parsed.proto}://${parsed.host}`;
}

export function computeBaseUrl(headers: Headers) {
  const forwardedHeader = headers.get("forwarded");

  if (forwardedHeader) {
    const baseUrl = parseForwardedHeader(forwardedHeader);
    if (baseUrl) {
      return baseUrl;
    }
  }

  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    const proto = forwardedProto.split(",");
    const host = forwardedHost.split(",");
    return `${proto[0]}://${host[0]}`;
  }

  const host = headers.get("host");

  return `http://${host}`;
}
