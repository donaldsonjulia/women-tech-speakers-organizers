function flattenTree(tree) {
    let flatList = []; 

    let listItems = tree.children[0].children; // get list-item nodes from parent root
    

   listItems.forEach((li, i) => {
        let content = {
            href: '',
            text: ''
        };

        // if list item is the parent node to only one paragraph node,
        // create content object that reflects the inner text
        // and also lists the url if the text is a link
        if (li.children[0].children.length === 1) { 

            let innerListItem = li.children[0].children[0]; 
            
                if ( innerListItem.type === 'link' ) {
                    let link = li.children[0].children[0];
                    content.href = link.url;
                    content.text = link.children[0].value;
                }
        
                if ( innerListItem.type === 'text' ) {
                    content.href = null;
                    content.text = innerListItem.value;
                }
        }

        if (li.children[0].children.length > 1) {
            // TODO: need to deal with cases where there are multiple nodes inside the list item's paragraph...
        }

       
        
        flatList.push(content);
   });
    
    return flatList;
}

module.exports = flattenTree;
