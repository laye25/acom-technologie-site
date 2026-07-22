const fs = require('fs');
let code = fs.readFileSync('src/modules/pressing/components/PressingClosureManager.tsx', 'utf8');

const targetDepositsRevenue = `  const dailyDepositsRevenue = useMemo(() => {
    return dailyPressingTickets.reduce((sum, t) => {
      let atDeposit = 0;
      if (t.amountPaidAtDeposit !== undefined && t.amountPaidAtDeposit !== null) {
        atDeposit = parseFloat(String(t.amountPaidAtDeposit));
      } else if (t.amountPaid !== undefined && t.amountPaid !== null) {
        atDeposit = parseFloat(String(t.amountPaid));
      }
      if (isNaN(atDeposit)) atDeposit = 0;
      return sum + atDeposit;
    }, 0);
  }, [dailyPressingTickets]);`;

const replacementDepositsRevenue = `  const dailyDepositsRevenue = useMemo(() => {
    return dailyPressingTickets.reduce((sum, t) => {
      let atDeposit = 0;
      if (t.amountPaidAtDeposit !== undefined && t.amountPaidAtDeposit !== null && !isNaN(parseFloat(String(t.amountPaidAtDeposit)))) {
        atDeposit = parseFloat(String(t.amountPaidAtDeposit));
      } else if (t.amountPaid !== undefined && t.amountPaid !== null && !isNaN(parseFloat(String(t.amountPaid)))) {
        atDeposit = parseFloat(String(t.amountPaid));
      } else if (t.paymentStatus === 'paid') {
        atDeposit = parseFloat(String(t.total || 0));
      } else if (t.paymentStatus === 'partial') {
        atDeposit = parseFloat(String(t.total || 0)) / 2;
      } else {
        atDeposit = t.paymentStatus === 'unpaid' ? 0 : parseFloat(String(t.total || 0));
      }
      if (isNaN(atDeposit)) atDeposit = 0;
      return sum + atDeposit;
    }, 0);
  }, [dailyPressingTickets]);`;

const targetTheoretical = `  const totalTheoreticalRevenue = useMemo(() => {
    return Math.max(0, dailyPressingRevenue + dailyDetergentRevenue - dailyExpensesTotal);
  }, [dailyPressingRevenue, dailyDetergentRevenue, dailyExpensesTotal]);`;

const replacementTheoretical = `  const totalTheoreticalRevenue = useMemo(() => {
    return dailyPressingRevenue + dailyDetergentRevenue - dailyExpensesTotal;
  }, [dailyPressingRevenue, dailyDetergentRevenue, dailyExpensesTotal]);`;

let modified = false;
if (code.includes(targetDepositsRevenue)) {
  code = code.replace(targetDepositsRevenue, replacementDepositsRevenue);
  modified = true;
  console.log('Successfully replaced dailyDepositsRevenue calculation.');
} else {
  console.log('Target dailyDepositsRevenue not found exactly.');
}

if (code.includes(targetTheoretical)) {
  code = code.replace(targetTheoretical, replacementTheoretical);
  modified = true;
  console.log('Successfully replaced totalTheoreticalRevenue calculation.');
} else {
  console.log('Target totalTheoreticalRevenue not found exactly.');
}

if (modified) {
  fs.writeFileSync('src/modules/pressing/components/PressingClosureManager.tsx', code);
  console.log('PressingClosureManager updated successfully.');
}
