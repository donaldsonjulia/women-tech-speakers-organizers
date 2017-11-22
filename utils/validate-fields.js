// regex patterns
let twitterHandle = /^@[\w\d]+/i,
    twitterUrl = /^(http(s)?:\/\/)?(www\.)?twitter\.com\/[\w\d@\/]+/i,
    socialHandle = /^@[\w\d.]+/i,
    url = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i,
    location = /^Location/,
    topics = /^Topics/,
    languages = /^Languages/,
    contact = /^How to Contact/i,
    hasEmailAddress = /([\w\.]+)@([\w\.]+)\.(\w+)/g,
    mentionsEmail = /e-?mail/ig,
    groupFocus = /^Group Focus/i;


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
        return mentionsEmail.test(item.text) || mentionsEmail.test(item.raw) || hasEmailAddress.test(item.text) || hasEmailAddress.test(item.raw);
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
    }

};