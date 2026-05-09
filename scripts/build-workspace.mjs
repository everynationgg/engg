import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const mode = process.argv[2] ?? "all";

function runBuild(packageName, basePath) {
  const result = spawnSync(
    "pnpm",
    ["--filter", packageName, "run", "build"],
    {
      cwd: root,
      env: {
        ...process.env,
        PORT: "3000",
        BASE_PATH: basePath,
        NODE_ENV: "production",
      },
      shell: process.platform === "win32",
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyDist(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

if (!["all", "landing", "game"].includes(mode)) {
  console.error(`Unknown build target: ${mode}`);
  process.exit(1);
}

if (mode === "all" || mode === "landing") {
  runBuild("@workspace/every-nation", "/");
}

if (mode === "all" || mode === "game") {
  runBuild("@workspace/end", "/end");
}

if (mode === "all") {
  const dist = resolve(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  copyDist(resolve(root, "artifacts/every-nation/dist/public"), dist);
  copyDist(resolve(root, "artifacts/end/dist/public"), resolve(dist, "end"));
}
