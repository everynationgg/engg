import { db } from "@workspace/db";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger.js";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure the PostgreSQL schema is up to date using Drizzle migrations.
 *
 * This function replaces the legacy manual SQL migration logic with the
 * official Drizzle migrator. It uses the generated migration files in
 * lib/db/drizzle as the single source of truth for the database schema.
 *
 * The migration path is resolved relative to this file's location,
 * supporting both local development and containerized production environments.
 */
export async function migrateDb(): Promise<void> {
  try {
    // Path resolution: Try multiple potential locations to support various Docker/Local structures
    let migrationsFolder = process.env.MIGRATIONS_PATH || path.resolve(__dirname, "../../../../lib/db/drizzle");
    
    if (!fs.existsSync(migrationsFolder)) {
      const altPath = path.resolve(process.cwd(), "lib/db/drizzle");
      if (fs.existsSync(altPath)) {
        migrationsFolder = altPath;
      }
    }

    console.log(`>>> MIGRATION_PATH: ${migrationsFolder} (Exists: ${fs.existsSync(migrationsFolder)})`);
    if (fs.existsSync(migrationsFolder)) {
      try {
        const files = fs.readdirSync(migrationsFolder);
        console.log(`>>> MIGRATION_FILES: ${files.join(", ")}`);
        if (files.includes("meta")) {
           const metaFiles = fs.readdirSync(path.join(migrationsFolder, "meta"));
           console.log(`>>> META_FILES: ${metaFiles.join(", ")}`);
        }
      } catch (e) {}
    }

    logger.info({ migrationsFolder }, "migrate: synchronizing schema with versioned migrations");
    
    await migrate(db, { migrationsFolder });
    
    logger.info("migrate: schema synchronization completed successfully");
  } catch (err) {
    // We log the error but allow the server to continue starting (fail-open strategy),
    // matching the behavior of previous manual migrations.
    logger.error({ err }, "migrate: schema synchronization failed — check database connectivity and migration integrity");
  }
}
