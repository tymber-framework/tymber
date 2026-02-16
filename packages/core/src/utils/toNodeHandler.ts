import type {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from "node:http";
import { Readable, type Transform } from "node:stream";
import {
  createBrotliCompress,
  createDeflate,
  createGzip,
  createZstdCompress,
} from "node:zlib";

function toHeaders(nodeHeaders: IncomingHttpHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const val of value) {
        headers.append(key, val);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }
  return headers;
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    req.setEncoding("utf8");
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(chunks.join()));
    req.on("error", (err) => reject(err));
  });
}

function createNativeRequest(nodeReq: IncomingMessage) {
  const req = Object.create(null);

  req.url = nodeReq.url;
  req.method = nodeReq.method;
  req.headers = toHeaders(nodeReq.headers);
  req.json = () => readBody(nodeReq).then(JSON.parse);

  const controller = new AbortController();
  req.signal = controller.signal;
  nodeReq.on("close", () => controller.abort());

  return req as Request;
}

const AVAILABLE_COMPRESSION_ALGORITHMS = [
  {
    name: "zstd", // added in v22.15.0
    createCompressor: createZstdCompress,
  },
  {
    name: "brotli", // added in v10.16.0
    createCompressor: createBrotliCompress,
  },
  {
    name: "gzip",
    createCompressor: createGzip,
  },
  {
    name: "deflate",
    createCompressor: createDeflate,
  },
];

function writeResponse(
  nodeReq: IncomingMessage,
  nodeRes: ServerResponse,
  res: Response,
) {
  const isSSE = res.headers.get("content-type") === "text/event-stream";
  const acceptEncoding = nodeReq.headers["accept-encoding"];
  let compressor: Transform | undefined;

  if (res.body && acceptEncoding && !isSSE) {
    // TODO handle quality
    // ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding
    for (const { name, createCompressor } of AVAILABLE_COMPRESSION_ALGORITHMS) {
      if (acceptEncoding.includes(name)) {
        res.headers.set("content-encoding", name);
        compressor = createCompressor();
        break;
      }
    }
  }

  nodeRes.setHeaders(res.headers);
  nodeRes.writeHead(res.status);

  if (!res.body) {
    return nodeRes.end();
  }

  if (isSSE) {
    nodeRes.flushHeaders();
  }

  if (compressor) {
    Readable.fromWeb(res.body).pipe(compressor).pipe(nodeRes);
  } else {
    Readable.fromWeb(res.body).pipe(nodeRes);
  }
}

export function toNodeHandler(
  nativeHandler: (req: Request) => Promise<Response>,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async function (nodeReq, nodeRes) {
    const req = createNativeRequest(nodeReq);

    const httpResponse = await nativeHandler(req);

    writeResponse(nodeReq, nodeRes, httpResponse);
  };
}
