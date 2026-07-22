const fs = require('fs');
let code = fs.readFileSync('src/modules/pressing/components/PressingClosureManager.tsx', 'utf8');

// We want to make sure tickets and detergentSales load correctly and dailyPressingTickets & dailyBalancesCollected are defined once cleanly.
// Let's replace the whole section from `// Read direct database inputs` down to `const dailyBalancesRevenue` with a clean, unified version.

const oldSectionStart = '// Read direct database inputs';
const oldSectionEnd = 'const dailyBalancesRevenue = useMemo(() => {';

const startIndex = code.indexOf(oldSectionStart);
const endIndex = code.indexOf(oldSectionEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `// Read direct database inputs
  const tickets = useMemo<PressingTicket[]>(() => {
    try {
      const saved = localStorage.getItem(\`pressing_tickets_\${merchant.id}\`);
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('📦 [PressingClosure] Loaded tickets:', parsed.length, 'for date:', closureDate);
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
      console.log('🛒 [PressingClosure] Loaded sales:', parsed.length);
      return parsed;
    } catch (err) {
      console.error('Error loading detergent sales:', err);
      return [];
    }
  }, [merchant.id, closures, closureDate]);

  // Fetch local expenses using safe useLiveQuery
  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];

  const products = useMemo(() => {
    try {
      const saved = localStorage.getItem(\`pressing_stock_products_\${merchant.id}\`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [merchant.id]);

  const lowStockItems = useMemo(() => products.filter((p: any) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= (Number(p.minStock) || 5)), [products]);
  const outOfStockItems = useMemo(() => products.filter((p: any) => Number(p.stock || 0) <= 0), [products]);

  // Memos for daily stats
  const dailyPressingTickets = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === 'quotation') return false;
      if (!t.depositDate) return false;
      if (t.depositDate === closureDate || t.depositDate.startsWith(closureDate)) return true;
      if (t.depositDate.includes('T')) {
        try {
          if (format(new Date(t.depositDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);

  const dailyDepositsRevenue = useMemo(() => {
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
  }, [dailyPressingTickets]);

  const dailyBalancesCollected = useMemo(() => {
    return tickets.filter(t => {
      if (!t.balanceCollectedDate) return false;
      if (t.balanceCollectedDate === closureDate || t.balanceCollectedDate.startsWith(closureDate)) return true;
      if (t.balanceCollectedDate.includes('T')) {
        try {
          if (format(new Date(t.balanceCollectedDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);

  const dailyBalancesRevenue = useMemo(() => {
`;

  code = code.substring(0, startIndex) + newSection + code.substring(endIndex + oldSectionEnd.length);
  fs.writeFileSync('src/modules/pressing/components/PressingClosureManager.tsx', code);
  console.log('PressingClosureManager cleaned and patched successfully.');
} else {
  console.log('Could not find start or end index.');
}
