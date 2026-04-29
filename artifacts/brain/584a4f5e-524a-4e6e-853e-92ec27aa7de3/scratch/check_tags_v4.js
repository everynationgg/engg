const fs = require('fs');
const content = fs.readFileSync('c:/project/engg/artifacts/every-nation/src/pages/Profile.tsx', 'utf8');

const lines = content.split('\n');
const stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openTags = line.match(/<([a-zA-Z0-9]+)(?:\s+[^>]*[^/])?>/g) || [];
    const closeTags = line.match(/<\/([a-zA-Z0-9]+)>/g) || [];
    const selfClosing = line.match(/<([a-zA-Z0-9]+)[^>]*\/>/g) || [];

    openTags.forEach(tag => {
        const name = tag.match(/<([a-zA-Z0-9]+)/)[1];
        stack.push({ name, line: i + 1 });
    });

    closeTags.forEach(tag => {
        const name = tag.match(/<\/([a-zA-Z0-9]+)/)[1];
        if (stack.length === 0) {
            console.log(`Error: Closing tag </${name}> at line ${i + 1} with no opening tag.`);
        } else {
            const last = stack.pop();
            if (last.name !== name) {
                console.log(`Error: Mismatch at line ${i + 1}. Expected </${last.name}> (from line ${last.line}), but found </${name}>.`);
            }
        }
    });
}

if (stack.length > 0) {
    console.log("Unclosed tags:");
    stack.forEach(tag => console.log(`${tag.name} (line ${tag.line})`));
} else {
    console.log("All tags balanced!");
}
