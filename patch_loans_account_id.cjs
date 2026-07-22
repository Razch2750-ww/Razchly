const fs = require('fs');
let code = fs.readFileSync('src/components/Loans.tsx', 'utf8');

// Replace the hook initialization or initial setting in useEffect
code = code.replace(/if \(!accountId\) setAccountId\(accts\[0\]\.id\);/, "if (!accountId) setAccountId(localStorage.getItem('lastAccountId_loans') || accts[0].id);");
code = code.replace(/if \(!autoDebitAccountId\) setAutoDebitAccountId\(accts\[0\]\.id\);/, "if (!autoDebitAccountId) setAutoDebitAccountId(localStorage.getItem('lastAccountId_loans_autodebit') || accts[0].id);");
code = code.replace(/setAccountId\(loan\.accountId \|\| \(accounts\[0\]\?\.id \|\| ""\)\);/, "setAccountId(loan.accountId || (localStorage.getItem('lastAccountId_loans') || accounts[0]?.id || \"\"));");
code = code.replace(/setAutoDebitAccountId\(loan\.autoDebitAccountId \|\| \(accounts\[0\]\?\.id \|\| ""\)\);/, "setAutoDebitAccountId(loan.autoDebitAccountId || (localStorage.getItem('lastAccountId_loans_autodebit') || accounts[0]?.id || \"\"));");

// Replace onChange for accountId
code = code.replace(/onChange=\{\(e\) => setAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                      setAccountId(e.target.value);
                      localStorage.setItem('lastAccountId_loans', e.target.value);
                    }}`);

fs.writeFileSync('src/components/Loans.tsx', code);
