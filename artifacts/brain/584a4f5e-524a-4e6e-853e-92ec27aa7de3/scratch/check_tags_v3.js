const fs = require('fs');
const content = fs.readFileSync('c:/project/engg/artifacts/every-nation/src/pages/Profile.tsx', 'utf8');

const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/);
if (!mainMatch) {
    console.log("No <main> found");
} else {
    const mainContent = mainMatch[1];
    const openDivs = (mainContent.match(/<div/g) || []).length;
    const closeDivs = (mainContent.match(/<\/div/g) || []).length;
    console.log(`Main Content - Open Divs: ${openDivs}, Close Divs: ${closeDivs}`);

    const openSections = (mainContent.match(/<section/g) || []).length;
    const closeSections = (mainContent.match(/<\/section/g) || []).length;
    console.log(`Main Content - Open Sections: ${openSections}, Close Sections: ${closeSections}`);
}
