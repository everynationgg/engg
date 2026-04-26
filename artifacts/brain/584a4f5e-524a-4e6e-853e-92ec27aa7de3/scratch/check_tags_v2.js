import fs from 'fs';

const content = fs.readFileSync('c:/project/engg/artifacts/end/src/pages/game/DiscussionPage.tsx', 'utf8');

// Focus only on div, button, svg, p tags within the DiscussionPage function (approx index 0 to 38000)
let region = content.substring(0, content.indexOf('function WingIcon'));
let stack = [];
let regex = /<([a-zA-Z0-9]+)|<\/([a-zA-Z0-9]+)>/g;
let match;

while ((match = regex.exec(region)) !== null) {
    let tag = match[1] || match[2];
    if (['div', 'button', 'svg', 'p', 'style', 'span', 'h3'].includes(tag.toLowerCase())) {
        if (match[1]) {
            // Check if it's self-closing (approx check)
            let tagStart = match.index;
            let tagEnd = region.indexOf('>', tagStart);
            let tagFull = region.substring(tagStart, tagEnd + 1);
            if (tagFull.endsWith('/>')) {
                continue;
            }
            stack.push({tag: tag.toLowerCase(), index: match.index, line: region.substring(0, match.index).split('\n').length});
        } else {
            if (stack.length === 0) {
                console.log(`Unexpected closing tag: </${tag}> at line ${region.substring(0, match.index).split('\n').length}`);
            } else {
                let top = stack.pop();
                if (top.tag !== tag.toLowerCase()) {
                    console.log(`Mismatched tags: <${top.tag}> at line ${top.line} and </${tag}> at line ${region.substring(0, match.index).split('\n').length}`);
                }
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed tag: <${s.tag}> at line ${s.line}`));
}
