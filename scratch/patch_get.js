const fs = require('fs');
const file = 'src/app/api/invoices/[id]/route.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/include:\s*{\s*items:\s*true,?\s*},/, 'include: { items: true, customer: true, business: true },');
fs.writeFileSync(file, content);
