import fs from 'fs';

const content = fs.readFileSync('c:/project/engg/artifacts/end/src/pages/game/DiscussionPage.tsx', 'utf8');

let stack = [];
let regex = /<([a-zA-Z0-9]+)|<\/([a-zA-Z0-9]+)>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    let tag = match[1] || match[2];
    if (['div', 'button', 'svg', 'p', 'style', 'span', 'h3', 'img', 'path'].includes(tag.toLowerCase())) {
        if (match[1]) {
            let tagStart = match.index;
            let tagEnd = content.indexOf('>', tagStart);
            let tagFull = content.substring(tagStart, tagEnd + 1);
            if (tagFull.endsWith('/>')) {
                continue;
            }
            stack.push({tag: tag.toLowerCase(), index: match.index, line: content.substring(0, match.index).split('\n').length});
        } else {
            if (stack.length === 0) {
                console.log(`Unexpected closing tag: </${tag}> at line ${content.substring(0, match.index).split('\n').length}`);
            } else {
                let top = stack.pop();
                if (top.tag !== tag.toLowerCase()) {
                    console.log(`Mismatched tags: <${top.tag}> at line ${top.line} and </${tag}> at line ${content.substring(0, match.index).split('\n').length}`);
                }
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed tag: <${s.tag}> at line ${s.line}`));
}
