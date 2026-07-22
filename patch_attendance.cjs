const fs = require('fs');
let code = fs.readFileSync('src/components/Attendance.tsx', 'utf8');

// Replace the hook initialization
code = code.replace(
  /const \[saveSalaryAccountId, setSaveSalaryAccountId\] = useState\(""\);/,
  "const [saveSalaryAccountId, setSaveSalaryAccountId] = useState(localStorage.getItem('lastAccountId_gaji') || \"\");"
);

// Replace the onChange for saveSalaryAccountId
code = code.replace(
  /onChange=\{\(e\) => setSaveSalaryAccountId\(e\.target\.value\)\}/,
  `onChange={(e) => {
                  setSaveSalaryAccountId(e.target.value);
                  localStorage.setItem('lastAccountId_gaji', e.target.value);
                }}`
);

// Set default value explicitly in the modal open function if we need to.
// Wait, isSaveSalaryModalOpen is true when we want to open it.

// Just to be safe, if accounts is loaded but local storage isn't set, we can default to accounts[0].id
// Or just let it be empty until they select, but the requirement is "by default nya adalah yang terakhir di gunakan."
// If last used is empty, then empty is fine.

fs.writeFileSync('src/components/Attendance.tsx', code);
