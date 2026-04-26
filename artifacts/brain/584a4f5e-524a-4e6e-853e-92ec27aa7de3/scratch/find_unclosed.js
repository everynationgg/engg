import fs from 'fs';

const content = fs.readFileSync('c:/project/engg/artifacts/end/src/pages/game/DiscussionPage.tsx', 'utf8');

let start = content.indexOf('return (', content.indexOf('const abilityResultText'));
let end = content.indexOf('function WingIcon');
let region = content.substring(start, end);

let stack = [];
let regex = /<([a-zA-Z0-9]+)|<\/([a-zA-Z0-9]+)>/g;
let match;

while ((match = regex.exec(region)) !== null) {
    let tag = match[1] || match[2];
    if (match[1]) {
        let tagStart = match.index;
        let tagEnd = region.indexOf('>', tagStart);
        let tagFull = region.substring(tagStart, tagEnd + 1);
        if (tagFull.endsWith('/>') || tag.toLowerCase() === 'img' || tag.toLowerCase() === 'br') {
            continue;
        }
        stack.push({tag: tag.toLowerCase(), index: match.index});
    } else {
        if (stack.length > 0) {
            let top = stack.pop();
            if (top.tag !== tag.toLowerCase()) {
                console.log(`Mismatched: <${top.tag}> and </${tag}>`);
            }
        }
    }
}

console.log('Unclosed tags:');
stack.forEach(s => console.log(s.tag));
