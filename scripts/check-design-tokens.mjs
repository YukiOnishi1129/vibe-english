/**
 * Fails when styles.css hardcodes a colour outside the token block.
 *
 * Design rule (docs/DESIGN.md §2): every colour is a CSS variable, so themes
 * can be swapped in one place. Hex literals are allowed only where the tokens
 * themselves are declared.
 */
import { readFileSync } from "node:fs";

const FILE = "apps/web/src/styles.css";
const source = readFileSync(FILE, "utf8");

const offenders = [];
source.split(/\r?\n/).forEach((line, index) => {
  if (!/#[0-9a-fA-F]{3,8}\b/.test(line)) return;
  // A token declaration: `  --name: #abc;`
  if (/^\s*--[\w-]+:\s*#[0-9a-fA-F]{3,8};/.test(line)) return;
  offenders.push(`${FILE}:${index + 1}  ${line.trim()}`);
});

if (offenders.length > 0) {
  console.error(
    "色は CSS 変数で定義してください（docs/DESIGN.md §2）。直書きされている箇所:",
  );
  for (const offender of offenders) console.error("  " + offender);
  process.exit(1);
}

console.log("design tokens ok");
