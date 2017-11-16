// regex patterns
let twitterHandle = /^@[a-z0-9_]+/i,
    twitterUrl = /^(http(s)?:\/\/)?(www\.)?twitter\.com\/[a-z0-9_@\/]+/i,
    url = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i,
    location = /^Location/,
    topics = /^Topics/,
    languages = /^Languages besides English/;
    hasEmailAddress = /([\w\.]+)@([\w\.]+)\.(\w+)/g;
    mentionsEmail = /e-?mail/ig;


module.exports = {
    isTwitter(item) {
        return twitterUrl.test(item.href) && twitterHandle.test(item.text);
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

};