#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dynamicIcons = ["close"];
const icons = new Set(dynamicIcons);
const iconPattern = /<span[^>]*class="[^"]*material-symbols-outlined[^"]*"[^>]*>\s*([^<\s][^<]*?)\s*<\/span>/g;

for (const fileName of fs.readdirSync(rootDir).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(rootDir, fileName), "utf8");

  for (const match of html.matchAll(iconPattern)) {
    icons.add(match[1].trim());
  }
}

const family = "Material Symbols Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0";
const query = new URLSearchParams({
  family,
  icon_names: Array.from(icons).sort().join(","),
  display: "swap",
});

async function buildIconFont() {
  const cssResponse = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/151 Safari/537.36" },
  });

  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();
  const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];

  if (!fontUrl) {
    throw new Error("Google Fonts response did not include a font URL");
  }

  const fontResponse = await fetch(fontUrl);

  if (!fontResponse.ok) {
    throw new Error(`Icon font request failed: ${fontResponse.status}`);
  }

  const outputPath = path.join(rootDir, "assets/fonts/material-symbols-outlined.woff2");
  fs.writeFileSync(outputPath, Buffer.from(await fontResponse.arrayBuffer()));
  console.log(`Built Material Symbols subset with ${icons.size} icons`);
}

buildIconFont().catch((error) => {
  console.error(error.message);
  process.exit(1);
});