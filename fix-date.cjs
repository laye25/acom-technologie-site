const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');
const search1 = `    const getIsoDate = (date: void | any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date.toDate) return date.toDate().toISOString();
      if (date instanceof Date) return date.toISOString();
      return '';
    };`.replace('void | any', 'any');
const search2 = `    const getIsoDate = (date: void | any) => {
      if (!date) return null;
      if (typeof date === 'string') return new Date(date);
      if (date && typeof date.toDate === 'function') return date.toDate();
      if (date && typeof date === 'object' && date.seconds !== undefined) return new Date(date.seconds * 1000);
      if (date instanceof Date) return date;
      return null;
    };`.replace('void | any', 'any');

const replace1 = `    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date && typeof date.toDate === 'function') return date.toDate().toISOString();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000).toISOString();
        if (date._seconds !== undefined) return new Date(date._seconds * 1000).toISOString();
      }
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'number') return new Date(date).toISOString();
      return '';
    };`;
const replace2 = `    const getIsoDate = (date: any) => {
      if (!date) return null;
      if (typeof date === 'string') return new Date(date);
      if (date && typeof date.toDate === 'function') return date.toDate();
      if (date && typeof date === 'object') {
        if (date.seconds !== undefined) return new Date(date.seconds * 1000);
        if (date._seconds !== undefined) return new Date(date._seconds * 1000);
      }
      if (date instanceof Date) return date;
      if (typeof date === 'number') return new Date(date);
      return null;
    };`;

content = content.split(search1).join(replace1);
content = content.split(search2).join(replace2);
fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
