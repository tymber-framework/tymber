import { join as nodeJoin } from "node:path";
import { readdir, readFile as nodeReadFile } from "node:fs/promises";
import { createReadStream as nodeCreateReadStream } from "node:fs";

// group Node.js-specific methods
export const FS = {
  join: (...paths: string[]) => nodeJoin(...paths),
  createReadStream: (path: string) => nodeCreateReadStream(path),
  readFile: (path: string) => nodeReadFile(path, "utf8"),
  readDirRecursively: (path: string) =>
    readdir(path, {
      encoding: "utf8",
      recursive: true,
    }),
};
