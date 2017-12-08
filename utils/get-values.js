const _ = require('lodash');
const FormatError = require('./format-error-constructor');
const validate = require('./validate-fields.js');

function getValueAfterDash(rawString) {
  const rawValues = rawString.split('-');
  let valueToReturn = rawValues[1];

  if (rawValues.length > 2) {
    for (let i = 2; i < rawValues.length; i += 1) {
      if (rawValues[i]) {
        valueToReturn = `${valueToReturn}-${rawValues[i]}`;
      }
    }
  }

  return _.trim(valueToReturn);
}


module.exports = {

  // returns an object with two properties, value and error
  twitter(item) {
    const handle = _.trim(item.text);

    // trim url of trailing / characters
    // trim @ symbol from handle if included in url to avoid duplicates
    const url = _.trimEnd(item.href, '/').split('/');
    const urlHandle = _.trimStart(url[url.length - 1], '@');

    // if twitter url handle and text handle do not match, use the url handle
    // push a twitter error into formatErrors array
    if (`@${urlHandle.toLowerCase()}` !== handle.toLowerCase()) {
      throw new FormatError('twitter', item, 'twitter handle and url do not match');
    }

    return handle;
  },


  location(item) {
    const locationValue = getValueAfterDash(item.text);

    if (!locationValue) {
      throw new FormatError('location', item);
    }

    return locationValue;
  },

  topics(item) {
    const topicString = getValueAfterDash(item.text);

    if (!topicString) {
      throw new FormatError('topics', item);
    }

    const topics = topicString.split(',').map(topic => _.trim(topic));

    return topics;
  },

  languages(item) {
    const languages = ['English'];
    const languageString = getValueAfterDash(item.text);

    if (!languageString) {
      throw new FormatError('language', item);
    }

    const otherLanguages = languageString.split(',').map(lang => _.trim(lang));

    otherLanguages.forEach((lang) => {
      if (lang.toUpperCase() === 'NA' || lang.toUpperCase() === 'N/A') return;
      languages.push(lang);
    });

    return languages;
  },

  emails(item) {
    const emailRegex = /([\w\.]+)@([\w\.]+)\.(\w+)/g;
    const addresses = item.text.match(emailRegex) || item.raw.match(emailRegex);

    if (!addresses) {
      throw new FormatError('email', item);
    }
    return addresses;
  },

  howToContact(item) {
    const contactValue = getValueAfterDash(item.text);

    if (!contactValue) {
      throw new FormatError('howToContact', item);
    }

    return contactValue;
  },

  group(item) {
    const group = {
      name: '',
      website: '',
      location: '',
      focus: '',
    };

    if (validate.isGroupSite(item)) {
      group.name = item.text;
      group.website = item.href;
    } else if (validate.isGroupSiteWithLocation(item)) {
      group.name = item.mixed[0].text;
      group.website = item.mixed[0].href;

      let groupLocation = _.trimStart(item.mixed[1].text, [',']);
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
    const focus = getValueAfterDash(item.text);

    if (!focus) {
      throw new FormatError('group_focus', item);
    }

    return focus;
  },

};
