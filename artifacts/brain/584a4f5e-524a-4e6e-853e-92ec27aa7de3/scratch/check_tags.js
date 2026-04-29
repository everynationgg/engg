import fs from 'fs';

const content = fs.readFileSync('c:/project/engg/artifacts/end/src/pages/game/DiscussionPage.tsx', 'utf8');

let stack = [];
let regex = /<([a-zA-Z0-9]+)|<\/([a-zA-Z0-9]+)>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
        // Opening tag
        // Filter out self-closing or common non-closing in JSX if needed, but standard JSX tags should close.
        // Also skip fragment <>
        stack.push({tag: match[1], index: match.index});
    } else if (match[2]) {
        // Closing tag
        if (stack.length === 0) {
            console.log(`Unexpected closing tag: </${match[2]}> at index ${match.index}`);
        } else {
            let top = stack.pop();
            if (top.tag !== match[2]) {
                console.log(`Mismatched tags: <${top.tag}> at ${top.index} and </${match[2]}> at ${match.index}`);
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed tag: <${s.tag}> at index ${s.index}`));
}
