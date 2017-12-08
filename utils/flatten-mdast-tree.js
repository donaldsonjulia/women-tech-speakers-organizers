const toString = require('mdast-util-to-string');

function flattenTree(tree) {
  const flatList = [];

  const listItems = tree.children[0].children; // get list-item nodes from parent root


  listItems.forEach((li) => {
    const content = {
      href: '',
      text: '',
      mixed: [],
      raw: toString(li),
    };

    // if list item is the parent node to only one paragraph node,
    // create content object that reflects the inner text
    // and also lists the url if the text is a link
    if (li.children[0].children.length === 1) {
      const innerListItem = li.children[0].children[0];

      if (innerListItem.type === 'link') {
        const link = li.children[0].children[0];
        content.href = link.url;
        content.text = link.children[0].value;
      }

      if (innerListItem.type === 'text') {
        content.href = null;
        content.text = innerListItem.value;
      }
    }

    // if there are multiple nodes inside a list item, push each node's value into content.mixed
    if (li.children[0].children.length > 1) {
      const nodes = li.children[0].children;
      nodes.forEach((node) => {
        if (node.type === 'link') {
          content.mixed.push({
            href: node.url,
            text: node.children[0].value,
          });
        } else if (node.type === 'text') {
          content.mixed.push({
            href: null,
            text: node.value,
          });
        }
      });
    }


    flatList.push(content);
  });

  return flatList;
}

module.exports = flattenTree;
