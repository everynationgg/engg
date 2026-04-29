import fs from 'fs';

const content = fs.readFileSync('c:/project/engg/artifacts/end/src/pages/game/DiscussionPage.tsx', 'utf8');

let stack = [];
let line = 1;
for (let i = 0; i < content.length; i++) {
    let char = content[i];
    if (char === '\n') line++;
    if (char === '{') stack.push({char, line});
    if (char === '}') {
        if (stack.length === 0) {
            console.log(`Unexpected } at line ${line}`);
        } else {
            stack.pop();
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed { at line ${s.line}`));
}
