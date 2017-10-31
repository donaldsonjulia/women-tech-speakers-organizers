const { resolve } = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const writeJson = require('./utils/write-json');
const mdToJson = require('./utils/md-to-json');

// check to see if data folder exists, if not, create it
fs.ensureDir('./data')
    .then(() => {
    console.log("Directory 'data' exists.")
    })
    .catch(err => {
    console.error(err)
    });

// get README.md as string
let md = fs.readFileSync('./README.md').toString();

// maps markdown string to object in which all headings are keys
let rawJson = mdToJson(md);

// create array of [key, value] pairs from parsed markdown object
let jsonEntries = Object.entries(rawJson);

// change [key, value] pairs into objects where { name: key, info: value }
// identify any object keys that are flagged as duplicate names
// remove the duplicate flag from those strings before assinging their value to name property
let data = jsonEntries.map((i) => {
    let hasDupeFlag = /.+!DUPE\+\d+/g;

    if (hasDupeFlag.test(i[0])) {
      let trimmedName = _.split(i[0], /!DUPE\+\d+/, 1)[0];
      i[0] = trimmedName;
    }

    // flag as type:'section-header' if they do not contain data
    if (i[1].html === '') {

        return {
            name: i[0],
            type: 'section-header'
        };

    } else {

        return {
            name: i[0],
            info: i[1]
        };
    }
});

// define values for objects parsed from markdown (unrelated to data) that we want to remove
let nameValuesToPull = [
    { name: 'Fempire' }, 
    { name: 'Example Format' }, 
    { name: 'Full Name (First, Last)'},
    { name: 'undefined'}
]; 

// remove objects unrelated to data
let cleanData = _.pullAllBy(data, nameValuesToPull , 'name');

// get indices of section headers
let indexOfTableOfContents = _.findIndex(cleanData, { name: 'Table of Contents' });
let indexOfSpeakers = _.findIndex(cleanData, { name: 'Women Tech Speakers' });
let indexOfOrganizers = _.findIndex(cleanData, { name: 'Women Tech Organizers' });
let indexOfInterested = _.findIndex(cleanData, { name: 'Women Interested In Getting Started / Getting Involved' });
let indexOfMentors = _.findIndex(cleanData, { name: 'People Interested In Mentoring Women' });


// create new array for each of the data types (speakers, organizers, interested, mentors)
// remove first 'title' object ex. { name: 'Women Tech Speakers }
let tableOfContents = cleanData.slice(indexOfTableOfContents, indexOfSpeakers).slice(1);
let speakers = cleanData.slice(indexOfSpeakers, indexOfOrganizers).slice(1);
let organizers = cleanData.slice(indexOfOrganizers, indexOfInterested).slice(1);
let interested = cleanData.slice(indexOfInterested, indexOfMentors).slice(1);
let mentors = cleanData.slice(indexOfMentors).slice(1);


// write separated data to individual files
writeJson('data/table-of-contents.json', tableOfContents);
writeJson('data/speakers-data.json', speakers); 
writeJson('data/organizers-data.json', organizers); 
writeJson('data/interested-data.json', interested); 
writeJson('data/mentors-data.json', mentors); 
