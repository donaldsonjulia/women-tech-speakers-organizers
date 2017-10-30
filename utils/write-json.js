const fs = require('fs-extra');

function writeJson(filename, data) {
    return fs.writeJson(filename, data)
            .then(() => {
                console.log('Successfully saved file ' + filename);
            })
            .catch(err => {
                console.error(err);
            });
}

module.exports = writeJson;