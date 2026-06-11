import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(import.meta.dirname, "..");
const nodesDir = resolve(rootDir, "ai-memory", "nodes");
const outputDir = resolve(rootDir, "ai-memory", "generated");
const outputPath = resolve(outputDir, "memory-index.generated.json");

const requiredFields = ["id", "title", "type", "status", "source_files"];

function parseScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function parseFrontmatter(contents, fileName) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`${fileName}: missing frontmatter block`);
  }

  const metadata = {};
  let currentListKey = null;

  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem) {
      if (!currentListKey) {
        throw new Error(`${fileName}: list item without a metadata key`);
      }

      if (!Array.isArray(metadata[currentListKey])) {
        metadata[currentListKey] = [];
      }

      metadata[currentListKey].push(parseScalar(listItem[1]));
      continue;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!field) {
      throw new Error(`${fileName}: cannot parse frontmatter line "${rawLine}"`);
    }

    const [, key, rawValue = ""] = field;
    const value = rawValue.trim();

    if (!value) {
      metadata[key] = [];
      currentListKey = key;
      continue;
    }

    metadata[key] = parseScalar(value);
    currentListKey = null;
  }

  return metadata;
}

function validateMetadata(metadata, fileName) {
  for (const field of requiredFields) {
    if (metadata[field] === undefined || metadata[field] === "") {
      throw new Error(`${fileName}: missing required metadata field "${field}"`);
    }
  }

  if (!Array.isArray(metadata.source_files) || metadata.source_files.length === 0) {
    throw new Error(`${fileName}: source_files must be a non-empty list`);
  }

  if (
    metadata.related_nodes !== undefined &&
    !Array.isArray(metadata.related_nodes)
  ) {
    throw new Error(`${fileName}: related_nodes must be a list when present`);
  }
}

function buildNodeRecord(fileName) {
  const filePath = `ai-memory/nodes/${fileName}`;
  const contents = readFileSync(resolve(nodesDir, fileName), "utf8");
  const metadata = parseFrontmatter(contents, fileName);

  validateMetadata(metadata, fileName);

  return {
    id: metadata.id,
    title: metadata.title,
    type: metadata.type,
    status: metadata.status,
    path: filePath,
    priority:
      typeof metadata.priority === "number" ? metadata.priority : 999,
    summary: metadata.summary ?? "",
    related_nodes: metadata.related_nodes ?? [],
    source_files: metadata.source_files,
    last_reviewed: metadata.last_reviewed ?? "",
  };
}

const nodeFiles = readdirSync(nodesDir)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort((left, right) => left.localeCompare(right));

const nodes = nodeFiles
  .map(buildNodeRecord)
  .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));

const ids = new Set();
for (const node of nodes) {
  if (ids.has(node.id)) {
    throw new Error(`Duplicate memory node id "${node.id}"`);
  }
  ids.add(node.id);
}

const index = {
  schema_version: 1,
  generated_by: basename(fileURLToPath(import.meta.url)),
  nodes,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);

console.log(`Wrote ${nodes.length} memory nodes to ai-memory/generated/memory-index.generated.json`);
