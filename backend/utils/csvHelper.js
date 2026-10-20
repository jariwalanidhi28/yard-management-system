/**
 * Escapes values against CSV/Spreadsheet Formula Injection.
 * Prepends a single quote if string begins with =, +, -, @, \t, or \r.
 */
const sanitizeForCsv = (value) => {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value);

  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Escape existing double quotes by doubling them
  stringValue = stringValue.replace(/"/g, '""');

  return `"${stringValue}"`;
};

/**
 * Converts array of objects to CSV string.
 * @param {Array<string>} headers - Header column titles
 * @param {Array<string>} fields - Object keys corresponding to headers
 * @param {Array<Object>} rows - Data objects
 */
const generateCsv = (headers, fields, rows) => {
  const headerLine = headers.map(sanitizeForCsv).join(',');
  const dataLines = rows.map((row) => {
    return fields
      .map((field) => {
        let val;
        if (typeof field === 'function') {
          val = field(row);
        } else {
          val = field.split('.').reduce((obj, key) => (obj ? obj[key] : ''), row);
        }
        return sanitizeForCsv(val);
      })
      .join(',');
  });

  return [headerLine, ...dataLines].join('\r\n');
};

module.exports = {
  sanitizeForCsv,
  generateCsv,
};
