const fs = require('fs');
let c = fs.readFileSync('src/components/Settings.tsx', 'utf8');
c = c.replace(/opacity-\[37\.5\%\]" \\\\\/>/g, 'opacity-[37.5%]" />');
c = c.replace(/opacity-\[37\.5\%\]" \/>\/>/g, 'opacity-[37.5%]" />');
c = c.replace(/opacity-\[37\.5\%\]" \\\/>/g, 'opacity-[37.5%]" />');
fs.writeFileSync('src/components/Settings.tsx', c);
