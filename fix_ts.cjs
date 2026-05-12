const ts = require('typescript');
const fs = require('fs');

function fixFile(filePath) {
    let sourceText = fs.readFileSync(filePath, 'utf8');
    let sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

    const edits = [];

    function visit(node) {
        if (ts.isCallExpression(node)) {
            if (ts.isIdentifier(node.expression) && node.expression.text === 'useLiveQuery') {
                if (node.arguments.length === 1) {
                    // Add second argument `[]`
                    const lastArg = node.arguments[0];
                    edits.push({
                        pos: lastArg.end,
                        text: ', []'
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (edits.length > 0) {
        edits.sort((a, b) => b.pos - a.pos); // Sort backwards so inserts don't affect previous indices
        let newText = sourceText;
        for (let edit of edits) {
            newText = newText.slice(0, edit.pos) + edit.text + newText.slice(edit.pos);
        }
        fs.writeFileSync(filePath, newText);
        console.log(`Fixed ${edits.length} calls in ${filePath}`);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = require('path').join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walkDir(p);
        } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            fixFile(p);
        }
    });
}

walkDir('src');
