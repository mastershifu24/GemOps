import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = path.join(root, "public/mediapipe/wasm");

if (!existsSync(src)) {
  console.warn("[copy-mediapipe-wasm] @mediapipe/tasks-vision wasm not found — skip");
  process.exit(0);
}

mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true, force: true });
console.log("[copy-mediapipe-wasm] copied to public/mediapipe/wasm");
