function cell(value) {
  let s = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  // Stops spreadsheet formula injection (a cell starting with = + - @ would run as a formula).
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(rows, columns) {
  const head = columns.map((c) => cell(c.label)).join(",");
  const body = rows.map((r) =>
    columns.map((c) => cell(typeof c.value === "function" ? c.value(r) : r[c.key])).join(",")
  );
  return "﻿" + [head, ...body].join("\r\n"); // BOM so Excel shows accents correctly
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

module.exports = { toCsv, sendCsv };
