const remark = require('remark');
const report = require('vfile-reporter');
const fs = require('fs-extra');


let readme = fs.readFileSync('./README.md').toString();    

// check readme for syntax mistakes 
// TODO: review all remark lint plugins/presets to determine which are best to use for linting this project
remark()
    .use(require('remark-lint-hard-break-spaces'))
    .use(require('remark-lint-no-duplicate-definitions'))
    .use(require('remark-lint-no-heading-content-indent'))
    .use(require('remark-lint-no-inline-padding'))
    .use(require('remark-lint-no-shortcut-reference-image'))
    .use(require('remark-lint-no-shortcut-reference-link'))
    .use(require('remark-lint-no-undefined-references'))
    .use(require('remark-lint-no-unused-definitions'))
    .use(require('remark-lint-no-literal-urls'))
    .use(require('remark-lint-final-newline'))
    .process(readme, (err, file) => {
        console.error(report(err || file));
    });