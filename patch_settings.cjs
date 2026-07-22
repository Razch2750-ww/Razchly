const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(/<option key=\{acc\.id\} value=\{acc\.id\}>\{acc\.name\}<\/option>/g, '<option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>');

fs.writeFileSync('src/components/Settings.tsx', code);
