// regex patterns
const twitterHandle = /^@[\w\d]+/i;
const twitterUrl = /^(http(s)?:\/\/)?(www\.)?twitter\.com\/[\w\d@\/]+/i;
const socialHandle = /^@[\w\d.]+/i;
const url = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
const location = /^Location/;
const topics = /^Topics/;
const languages = /^Languages/;
const contact = /^How to Contact/i;
const hasEmailAddress = /([\w\.]+)@([\w\.]+)\.(\w+)/g;
const mentionsEmail = /e-?mail/gi;
const groupFocus = /^Group Focus/i;

module.exports = {
  isTwitter(item) {
    return twitterUrl.test(item.href) && twitterHandle.test(item.text);
  },

  isSocialHandle(item) {
    return socialHandle.test(item.text) && !this.isTwitter(item);
  },

  isWebsite(item) {
    return url.test(item.href) && !twitterUrl.test(item.href);
  },

  isLocation(item) {
    return location.test(item.text);
  },

  isTopics(item) {
    return topics.test(item.text);
  },

  isLanguages(item) {
    return languages.test(item.text);
  },

  isEmail(item) {
    return (
      mentionsEmail.test(item.text) ||
      mentionsEmail.test(item.raw) ||
      hasEmailAddress.test(item.text) ||
      hasEmailAddress.test(item.raw)
    );
  },

  isHowToContact(item) {
    return contact.test(item.text);
  },

  isGroupSite(item) {
    return this.isWebsite(item) && item.mixed.length === 0;
  },

  isGroupSiteWithLocation(item) {
    return item.mixed.length > 0 && item.mixed[0].href;
  },

  isGroupFocus(item) {
    return groupFocus.test(item.text);
  },
};
