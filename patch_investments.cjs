const fs = require('fs');
let code = fs.readFileSync('src/components/Investments.tsx', 'utf8');

code = code.replace(/setPortoAccountId\(accounts\[0\]\?\.id \|\| ""\);/g, "setPortoAccountId(localStorage.getItem('lastAccountId_investasi') || accounts[0]?.id || \"\");");

code = code.replace(/onChange=\{\(e\) => setPortoAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                      setPortoAccountId(e.target.value);
                      localStorage.setItem('lastAccountId_investasi', e.target.value);
                    }}`);

fs.writeFileSync('src/components/Investments.tsx', code);
