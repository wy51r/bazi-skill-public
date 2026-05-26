#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { buildBaziJson } = require('../src/bazi-json-builder');

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
  node bin/build-bazi-json.js --date 1990-01-01 --time 12:00 --gender male --location "China, Asia/Shanghai" --out ../tmp/generated.json

Options:
  --date YYYY-MM-DD          Required. Solar calendar birth date.
  --time HH:mm[:ss]          Required. Birth time.
  --gender male|female|男|女 Required.
  --location TEXT            Optional. Defaults to China, timezone Asia/Shanghai.
  --use-true-solar-time      Optional. Correct chart time by longitude and equation of time.
  --longitude DEGREE         Optional. East longitude for true solar time, e.g. 117.2272.
  --standard-meridian DEGREE Optional. Defaults to 120 for China Standard Time.
  --case-id TEXT             Optional. Defaults to date-time-gender.
  --target-start-year YYYY   Optional. Defaults to current year.
  --target-year-count N      Optional. Defaults to 3.
  --out PATH                 Optional. Writes JSON to path; otherwise prints to stdout.
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

if (!args.date) fail('Missing --date.');
if (!args.time) fail('Missing --time.');
if (!args.gender) fail('Missing --gender.');

const dateParts = args.date.split('-').map(Number);
const timeParts = args.time.split(':').map(Number);
if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) fail('Invalid --date. Use YYYY-MM-DD.');
if (timeParts.length < 2 || timeParts.length > 3 || timeParts.some(Number.isNaN)) fail('Invalid --time. Use HH:mm or HH:mm:ss.');

const [year, month, day] = dateParts;
const [hour, minute, second = 0] = timeParts;

const json = buildBaziJson({
  year,
  month,
  day,
  hour,
  minute,
  second,
  gender: args.gender,
  location: args.location,
  caseId: args['case-id'],
  targetStartYear: args['target-start-year'] ? Number(args['target-start-year']) : undefined,
  targetYearCount: args['target-year-count'] ? Number(args['target-year-count']) : undefined,
  useTrueSolarTime: Boolean(args['use-true-solar-time']),
  longitude: args.longitude,
  standardMeridian: args['standard-meridian'] ? Number(args['standard-meridian']) : undefined,
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
