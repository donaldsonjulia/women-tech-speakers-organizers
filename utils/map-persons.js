const flattenTree = require('./flatten-mdast-tree');
const _ = require('lodash');
const validate = require('./validate-fields.js');
const getValues = require('./get-values');
const FormatError = require('./format-error-constructor');
 
// flatten MDAST trees and attach flat data to each object
// and remove MDAST tree from object to declutter
function mapPersons(array) {
    return array.map((person, i) => {

        // flatten mdast tree into array
        let tree = person.mdast;
        let flatArray = flattenTree(tree);

        // define default values to be assigned to each person
        let name = person.name,
            type = person.type,
            region = person.region,
            twitter = '',
            personal_website = '',
            email = [],
            location = person.region,
            topics = [],
            languages = ['English'],
            links = [],
            about = '',
            how_to_contact = '',
            html = person.html;

        let undefined_fields = [];
        let format_errors = [];
        
        // will update this to keep track of ordered info
        // like organizer's groups followed by group focus on next line
        let lastAssignedValue = ''; 
 
        flatArray.forEach((item, index) => {
            
            // assign twitter handle if twitter is present
            if (validate.isTwitter(item)) {
                try {
                    twitter = getValues.twitter(item);
                    lastAssignedValue = 'twitter';
                } catch (err) {
                    format_errors.push(err);
                    lastAssignedValue = 'error';
                }   
                return;
            }

            // assign personal website if website is present and person is NOT an organizer
            if (validate.isWebsite(item) && person.type !== 'organizer') {
                let site = {
                    title: item.text,
                    href: item.href
                }
                //if website is already defined, push url into additional links array
                if (personal_website) {
                    links.push(site);
                    lastAssignedValue = 'link';
                    return;
                }

                personal_website = site;
                lastAssignedValue = 'personal_website';
                return;
            }

            // assign location if present (if not, default is region)
            if (validate.isLocation(item)) {
                try {
                    location = getValues.location(item);
                    lastAssignedValue = 'location';
                } catch (err) {
                    format_errors.push(err);
                    lastAssignedValue = 'error';
                }
                return;
            }

            // assign topics if present
            if (validate.isTopics(item)) {
                try {
                    topics = getValues.topics(item);
                    lastAssignedValue = 'topics';
                } catch (err) {
                    format_errors.push(err);
                    lastAssignedValue = 'error';
                }
                return;
            }

            // assign languages array if additional languages present (default is ['English'])
            if (validate.isLanguages(item)) {
                try {
                    languages = getValues.languages(item);
                    lastAssignedValue = 'languages';
                } catch (err) {
                    format_errors.push(err);
                    lastAssignedValue = 'error';
                }
                return;
            }

            // assign how_to_contact if present 
            // note - this allows the item to also pass through email validation afterwards
            if (validate.isHowToContact(item)) {
                console.log(item.text);
                try {
                    how_to_contact = getValues.howToContact(item);
                } catch (err) {
                    format_errors.push(err);
                    lastAssignedValue = 'how_to_contact';
                }
            }

            // assign email address array if addresses are present
            if (validate.isEmail(item)) {
                try {
                    let addresses = getValues.emails(item);
                    addresses.forEach((address) => {
                        email.push(address);
                    });
                    lastAssignedValue = 'email';
                } catch (err) {
                    format_errors.push(err);
                    lastAssignedValue = 'error';
                }
                return;
            }

            // assign 'about' if person type is either mentor or interested
            if ((person.type === 'mentor' || person.type === 'interested') && index === flatArray.length - 1) {
                    about = item.text;
                    lastAssignedValue = 'about';
                    return;
            }

         
            // if an item cannot be matched to a property, log error
            console.error('Undefined field for speaker ' + name);
            // if an item cannot be matched to a property, push it into undefined fields array with it's raw value
            undefined_fields.push( new FormatError('', item, 'unknown field, format not recognized'));
            lastAssignedValue = 'unknown';

        });

        let attributes = {
            name,
            region,
            twitter,
            personal_website,
            email,
            location,
            topics,
            languages,
            about,
            how_to_contact,
            links
        };

        let missing_fields = [];

        // check for falsey values for all data attributes, if falsey then add key name to missing fields
        Object.entries(attributes).forEach(([key, value]) => {
            if (!value || value === []) {
                //ignore some fields, do not flag them as missing
                if (key === 'links' || key === 'email' || key === 'about' || key === 'how_to_contact') return;
                missing_fields.push(key);
            }
        });

        // the returned person object includes data and meta-data 
        person = {
            type: person.type,
            id: i + 1, // assign id
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



module.exports = mapPersons;