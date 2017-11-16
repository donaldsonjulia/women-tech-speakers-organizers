const flattenTree = require('./flatten-mdast-tree');
const _ = require('lodash');
 
// flatten MDAST trees and attach flat data to each object
// and remove MDAST tree from object to declutter
function mapSpeakers(array) {
    return array.map((person, i) => {

        

        if (person.type !== 'speaker') {
            console.error('Cannot map person as speaker. Category does not match.');
        }

        // flatten mdast tree into array
        let tree = person.mdast;
        let flatArray = flattenTree(tree);

        // define default values to be assigned to each speaker
        let name = person.name,
            type = person.type,
            region = person.region,
            twitter = '',
            website = '',
            email = [],
            location = person.region,
            topics = [],
            languages = ['English'],
            links = [],
            html = person.html;

        let undefined_fields = [];
        let format_errors = [];
 
        flatArray.forEach((item) => {
            // regex patterns
            let isTwitterHandle = /^@[a-z0-9_]+/i,
                isTwitterUrl = /^(http(s)?:\/\/)?(www\.)?twitter\.com\/[a-z0-9_@\/]+/i,
                isUrl = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i,
                isLocation = /^Location/,
                isTopics = /^Topics/,
                isLanguages = /^Languages besides English/;
                hasEmailAddress = /([\w\.]+)@([\w\.]+)\.(\w+)/g;
                mentionsEmail = /e-?mail/ig;

            
            // assign twitter handle if twitter is present
            if (isTwitterUrl.test(item.href) && isTwitterHandle.test(item.text)) {

                // trim url of trailing / characters and trim @ symbol from handle if included in url
                let url = _.trimEnd(item.href, '/').split('/');
                let urlHandle = _.trimStart(url[url.length - 1], '@'); 

                // if twitter url handle and text handle do not match, use the url handle
                // push a twitter error into format_errors array
                if ('@' + urlHandle !== item.text) {
                    format_errors.push({
                        field: 'twitter',
                        message: 'twitter handle and url do not match'
                    });
                    twitter = '@' + urlHandle;
                    return;
                }
                twitter = item.text;
                return;
            }

            // assign personal website if website is present
            if (isUrl.test(item.href) && !isTwitterUrl.test(item.href)) {
        
                //if website is already defined, push url into additional links array
                if (website) {
                    links.push(item.href);
                    return;
                }

                website = item.href;
                return;
            }

            // assign location if location is present (if not, default is region)
            if (isLocation.test(item.text)) {
               let place = item.text.split('Location - ')[1];

               if (!place) {
                   format_errors.push({
                    field: 'location',
                    message: 'format error'
                });
                   console.error('FORMAT ERROR: LOCATION for speaker ' + name);
                   return;
               }

               location = place;
               return;
            }

            // add topics if present
            if (isTopics.test(item.text)) {
                let topicString = item.text.split('Topics - ')[1];

                if (!topicString) {
                    format_errors.push({
                        field: 'topics',
                        message: 'format error'
                    });
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

                if (!languageString) {
                    format_errors.push({
                        field: 'topics',
                        message: 'format error'
                    });
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

            if (mentionsEmail.test(item.text) || mentionsEmail.test(item.raw) || hasEmailAddress.test(item.text) || hasEmailAddress.test(item.raw)) {
                let address = item.text.match(hasEmailAddress);
    
                if (!address) {
                    format_errors.push({
                        field: 'email',
                        message: 'format error',
                        raw: item.raw
                    });
                    return;
                }
                email.push(address);
                return;
            }

         
            // if an item cannot be matched to a property, log error
            console.error('FORMAT ERROR: Undefined error for speaker ' + name);

            // if an item cannot be matched to a property, push it into undefined fields array with it's raw value
            undefined_fields.push({
                raw: item.raw || item.text
            });


        });

        let attributes = {
            name,
            // type,
            region,
            twitter,
            website,
            email,
            location,
            topics,
            languages,
            links
        };

        let missing_fields = [];

        // check for falsey values for all data attributes, if falsey then add key name to missing fields
        Object.entries(attributes).forEach(([key, value]) => {
            if (!value || value === []) {
                if (key === 'links') return; // additional links are not listed in suggested format for speaker
                if (key === 'email') return; // email is not listed in suggested format for speaker
                missing_fields.push(key);
            }

        });

        // the returned person object includes data and meta-data 
        person = {
            type: person.type,
            id: i + 1,
            attributes,
            meta: {     
                html,
                format_errors,
                missing_fields,
                undefined_fields
            },
        }; 

        return person;        
    });
}



module.exports = mapSpeakers;