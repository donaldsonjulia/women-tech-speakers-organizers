/* eslint-disable no-param-reassign, prefer-const */

const flattenTree = require('./flatten-mdast-tree');
const validate = require('./validate-fields.js');
const getValues = require('./get-values');
const FormatError = require('./format-error-constructor');

// flatten MDAST trees and attach flat data to each object
// and remove MDAST tree from object to declutter
function mapPersons(array) {
  return array.map((person, i) => {
    // flatten mdast tree into array
    const tree = person.mdast;
    const flatArray = flattenTree(tree);

    // define default values to be assigned to each person
    let { name } = person;
    let { type } = person;
    let { region } = person;
    let twitter = '';
    let personalWebsite = '';
    let email = [];
    let location = region;
    let topics = [];
    let groups = [];
    let languages = ['English'];
    let links = [];
    let about = '';
    let howToContact = '';
    let { html } = person;

    const unknownFields = [];
    const formatErrors = [];

    flatArray.forEach((item, index) => {
      // assign twitter handle if twitter is present
      if (validate.isTwitter(item)) {
        try {
          twitter = getValues.twitter(item);
        } catch (err) {
          formatErrors.push(err);
        }
        return;
      }

      // assign personal website if website is present and person is NOT an organizer
      // OR assign non-twitter social handles to personal website (edge cases)
      if ((validate.isWebsite(item) && person.type !== 'organizer') || validate.isSocialHandle(item)) {
        const site = {
          title: item.text,
          href: item.href,
        };
        // if website is already defined, push url into additional links array
        if (personalWebsite) {
          links.push(site);
          return;
        }

        personalWebsite = site;
        return;
      }

      // assign location if present (if not, default is region)
      if (validate.isLocation(item)) {
        try {
          location = getValues.location(item);
        } catch (err) {
          formatErrors.push(err);
        }
        return;
      }

      // assign topics if present
      if (validate.isTopics(item)) {
        try {
          topics = getValues.topics(item);
        } catch (err) {
          formatErrors.push(err);
        }
        return;
      }

      // assign languages array if additional languages present (default is ['English'])
      if (validate.isLanguages(item)) {
        try {
          languages = getValues.languages(item);
        } catch (err) {
          formatErrors.push(err);
        }
        return;
      }

      // assign howToContact if present
      // note - this allows the item to also pass through email validation afterwards
      if (validate.isHowToContact(item)) {
        try {
          howToContact = getValues.howToContact(item);
        } catch (err) {
          formatErrors.push(err);
        }

        if (!validate.isEmail(item)) return;
      }

      // assign email address array if addresses are present
      if (validate.isEmail(item)) {
        try {
          const addresses = getValues.emails(item);
          addresses.forEach((address) => {
            email.push(address);
          });
        } catch (err) {
          formatErrors.push(err);
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
            const group = getValues.group(item);
            groups.push(group);
          } catch (err) {
            formatErrors.push(err);
          }
          return;
        }

        // if group focus is listed, add the focus to the most recently added group
        // this accounts for multiple groups each followed by a group focus
        if (validate.isGroupFocus(item)) {
          try {
            const focus = getValues.groupFocus(item);
            const lastGroup = groups[groups.length - 1];

            if (!lastGroup) {
              throw new FormatError('group_focus', item);
            }

            lastGroup.focus = focus;
          } catch (err) {
            formatErrors.push(err);
          }
          return;
        }
      }


      // if an item cannot be matched to a property, log error
      console.error(`Unknown field for ${person.type} ${person.name}`);

      // if an item cannot be matched to a property, push into undefined_fields  with it's raw value
      unknownFields.push(new FormatError('', item, 'unknown field, format not recognized'));
    });

    const attributes = {
      name,
      region,
      twitter,
      personalWebsite,
      email,
      location,
      topics,
      groups,
      languages,
      about,
      howToContact,
      links,
    };

    const missingFields = [];

    // check for falsey values for data attributes, if falsey then add key name to missingFields
    Object.entries(attributes).forEach(([key, value]) => {
      if (!value || value === []) {
        // ignore some fields, do not flag them as missing
        if (key === 'links' || key === 'email' || key === 'about' || key === 'howToContact') return;
        missingFields.push(key);
      }
    });

    // the returned person object includes data and meta-data
    person = {
      type,
      id: i + 1, // assign id
      attributes,
      meta: {
        html,
        formatErrors,
        missingFields,
        unknownFields,
      },
    };

    return person;
  });
}


module.exports = mapPersons;
