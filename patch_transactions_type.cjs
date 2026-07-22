const fs = require('fs');
let code = fs.readFileSync('src/components/Transactions.tsx', 'utf8');

// 1. Add handleTypeChange
const handleTypeChangeCode = `
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!editingTransaction) {
      if (newType === "expense") {
        setAccountId(localStorage.getItem('lastAccountId_expense') || accounts[0]?.id || "");
      } else if (newType === "income") {
        setAccountId(localStorage.getItem('lastAccountId_income') || accounts[0]?.id || "");
      } else if (newType === "transfer") {
        setFromAccountId(localStorage.getItem('lastAccountId_transfer_from') || accounts[0]?.id || "");
        setToAccountId(localStorage.getItem('lastAccountId_transfer_to') || accounts[1]?.id || accounts[0]?.id || "");
      }
    }
  };
`;
code = code.replace(/const openAddModal = \(\) => \{/, handleTypeChangeCode + '\n  const openAddModal = () => {');

// 2. Update openAddModal
code = code.replace(/setAccountId\(accounts\[0\]\?\.id \|\| ""\);/, "setAccountId(localStorage.getItem('lastAccountId_expense') || accounts[0]?.id || \"\");");
code = code.replace(/setFromAccountId\(accounts\[0\]\?\.id \|\| ""\);/, "setFromAccountId(localStorage.getItem('lastAccountId_transfer_from') || accounts[0]?.id || \"\");");
code = code.replace(/setToAccountId\(accounts\[1\]\?\.id \|\| accounts\[0\]\?\.id \|\| ""\);/, "setToAccountId(localStorage.getItem('lastAccountId_transfer_to') || accounts[1]?.id || accounts[0]?.id || \"\");");

// 3. Update buttons
code = code.replace(/onClick=\{\(\) => setType\("expense"\)\}/, 'onClick={() => handleTypeChange("expense")}');
code = code.replace(/onClick=\{\(\) => setType\("income"\)\}/, 'onClick={() => handleTypeChange("income")}');
code = code.replace(/onClick=\{\(\) => setType\("transfer"\)\}/, 'onClick={() => handleTypeChange("transfer")}');

// 4. Update selects to save to localStorage
// Rekening (expense/income)
code = code.replace(/onChange=\{\(e\) => setAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                      setAccountId(e.target.value);
                      localStorage.setItem(\`lastAccountId_\${type}\`, e.target.value);
                    }}`);

// Rekening Asal
code = code.replace(/onChange=\{\(e\) => setFromAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                        setFromAccountId(e.target.value);
                        localStorage.setItem('lastAccountId_transfer_from', e.target.value);
                      }}`);

// Rekening Tujuan
code = code.replace(/onChange=\{\(e\) => setToAccountId\(e\.target\.value\)\}/g, `onChange={(e) => {
                        setToAccountId(e.target.value);
                        localStorage.setItem('lastAccountId_transfer_to', e.target.value);
                      }}`);

// 5. Update Rekening Asal options to show balance
code = code.replace(
  /<option key=\{acc\.id\} value=\{acc\.id\}>\s*\{acc\.name\}\s*<\/option>/g,
  '<option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>'
);

fs.writeFileSync('src/components/Transactions.tsx', code);
