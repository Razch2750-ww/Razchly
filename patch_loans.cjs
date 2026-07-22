const fs = require('fs');
let code = fs.readFileSync('src/components/Loans.tsx', 'utf8');

// For "rekening sumber" / "rekening potongan" in Loans
// There is openAddModal
// We should check if openAddModal sets default source account.
code = code.replace(/setSourceAccountId\(accounts\[0\]\?\.id \|\| ""\);/g, "setSourceAccountId(localStorage.getItem('lastAccountId_loans') || accounts[0]?.id || \"\");");
code = code.replace(/setAutoDebitAccountId\(accounts\[0\]\?\.id \|\| ""\);/g, "setAutoDebitAccountId(localStorage.getItem('lastAccountId_loans_autodebit') || accounts[0]?.id || \"\");");

// Update onChange to save to localStorage
code = code.replace(/onChange=\{\(e\) => setSourceAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                      setSourceAccountId(e.target.value);
                      localStorage.setItem('lastAccountId_loans', e.target.value);
                    }}`);

code = code.replace(/onChange=\{\(e\) => setAutoDebitAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                      setAutoDebitAccountId(e.target.value);
                      localStorage.setItem('lastAccountId_loans_autodebit', e.target.value);
                    }}`);

// Show balance in select options for auto debit if not present
// The source already has: <option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>
// The auto debit has: <option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">{acc.name}</option>
code = code.replace(/<option key=\{acc\.id\} value=\{acc\.id\} className="bg-\[#1C1C1E\] text-white">\{acc\.name\}<\/option>/g, '<option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>');

fs.writeFileSync('src/components/Loans.tsx', code);
