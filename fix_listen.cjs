const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// If we find both app.listen and httpServer.listen or server.listen
if (code.includes('app.listen(') && (code.includes('server.listen(') || code.includes('httpServer.listen('))) {
    console.log('Found multiple listens, removing app.listen');
    code = code.replace(/app\.listen\([^)]+\)\s*;?/g, '// app.listen removed');
    fs.writeFileSync('server.ts', code);
}
