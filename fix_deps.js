const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We capture useLiveQuery(() => ...) 
    let newContent = content.replace(/useLiveQuery\(\s*(?:async\s+)?\(\)\s*=>\s*\{?[^,}]+\}?\s*\)/g, (match) => {
        // If it already has a dependency array at the end, it wouldn't match because we ensure no comma before the last parenthesis.
        // Wait, the regex [^,}]+ might fail on nested things. Let's use a smarter approach:
        return match;
    });

    let lines = content.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Match simple cases: useLiveQuery(() => db.orders.toArray()) || [];
        // but watch out, some are multiline.
        
        // Simple case:
        if (line.includes('useLiveQuery(') && line.includes('=>') && !line.includes(', [') && line.endsWith(') || [];')) {
            lines[i] = line.replace(/\)\s*\|\|\s*\[\];/, ', []) || [];');
            changed = true;
        } else if (line.includes('useLiveQuery(') && line.includes('=>') && !line.includes(', [') && line.endsWith(')) || [];')) {
            lines[i] = line.replace(/\)\)\s*\|\|\s*\[\];/, '), []) || [];');
            changed = true;
        } else if (line.includes('useLiveQuery(') && line.includes('=>') && !line.includes(', [') && line.match(/\)$/)) {
            // maybe ends with )
            // lines[i] = line.replace(/\)$/, ', [])');
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, lines.join('\n'));
        modifiedFiles++;
    }
  }
});
console.log(`Modified ${modifiedFiles} files.`);
