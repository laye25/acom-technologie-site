const fs = require('fs');
let code = fs.readFileSync('src/modules/pressing/components/PressingClosureManager.tsx', 'utf8');

const targetBlock = `  // Read direct database inputs
  const tickets = useMemo<PressingTicket[]>(() => {
    try {
      const saved = localStorage.getItem(\`pressing_tickets_\${merchant.id}\`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, closures]);

  const detergentSales = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(\`pressing_stock_sales_\${merchant.id}\`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id, closures]);`;

const replacementBlock = `  // Read direct database inputs
  const tickets = useMemo<PressingTicket[]>(() => {
    try {
      const saved = localStorage.getItem(\`pressing_tickets_\${merchant.id}\`);
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('📦 [PressingClosure] Loaded tickets from localStorage:', parsed.length, 'for closureDate:', closureDate);
      return parsed;
    } catch (err) {
      console.error('Error loading pressing tickets:', err);
      return [];
    }
  }, [merchant.id, closures, closureDate]);

  const detergentSales = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem(\`pressing_stock_sales_\${merchant.id}\`);
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('🛒 [PressingClosure] Loaded detergent sales:', parsed.length);
      return parsed;
    } catch (err) {
      console.error('Error loading detergent sales:', err);
      return [];
    }
  }, [merchant.id, closures, closureDate]);`;

const targetFilters = `  const dailyPressingTickets = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === 'quotation') return false;
      if (!t.depositDate) return false;
      if (t.depositDate === closureDate) return true;
      if (t.depositDate.includes('T')) {
        try {
          if (format(new Date(t.depositDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);`;

const replacementFilters = `  const dailyPressingTickets = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === 'quotation') return false;
      if (!t.depositDate) return false;
      if (t.depositDate === closureDate) return true;
      if (t.depositDate.startsWith(closureDate)) return true;
      if (t.depositDate.includes('T')) {
        try {
          if (format(new Date(t.depositDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);

  const dailyBalancesCollected = useMemo(() => {
    return tickets.filter(t => {
      if (!t.balanceCollectedDate) return false;
      if (t.balanceCollectedDate === closureDate) return true;
      if (t.balanceCollectedDate.startsWith(closureDate)) return true;
      if (t.balanceCollectedDate.includes('T')) {
        try {
          if (format(new Date(t.balanceCollectedDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);`;

let modified = false;
if (code.includes(targetBlock)) {
  code = code.replace(targetBlock, replacementBlock);
  modified = true;
  console.log('Successfully updated tickets & detergentSales loading.');
} else {
  console.log('Target block not found.');
}

if (code.includes(targetFilters)) {
  // We can also ensure dailyBalancesCollected is updated if needed
  code = code.replace(targetFilters, replacementFilters);
  modified = true;
  console.log('Successfully updated dailyPressingTickets filters.');
} else {
  console.log('Target filters not found.');
}

if (modified) {
  fs.writeFileSync('src/modules/pressing/components/PressingClosureManager.tsx', code);
  console.log('PressingClosureManager patched successfully.');
}
