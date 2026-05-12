const fs = require('fs');
const path = require('path');

function getBalancedEnd(str, startIdx) {
    let depth = 0;
    for (let i = startIdx; i < str.length; i++) {
        if (str[i] === '(') depth++;
        if (str[i] === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let totalFixed = 0;

walkDir('src', function(file) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let idx = 0;
    let newContent = '';
    let changed = false;

    while (true) {
        let matchIdx = content.indexOf('useLiveQuery(', idx);
        if (matchIdx === -1) {
            newContent += content.slice(idx);
            break;
        }

        let firstParen = matchIdx + 12; // index of '(' in 'useLiveQuery('
        let endParen = getBalancedEnd(content, firstParen);
        
        if (endParen !== -1) {
            let inside = content.slice(firstParen + 1, endParen);
            
            // Check if it already has a dependency array
            if (!/,\s*\[.*?\]\s*$/.test(inside) && !/,\s*[A-Za-z0-9_]+\s*$/.test(inside)) {
                newContent += content.slice(idx, endParen) + ', []';
                idx = endParen; // continue from endParen
                changed = true;
                totalFixed++;
                continue;
            }
        }
        
        newContent += content.slice(idx, matchIdx + 13);
        idx = matchIdx + 13;
    }

    if (changed) {
        fs.writeFileSync(file, newContent);
    }
});

console.log('Total fixed:', totalFixed);
