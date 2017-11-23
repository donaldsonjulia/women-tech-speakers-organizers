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
            groups = [],
            languages = ['English'],
            links = [],
            about = '',
            how_to_contact = '',
            html = person.html;

        let unknown_fields = [];
        let format_errors = [];
 
        flatArray.forEach((item, index) => {
            
            // assign twitter handle if twitter is present
            if (validate.isTwitter(item)) {
                try {
                    twitter = getValues.twitter(item);
                } catch (err) {
                    format_errors.push(err);
                }   
                return;
            }

            // assign personal website if website is present and person is NOT an organizer
            // OR assign non-twitter social handles to personal website (edge cases)
            if ((validate.isWebsite(item) && person.type !== 'organizer') || validate.isSocialHandle(item)) {
                let site = {
                    title: item.text,
                    href: item.href
                }
                //if website is already defined, push url into additional links array
                if (personal_website) {
                    links.push(site);
                    return;
                }

                personal_website = site;
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

            // assign how_to_contact if present 
            // note - this allows the item to also pass through email validation afterwards
            if (validate.isHowToContact(item)) {
                try {
                    how_to_contact = getValues.howToContact(item);
                } catch (err) {
                    format_errors.push(err);
                }

                if (!validate.isEmail(item)) return;
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

            // assign 'about' if person type is either mentor or interested
            if ((person.type === 'mentor' || person.type === 'interested') && index === flatArray.length - 1) {
                    about = item.text;
                    return;
            }

            // if person.type = organizer, map groups accordingly
            if (person.type === 'organizer') {
        

                // if group website is listed as single link or listed with location 
                // add it to groups array
                if (validate.isGroupSite(item) || validate.isGroupSiteWithLocation(item)) {
                    try {
                        let group = getValues.group(item);
                        groups.push(group);
                    } catch (err) {
                        format_errors.push(err);
                    }
                    return;
                }

                // if group focus is listed, add the focus to the most recently added group
                // this accounts for multiple groups each followed by a group focus
                if (validate.isGroupFocus(item)) {
                    try {
                        let focus = getValues.groupFocus(item);
                        let lastGroup = groups[groups.length - 1];

                        if (!lastGroup) {
                            throw new FormatError('group_focus', item);
                        }

                        lastGroup.focus = focus;
                    } catch (err) {
                        format_errors.push(err);
                    }
                    return;
                }
            }


         
            // if an item cannot be matched to a property, log error
            console.error(`Unknown field for ${person.type} ${person.name}`);

            // if an item cannot be matched to a property, push it into undefined fields array with it's raw value
            unknown_fields.push( new FormatError('', item, 'unknown field, format not recognized'));

        });

        let attributes = {
            name,
            region,
            twitter,
            personal_website,
            email,
            location,
            topics,
            groups,
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
                unknown_fields
            },
        }; 

        return person;        
    });
}



module.exports = mapPersons;