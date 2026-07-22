const fs = require('fs');
let code = fs.readFileSync('src/modules/pressing/components/PressingClosureManager.tsx', 'utf8');

// Remove the second declaration of dailyBalancesCollected
const duplicatedPart = `  const dailyBalancesCollected = useMemo(() => {
    return tickets.filter(t => {
      if (!t.balanceCollectedDate) return false;
      if (t.balanceCollectedDate === closureDate) return true;
      if (t.balanceCollectedDate.includes('T')) {
        try {
          if (format(new Date(t.balanceCollectedDate), 'yyyy-MM-dd') === closureDate) return true;
        } catch(e) {}
      }
      return false;
    });
  }, [tickets, closureDate]);`;

// Keep the first one which has startsWith(closureDate)
// Let's remove the duplicated one around lines 182-195
if (code.includes('const dailyBalancesCollected = useMemo')) {
  // Let's replace the whole file section or clean up duplicate
  console.log('Cleaning up duplicate dailyBalancesCollected...');
}

// Alternatively, let's restore PressingClosureManager from git checkout and apply clean patch
