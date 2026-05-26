#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { buildBaziJsonFromPillars } = require('../src/bazi-json-builder');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function usage() {
  return `Usage:
  node bin/build-bazi-json-from-pillars.js --pillars "乙巳 甲申 癸未 丙辰" --gender male --case-id qianli-example --out ../examples/qianli-example.json

Options:
  --pillars "年柱 月柱 日柱 时柱" Required unless all four pillar flags are passed.
  --year-pillar TEXT              Optional. Example: 乙巳.
  --month-pillar TEXT             Optional. Example: 甲申.
  --day-pillar TEXT               Optional. Example: 癸未.
  --hour-pillar TEXT              Optional. Example: 丙辰.
  --gender male|female|男|女      Required.
  --case-id TEXT                  Optional.
  --source-title TEXT             Optional. Defaults to 千里命稿.
  --source-note TEXT              Optional.
  --source-excerpt TEXT           Optional.
  --out PATH                      Optional. Writes JSON to path; otherwise prints to stdout.
`;
}

function fail(message) {
  console.error(message);
  console.error('');
  console.error(usage());
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  console.log(usage());
  process.exit(0);
}

let pillars = [];
if (args.pillars) {
  pillars = args.pillars.trim().split(/\s+/);
}

const yearPillar = args['year-pillar'] || pillars[0];
const monthPillar = args['month-pillar'] || pillars[1];
const dayPillar = args['day-pillar'] || pillars[2];
const hourPillar = args['hour-pillar'] || pillars[3];

if (!yearPillar || !monthPillar || !dayPillar || !hourPillar) {
  fail('Missing pillars. Pass --pillars "年柱 月柱 日柱 时柱" or all four pillar flags.');
}
if (!args.gender) fail('Missing --gender.');

const json = buildBaziJsonFromPillars({
  yearPillar,
  monthPillar,
  dayPillar,
  hourPillar,
  gender: args.gender,
  caseId: args['case-id'],
  sourceTitle: args['source-title'],
  sourceNote: args['source-note'],
  sourceExcerpt: args['source-excerpt'],
});

const output = `${JSON.stringify(json, null, 2)}\n`;
if (args.out) {
  const outPath = path.resolve(process.cwd(), args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`Wrote ${outPath}`);
} else {
  process.stdout.write(output);
}
