--- FILE: tests/assert-pdf.js
const fs = require('fs');
const pdf = require('pdf-parse');

(async () => {
  const file = process.argv[2] || '/tmp/report.pdf';
  const needle = process.argv[3] || 'МИНТРАНС';
  if (!fs.existsSync(file)) {
    console.error('PDF not found:', file);
    process.exit(1);
  }
  const data = fs.readFileSync(file);
  const { text } = await pdf(data);
  if (!text.includes(needle)) {
    console.error('PDF assertion failed: cannot find', needle);
    process.exit(2);
  }
  console.log('[assert] PDF contains:', needle);
})();
