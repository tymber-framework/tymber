// from https://www.npmjs.com/package/cookie
/**
 * RegExp to match max-age-value in RFC 6265 sec 5.6.2
 */
const maxAgeRegExp = /^-?\d+$/;

/**
 * Parse options.
 */
export interface ParseOptions {
  /**
   * Specifies a function that will be used to decode a [cookie-value](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1).
   * Since the value of a cookie has a limited character set (and must be a simple string), this function can be used to decode
   * a previously-encoded cookie value into a JavaScript string.
   *
   * The default function is the global `decodeURIComponent`, wrapped in a `try..catch`. If an error
   * is thrown it will return the cookie's original value. If you provide your own encode/decode
   * scheme you must ensure errors are appropriately handled. Custom decode functions can return `undefined`,
   * which will skip the cookie during `parse` and try again with a future cookie of the same name.
   *
   * @default decode
   */
  decode?: (str: string) => string | undefined;
}

/**
 * Set-Cookie object.
 */
export interface SetCookie {
  /**
   * Specifies the name of the cookie.
   */
  name: string;
  /**
   * Specifies the string to be the value for the cookie.
   */
  value: string | undefined;
  /**
   * Specifies the `number` (in seconds) to be the value for the [`Max-Age` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.2).
   *
   * The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
   * `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
   * so if both are set, they should point to the same date and time.
   */
  maxAge?: number;
  /**
   * Specifies the `Date` object to be the value for the [`Expires` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.1).
   * When serializing, the UTC year must be between 1601 and 9999 inclusive.
   * When no expiration is set, clients consider this a "non-persistent cookie" and delete it when the current session is over.
   *
   * The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and
   * `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this,
   * so if both are set, they should point to the same date and time.
   */
  expires?: Date;
  /**
   * Specifies the value for the [`Domain` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.3).
   * When no domain is set, clients consider the cookie to apply to the current domain only.
   */
  domain?: string;
  /**
   * Specifies the value for the [`Path` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.4).
   * When no path is set, the path is considered the ["default path"](https://tools.ietf.org/html/rfc6265#section-5.1.4).
   */
  path?: string;
  /**
   * Enables the [`HttpOnly` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.6).
   * When enabled, clients will not allow client-side JavaScript to see the cookie in `document.cookie`.
   */
  httpOnly?: boolean;
  /**
   * Enables the [`Secure` `Set-Cookie` attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5).
   * When enabled, clients will only send the cookie back if the browser has an HTTPS connection.
   */
  secure?: boolean;
  /**
   * Enables the [`Partitioned` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-cutler-httpbis-partitioned-cookies/).
   * When enabled, clients will only send the cookie back when the current domain _and_ top-level domain matches.
   *
   * This is an attribute that has not yet been fully standardized, and may change in the future.
   * This also means clients may ignore this attribute until they understand it. More information
   * about can be found in [the proposal](https://github.com/privacycg/CHIPS).
   */
  partitioned?: boolean;
  /**
   * Specifies the value for the [`Priority` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
   *
   * - `'low'` will set the `Priority` attribute to `Low`.
   * - `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
   * - `'high'` will set the `Priority` attribute to `High`.
   *
   * More information about priority levels can be found in [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
   */
  priority?: "low" | "medium" | "high";
  /**
   * Specifies the value for the [`SameSite` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
   *
   * - `true` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
   * - `'lax'` will set the `SameSite` attribute to `Lax` for lax same site enforcement.
   * - `'none'` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
   * - `'strict'` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
   *
   * More information about enforcement levels can be found in [the specification](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
   */
  sameSite?: boolean | "lax" | "strict" | "none";
}

/**
 * Deserialize a `Set-Cookie` header into an object.
 *
 * parseSetCookie('foo=bar; HttpOnly')
 *   => { name: 'foo', value: 'bar', httpOnly: true }
 */
export function parseSetCookieHeader(
  str: string,
  options?: ParseOptions,
): SetCookie {
  const dec = options?.decode ?? defaultDecode;
  const len = str.length;
  const endIdx = endIndex(str, 0, len);
  let eqIdx = eqIndex(str, 0, len);
  const setCookie: SetCookie =
    eqIdx < endIdx
      ? {
          name: valueSlice(str, 0, eqIdx),
          value: dec(valueSlice(str, eqIdx + 1, endIdx)),
        }
      : { name: "", value: dec(valueSlice(str, 0, endIdx)) };

  let index = endIdx + 1;
  while (index < len) {
    const endIdx = endIndex(str, index, len);
    if (eqIdx < index) eqIdx = eqIndex(str, index, len);

    const attr =
      eqIdx < endIdx
        ? valueSlice(str, index, eqIdx)
        : valueSlice(str, index, endIdx);
    const val = eqIdx < endIdx ? valueSlice(str, eqIdx + 1, endIdx) : undefined;

    switch (attr.toLowerCase()) {
      case "httponly":
        setCookie.httpOnly = true;
        break;
      case "secure":
        setCookie.secure = true;
        break;
      case "partitioned":
        setCookie.partitioned = true;
        break;
      case "domain":
        setCookie.domain = val;
        break;
      case "path":
        setCookie.path = val;
        break;
      case "max-age":
        if (val && maxAgeRegExp.test(val)) setCookie.maxAge = Number(val);
        break;
      case "expires":
        if (!val) break;
        const date = new Date(val);
        if (Number.isFinite(date.valueOf())) setCookie.expires = date;
        break;
      case "priority":
        if (!val) break;
        const priority = val.toLowerCase();
        if (
          priority === "low" ||
          priority === "medium" ||
          priority === "high"
        ) {
          setCookie.priority = priority;
        }
        break;
      case "samesite":
        if (!val) break;
        const sameSite = val.toLowerCase();
        if (
          sameSite === "lax" ||
          sameSite === "strict" ||
          sameSite === "none"
        ) {
          setCookie.sameSite = sameSite;
        }
        break;
    }

    index = endIdx + 1;
  }

  return setCookie;
}

/**
 * Find the next `;` character, or return `len`.
 */
function endIndex(str: string, min: number, len: number) {
  const index = str.indexOf(";", min);
  return index === -1 ? len : index;
}

/**
 * Find the next `=` character, or return `len`.
 */
function eqIndex(str: string, min: number, len: number) {
  const index = str.indexOf("=", min);
  return index === -1 ? len : index;
}

/**
 * Slice out a value between startPod to max.
 */
function valueSlice(str: string, min: number, max: number) {
  if (min === max) return "";
  let start = min;
  let end = max;

  do {
    const code = str.charCodeAt(start);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
  } while (++start < end);

  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 32 /*   */ && code !== 9 /* \t */) break;
    end--;
  }

  return str.slice(start, end);
}

/**
 * URL-decode string value. Optimized to skip native call when no %.
 */
function defaultDecode(str: string): string {
  if (str.indexOf("%") === -1) return str;

  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}
