import { readFileSync } from "node:fs";
import { hash, verify } from "node-argon2";

const [operation, ...arguments_] = process.argv.slice(2);

function printUsage(): void {
  console.error(
    'Usage: pnpm argon2 <hash|verify> "password" [hash]\n' +
      '       pnpm argon2 hash "password"\n' +
      '       pnpm argon2 verify "password" "$argon2id$..."\n' +
      '       echo "password" | pnpm argon2 hash',
  );
}

const hashPassword = async (password: string) => {
  return hash(password);
};

const verifyPassword = async (password: string, passwordHash: string) => {
  return verify({ password, hash: passwordHash });
};

function readPassword(): string {
  if (arguments_.length > 0) return arguments_[0];
  if (process.stdin.isTTY) {
    throw new Error("Password argument is required when stdin is not piped");
  }
  return readFileSync(0, "utf8").replace(/\r?\n$/, "");
}

if (operation !== "hash" && operation !== "verify" && operation !== "encrypt" && operation !== "decrypt") {
  printUsage();
  process.exitCode = 1;
} else {
  try {
    const password = readPassword();

    if (operation === "hash" || operation === "encrypt") {
      process.stdout.write(`${await hashPassword(password)}\n`);
    } else {
      const passwordHash = arguments_[1];
      if (!passwordHash) {
        throw new Error("Hash argument is required for password verification");
      }
      process.stdout.write(`${await verifyPassword(password, passwordHash)}\n`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Password operation failed");
    process.exitCode = 1;
  }
}
