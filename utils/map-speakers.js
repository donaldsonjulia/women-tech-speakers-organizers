const flattenTree = require('./flatten-mdast-tree');
const _ = require('lodash');
 
// flatten MDAST trees and attach flat data to each object
// and remove MDAST tree from object to declutter
function mapSpeakers(array) {
    return array.map((person) => {

        if (person.category !== 'speaker') {
            console.error('Cannot map person as speaker. Category does not match.');
        }

        // flatten mdast tree into array
        let tree = person.mdast;
        let flatArray = flattenTree(tree);

        // define default values to be assigned to each speaker
        let name = person.name,
            category = person.category,
            region = person.region,
            twitter = '',
            website = '',
            location = person.region,
            topics = [],
            languages = ['English'],
            html = person.html;


        flatArray.forEach((item) => {
            let isTwitterHandle = /^@[a-z0-9_]+/i;
            let isTwitterUrl = /^(http(s)?:\/\/)?(www\.)?twitter\.com\/[a-z0-9_]+/i;
            let isUrl = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
            let isLocation = /^Location/;
            let isTopics = /^Topics/;
            let isLanguages = /^Languages besides English/;
            
            // assign twitter handle if twitter is present
            if (isTwitterUrl.test(item.href) && isTwitterHandle.test(item.text)) {
                let url = item.href.split('/');
                let urlHandle = url[url.length - 1];
                if ('@' + urlHandle !== item.text) {
                    console.error('FORMAT WARNING: Twitter handle and url do not match for speaker ' + name);
                    twitter = '@' + urlHandle;
                    return;
                }
                twitter = item.text;
                return;
            }

            // assign personal website if website is present
            if (isUrl.test(item.href) && !isTwitterUrl.test(item.href)) {
                website = item.href;
                return;
            }

            // assign location if location is present (if not, default is region)
            if (isLocation.test(item.text)) {
               let place = item.text.split('Location - ')[1];

               if (place === '' || place === undefined) {
                   console.error('FORMAT ERROR: LOCATION for speaker ' + name);
                   return;
               }

               location = place;
               return;
            }

            // add topics if present
            if (isTopics.test(item.text)) {
                let topicString = item.text.split('Topics - ')[1];

                if (topicString === '' || topicString === undefined) {
                    console.error('FORMAT ERROR: TOPICS for speaker ' + name);
                    return;
                }

                topics = topicString.split(',').map((topic) => {
                   return  _.trim(topic);
                });

                return;
            }

            // push other languages into languages array (default includes english)
            if (isLanguages.test(item.text)) {
                let languageString = item.text.split('Languages besides English - ')[1];

                if (languageString === '' || languageString === undefined) {
                    console.error('FORMAT ERROR: LANGUAGES for speaker ' + name);
                    return;
                }

                otherLanguages = languageString.split(',').map((lang) => {
                   return  _.trim(lang);
                });

                otherLanguages.forEach((lang) => {
                    languages.push(lang);
                });

                return;
            }

         
            // if an item cannot be matched to a property, log error
            console.error('FORMAT ERROR: Undefined error for speaker ' + name + ':', item.raw || item.text);

        });


        person = {
            name,
            category,
            region,
            twitter,
            website,
            location,
            topics,
            languages,
            html
        };  

        return person;        
    });
}



module.exports = mapSpeakers;