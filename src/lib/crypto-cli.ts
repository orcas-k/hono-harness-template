import { readFileSync } from "node:fs";

import { decrypt, encrypt } from "./crypto";

const [operation, ...arguments_] = process.argv.slice(2);

function printUsage(): void {
  console.error('Usage: pnpm crypto <encrypt|decrypt> "text"\n' + '       echo "text" | pnpm crypto <encrypt|decrypt>');
}

function readText(): string {
  if (arguments_.length > 0) return arguments_.join(" ");
  if (process.stdin.isTTY) {
    throw new Error("Text argument is required when stdin is not piped");
  }
  return readFileSync(0, "utf8").replace(/\r?\n$/, "");
}

if (operation !== "encrypt" && operation !== "decrypt") {
  printUsage();
  process.exitCode = 1;
} else {
  try {
    const text = readText();
    process.stdout.write(`${operation === "encrypt" ? encrypt(text) : decrypt(text)}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Operation failed");
    process.exitCode = 1;
  }
}
