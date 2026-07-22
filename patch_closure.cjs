const fs = require('fs');
let code = fs.readFileSync('src/modules/pressing/components/PressingClosureManager.tsx', 'utf8');

// 1. Make Date filtering robust
code = code.replace(
  "return tickets.filter(t => t.depositDate === closureDate && t.status !== 'quotation');",
  `return tickets.filter(t => {
      if (t.status === 'quotation') return false;
      if (!t.depositDate) return false;
      if (t.depositDate === closureDate) return true;
      if (t.depositDate.includes('T')) {
        try {
          if (format(new Date(t.depositDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });`
);

code = code.replace(
  "return tickets.filter(t => t.balanceCollectedDate === closureDate);",
  `return tickets.filter(t => {
      if (!t.balanceCollectedDate) return false;
      if (t.balanceCollectedDate === closureDate) return true;
      if (t.balanceCollectedDate.includes('T')) {
        try {
          if (format(new Date(t.balanceCollectedDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });`
);

code = code.replace(
  "return detergentSales.filter(s => s.date && s.date.startsWith(closureDate));",
  `return detergentSales.filter(s => {
      if (!s.date) return false;
      if (s.date.startsWith(closureDate)) return true;
      if (s.date.includes('T')) {
        try {
          if (format(new Date(s.date), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });`
);

code = code.replace(
  `    return expenses.filter(e => {
      if (e.date && e.date.startsWith(closureDate)) return true;
      if (e.createdAt && new Date(e.createdAt).toISOString().startsWith(closureDate)) return true;
      return false;
    });`,
  `    return expenses.filter(e => {
      if (e.date && e.date.startsWith(closureDate)) return true;
      if (e.createdAt) {
        try {
           if (format(new Date(e.createdAt), 'yyyy-MM-dd') === closureDate) return true;
        } catch(err) {}
      }
      return false;
    });`
);

// 2. Parse Float Securely
code = code.replace(
  `    return dailyPressingTickets.reduce((sum, t) => {
      const atDeposit = t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0);
      return sum + atDeposit;
    }, 0);`,
  `    return dailyPressingTickets.reduce((sum, t) => {
      let atDeposit = 0;
      if (t.amountPaidAtDeposit !== undefined && t.amountPaidAtDeposit !== null) {
        atDeposit = parseFloat(String(t.amountPaidAtDeposit));
      } else if (t.amountPaid !== undefined && t.amountPaid !== null) {
        atDeposit = parseFloat(String(t.amountPaid));
      }
      if (isNaN(atDeposit)) atDeposit = 0;
      return sum + atDeposit;
    }, 0);`
);

code = code.replace(
  "return dailyBalancesCollected.reduce((sum, t) => sum + (t.balanceCollectedAmount || 0), 0);",
  `return dailyBalancesCollected.reduce((sum, t) => {
      let balance = parseFloat(String(t.balanceCollectedAmount));
      if (isNaN(balance)) balance = 0;
      return sum + balance;
    }, 0);`
);

code = code.replace(
  "return dailyDetergentSales.reduce((sum, s) => sum + (s.total || 0), 0);",
  `return dailyDetergentSales.reduce((sum, s) => {
      let total = parseFloat(String(s.total));
      if (isNaN(total)) total = 0;
      return sum + total;
    }, 0);`
);

code = code.replace(
  "return dailyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);",
  `return dailyExpenses.reduce((sum, e) => {
      let amount = parseFloat(String(e.amount));
      if (isNaN(amount)) amount = 0;
      return sum + amount;
    }, 0);`
);

fs.writeFileSync('src/modules/pressing/components/PressingClosureManager.tsx', code);
