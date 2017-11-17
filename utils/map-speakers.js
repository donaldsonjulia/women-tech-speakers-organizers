const flattenTree = require('./flatten-mdast-tree');
const _ = require('lodash');
const validate = require('./validate-fields.js');
const getValues = require('./get-values');
const FormatError = require('./format-error-constructor');
 
// flatten MDAST trees and attach flat data to each object
// and remove MDAST tree from object to declutter
function mapSpeakers(array) {
    return array.map((person, i) => {

        if (person.type !== 'speaker') {
            console.error('Cannot map person as speaker. Type does not match.');
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
                try {
                    twitter = getValues.twitter(item);
                } catch (err) {
                    format_errors.push(err);
                }   
                return;
            }

            // assign personal website if website is present
            if (validate.isWebsite(item)) {
                let site = {
                    title: item.text,
                    href: item.href
                }
                //if website is already defined, push url into additional links array
                if (website) {
                    links.push(site);
                    return;
                }

                website = site;
                return;
            }

            // assign location if present (if not, default is region)
            if (validate.isLocation(item)) {
                try {
                    location = getValues.location(item);
                } catch (err) {
                    format_errors.push(err);
                }
                return;
            }

            // assign topics if present
            if (validate.isTopics(item)) {
                try {
                    topics = getValues.topics(item);
                } catch (err) {
                    format_errors.push(err);
                }
                return;
            }

            // assign languages array if additional languages present (default is ['English'])
            if (validate.isLanguages(item)) {
                try {
                    languages = getValues.languages(item);
                } catch (err) {
                    format_errors.push(err);
                }
                return;
            }

            // assign email address array if addresses are present
            if (validate.isEmail(item)) {
                try {
                    let addresses = getValues.emails(item);
                    addresses.forEach((address) => {
                        email.push(address);
                    });
                } catch (err) {
                    format_errors.push(err);
                }
                return;
            }

         
            // if an item cannot be matched to a property, log error
            console.error('Undefined field for speaker ' + name);
            // if an item cannot be matched to a property, push it into undefined fields array with it's raw value
            undefined_fields.push( new FormatError('', item, 'unknown field, format not recognized'));

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