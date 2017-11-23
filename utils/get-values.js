const _ = require('lodash');
const FormatError = require('./format-error-constructor');
const validate = require('./validate-fields.js');


module.exports = {

    //returns an object with two properties, value and error
    twitter(item) {
        let error = null;
        let handle = _.trim(item.text);
        
        // trim url of trailing / characters 
        // trim @ symbol from handle if included in url to avoid duplicates
        let url = _.trimEnd(item.href, '/').split('/');
        let urlHandle = _.trimStart(url[url.length - 1], '@');

        // if twitter url handle and text handle do not match, use the url handle
        // push a twitter error into format_errors array
        if ('@' + urlHandle.toLowerCase() !== handle.toLowerCase()) {
            throw new FormatError('twitter', item, 'twitter handle and url do not match');
        }

        return handle;
    },
 

    location(item) {
        let locationValue = item.text.split('Location - ')[1];
        
        if (!locationValue) {
            throw new FormatError('location', item);
        }

        return locationValue;
    },

    topics(item) {
        let topicString = item.text.split('- ')[1];
        
        if (!topicString) {
            throw new FormatError('topics', item);
        }

        let topics = topicString.split(',').map((topic) => {
            return  _.trim(topic);
        });

        return topics;
    },

    languages(item) {
        let languages = ['English'];
        let languageString = item.text.split('- ')[1];
        
        if (!languageString) {
            throw new FormatError('language', item);
        }

        let otherLanguages = languageString.split(',').map((lang) => {
            return  _.trim(lang);
        });

        otherLanguages.forEach((lang) => {
            if (lang.toUpperCase() === 'NA' || lang.toUpperCase() === 'N/A') return;
            languages.push(lang);
        });
        
        return languages;
    },

    emails(item) {
        let emailRegex = /([\w\.]+)@([\w\.]+)\.(\w+)/g;
        let addresses = item.text.match(emailRegex) || item.raw.match(emailRegex);

        if (!addresses) {
            throw new FormatError('email', item);
        }
        return addresses;
    },

    howToContact(item) {
        let contactValue = item.text.split('- ')[1];
        
        if (!contactValue) {
            throw new FormatError('how_to_contact', item);
        }

        return contactValue;
    },

    group(item) {
        let group = {
            name: '',
            website: '',
            location: '',
            focus: ''
        };

        if (validate.isGroupSite(item)) {
            group.name = item.text;
            group.website = item.href;
    
        } else if (validate.isGroupSiteWithLocation(item)) {
            group.name = item.mixed[0].text;
            group.website = item.mixed[0].href;
    
            groupLocation = _.trimStart(item.mixed[1].text, [',']);
            groupLocation = _.trim(groupLocation);
            group.location = groupLocation;
    
            if (!group.location) {
                throw new FormatError('group', item);
            }
        }

        if (!group.name || !group.website || !group) {
            throw new FormatError('group', item);
        }

        return group;
    },

    groupFocus(item) {
        let rawValues = item.text.split('-');
        let focus = rawValues[1];

        if (rawValues.length > 2) {
            for (let i = 2; i < rawValues.length; i++) {
                if (rawValues[i]) {
                  focus = focus + '-' + rawValues[i];
                }
            }
        }

        focus = _.trim(focus);

        if (!focus) {
            throw new FormatError('group_focus', item);
        }

        return focus;
    },

};