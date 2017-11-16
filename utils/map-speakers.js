const flattenTree = require('./flatten-mdast-tree');
const _ = require('lodash');
const validate = require('./validate-fields.js');
const assign = require('./assign-values');
 
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
            
            // assign twitter handle if twitter is present
            if (validate.isTwitter(item)) {

                let handle = _.trim(item.text);

                // trim url of trailing / characters 
                // trim @ symbol from handle if included in url to avoid duplicates
                let url = _.trimEnd(item.href, '/').split('/');
                let urlHandle = _.trimStart(url[url.length - 1], '@');

                // if twitter url handle and text handle do not match, use the url handle
                // push a twitter error into format_errors array
                if ('@' + urlHandle.toLowerCase() !== handle.toLowerCase()) {
                    format_errors.push({
                        field: 'twitter',
                        message: 'twitter handle and url do not match',
                        raw: item.raw
                    });
                    twitter = '@' + urlHandle;
                    return;
                }
                twitter = handle;
                return;
            }

            // assign personal website if website is present
            if (validate.isWebsite(item)) {
        
                //if website is already defined, push url into additional links array
                if (website) {
                    links.push(item.href);
                    return;
                }

                website = item.href;
                return;
            }

            // assign location if location is present (if not, default is region)
            if (validate.isLocation(item)) {
               let place = item.text.split('Location - ')[1];

               if (!place) {
                   format_errors.push({
                    field: 'location',
                    message: 'format error',
                    raw: item.raw
                });
                   return;
               }

               location = place;
               return;
            }

            // add topics if present
            if (validate.isTopics(item)) {
                let topicString = item.text.split('Topics - ')[1];

                if (!topicString) {
                    format_errors.push({
                        field: 'topics',
                        message: 'format error',
                        raw: item.raw
                    });
                    return;
                }

                topics = topicString.split(',').map((topic) => {
                   return  _.trim(topic);
                });

                return;
            }

            // push other languages into languages array (default includes english)
            if (validate.isLanguages(item)) {
                let languageString = item.text.split('Languages besides English - ')[1];

                if (!languageString) {
                    format_errors.push({
                        field: 'languages',
                        message: 'format error',
                        raw: item.raw
                    });
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

            if (validate.isEmail(item)) {
                let emailRegex = /([\w\.]+)@([\w\.]+)\.(\w+)/;
                let address = item.text.match(emailRegex) || item.raw.match(emailRegex);
    
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
            console.error('Undefined field format for speaker ' + name);

            // if an item cannot be matched to a property, push it into undefined fields array with it's raw value
            undefined_fields.push({
                field: 'undefined',
                raw: item.raw || item.text
            });


        });

        let attributes = {
            name,
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