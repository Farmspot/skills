#!/usr/bin/env node
// Puts the report data into the template: node render.mjs <data.json> <out.html>
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const [dataPath, outPath] = process.argv.slice(2)
if (!dataPath || !outPath) {
  console.error('usage: node render.mjs <data.json> <out.html>')
  process.exit(1)
}
const data = JSON.parse(readFileSync(dataPath, 'utf8'))
if (!data.meta?.brand || !data.meta?.mode) {
  console.error('data.meta.brand and data.meta.mode are required (references/report-data.md)')
  process.exit(1)
}
const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'report.html'), 'utf8')
// "<" escaped so a caption holding "</script>" cannot end the data block.
const json = JSON.stringify(data).replace(/</g, '\\u003c')
writeFileSync(outPath, template.replace('__REPORT_DATA__', () => json))
console.log(`wrote ${outPath}`)
