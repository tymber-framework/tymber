import type { ModuleDefinition } from "../Module.js";
import { sortBy } from "./sortBy.js";
import { createDebug } from "./createDebug.js";
import type { DB } from "../DB.js";
import { emptyContext } from "../Context.js";
import { FS } from "./fs.js";
import { sql } from "./sql.js";

const debug = createDebug("runMigrations");

// example: 0001-create-users-table.sql
const MIGRATION_REGEX = /^(\d+)-(.*)\.sql$/;

interface Migration {
  module: string;
  id: number;
  name: string;
  sql: string;
}

export async function runMigrations(db: DB, modules: ModuleDefinition[]) {
  const ctx = emptyContext();

  debug("creating migrations table");
  await db.createMigrationsTable(ctx);

  for (const module of modules) {
    if (!module.assetsDir) {
      continue;
    }

    const migrationFiles: Migration[] = [];

    for (const { filename, absolutePath } of await readMigrationFiles(
      db,
      module,
    )) {
      let match = MIGRATION_REGEX.exec(filename);
      if (match) {
        migrationFiles.push({
          module: module.name,
          id: parseInt(match[1], 10),
          name: match[2],
          sql: await FS.readFile(absolutePath),
        });
      }
    }

    sortBy(migrationFiles, "id");

    for (const migration of migrationFiles) {
      await db.startTransaction(ctx, async () => {
        const result = await db.query(
          ctx,
          sql.select().from("migrations").where({
            id: migration.id,
            module: migration.module,
          }),
        );

        if (result.length === 1) {
          debug(
            "migration #%d of module %s already applied",
            migration.id,
            migration.module,
          );
          return;
        }

        debug(
          "applying migration #%d of module %s",
          migration.id,
          migration.module,
        );
        await db.run(ctx, sql.rawStatement(migration.sql));

        await db.run(
          ctx,
          sql
            .insert()
            .into("migrations")
            .values([
              {
                module: migration.module,
                id: migration.id,
                name: migration.name,
                run_at: new Date(),
              },
            ]),
        );
      });
    }
  }
}

async function readMigrationFiles(db: DB, module: ModuleDefinition) {
  const assetsDir = module.assetsDir;
  if (!assetsDir) {
    return [];
  }
  try {
    const dbSpecificPath = FS.join(assetsDir, "migrations", db.name);
    debug("reading files from %s", dbSpecificPath);
    const filenames = await FS.readDirRecursively(dbSpecificPath);
    return filenames.map((filename) => ({
      filename,
      absolutePath: FS.join(assetsDir, "migrations", db.name, filename),
    }));
  } catch (e) {
    try {
      const commonPath = FS.join(assetsDir, "migrations");
      debug("reading files from %s", commonPath);
      const filenames = await FS.readDirRecursively(commonPath);
      return filenames.map((filename) => ({
        filename,
        absolutePath: FS.join(assetsDir, "migrations", filename),
      }));
    } catch (e) {
      return [];
    }
  }
}
