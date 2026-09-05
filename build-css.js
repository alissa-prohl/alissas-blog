import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import fs from "node:fs";
import path from "node:path";

const inputPath = path.resolve("src/style.css");
const outputPath = path.resolve("style.css");

async function build() {
  const startTime = Date.now();
  const inputCss = fs.readFileSync(inputPath, "utf-8");

  const compiler = await compile(inputCss, {
    base: process.cwd(),
    onDependency: () => {},
  });

  const scanner = new Scanner({
    sources: [{ base: process.cwd(), pattern: "**/*.{html,js}", negated: false }],
  });

  const candidates = scanner.scan();
  const css = compiler.build(candidates);

  fs.writeFileSync(outputPath, css, "utf-8");
  const elapsed = Date.now() - startTime;
  console.log(`[${new Date().toLocaleTimeString()}] Tailwind CSS compiled -> style.css (${candidates.length} candidates, ${elapsed}ms)`);
}

async function main() {
  await build();

  if (process.argv.includes("--watch")) {
    console.log("Watching for changes in HTML and src/style.css...");
    let debounceTimer = null;
    fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
      if (
        filename &&
        (filename.endsWith(".html") || filename.endsWith(".js") || filename === "src/style.css") &&
        filename !== "style.css"
      ) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`Change detected in ${filename}, rebuilding...`);
          build().catch(console.error);
        }, 100);
      }
    });
  }
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
