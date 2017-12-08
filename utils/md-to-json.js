const unified = require('unified');
const markdown = require('remark-parse');
const html = require('remark-html');
const assert = require('assert');

// trim whitespace/newline at the
// end of a string
// str -> str
function trimRight(value) {
  return value.replace(/\n+$/, '');
}

// map a markdown string to an object
// with `html` and `raw` fields
// str -> obj
function mdToJson(txt) {
  assert.equal(typeof txt, 'string', 'input should be a markdown string');

  const parser = unified().use(markdown);

  const toHtml = unified().use(markdown).use(html);

  // the parsed tokens from Markdown Abstract Syntax Tree format
  const tokens = parser.parse(txt).children;
  const results = {};
  let newKey = '';

  tokens.forEach((token, i) => {
    // make object keys from all headings
    if (token.type === 'heading') {
      newKey = token.children[0].value;

      // make sure that any headings that are also links are not undefined
      if (newKey === undefined && token.children[0].type === 'link') {
        newKey = token.children[0].children[0].value;
      }

      // check if heading value already exists as object key
      // if so, add a flag to mark it is a duplicate value and make it unique to assign to object
      // this flag will be removed later when we manipulate object data into array
      if (results[newKey]) {
        newKey = `${token.children[0].value}!DUPE+${i}`;
      }

      // create array to push all subsequent tokens (non-headings) into
      results[newKey] = [];
      return;
    }

    if (!newKey) return;

    // push any subsequent non-heading token into array
    results[newKey].push(token);
  });

  // parse array of subsequent tokens into raw or html strings
  Object.keys(results).forEach((key) => {
    const tree = {
      type: 'root',
      children: results[key],
    };

    results[key] = {
      html: trimRight(toHtml.stringify(tree)),
      mdast: tree,
    };
  });

  return results;
}


module.exports = mdToJson;
