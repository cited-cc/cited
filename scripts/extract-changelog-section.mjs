#!/usr/bin/env node

import { readFileSync } from "node:fs";

const version = process.argv[2] ?? process.env.RELEASE_VERSION;
if (!version) {
  console.error("Usage: node scripts/extract-changelog-section.mjs <version>");
  process.exit(1);
}

const content = readFileSync("CHANGELOG.md", "utf8");
const header = `## [${version}]`;
const start = content.indexOf(header);
if (start === -1) {
  console.error(`Changelog section not found for ${version}`);
  process.exit(1);
}

const afterHeader = content.slice(start + header.length);
const nextSection = afterHeader.search(/\n## \[/);
const body = nextSection === -1 ? afterHeader : afterHeader.slice(0, nextSection);

process.stdout.write(`${header}${body}`.trimEnd());
process.stdout.write("\n");
