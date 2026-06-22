const KEY = ".age/key.txt";
const FILES = [
  [".env", ".env.age"],
];

if (!existsSync(KEY)) {
  console.error("Missing age key:", KEY);
  Deno.exit(1);
}

for (const [src, dst] of FILES) {
  if (!existsSync(src)) continue;
  const cmd = new Deno.Command("sops", {
    args: ["--encrypt", "--input-type", "dotenv", "--output-type", "dotenv", src],
    env: { SOPS_AGE_KEY_FILE: KEY },
  });
  const { stdout, stderr, code } = await cmd.output();
  if (code !== 0) { console.error("Failed:", new TextDecoder().decode(stderr)); Deno.exit(1); }
  Deno.writeFileSync(dst, stdout);
  console.log(`Encrypted ${src} \u2192 ${dst}`);
}

function existsSync(p: string) { try { Deno.statSync(p); return true; } catch { return false; } }
