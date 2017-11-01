const fs = require('fs-extra');
const _ = require('lodash');
const mdToJson = require('./utils/md-to-json');
const flattenTree = require('./utils/flatten-mdast-tree');

async function init() {
    try {
        // check to see if data folder exists, if not, create it
        await fs.ensureDir('./data');

        // get README.md as string
        let md = fs.readFileSync('./README.md').toString();

        // map markdown string to object in which all headings are keys
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
        } 

        return {
            name: i[0],
            info: i[1]
        };

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

        // flatten trees MDAST trees and attach to each object
        function addFlatInfo(array) {
        return array.forEach((item) => {
            if (item.type === 'section-header') {
                return;
            } 
            let tree = item.info.mdast;
            let flat = flattenTree(tree);
            item.flat = flat;
        });
        }

        addFlatInfo(tableOfContents);
        addFlatInfo(speakers);
        addFlatInfo(organizers);
        addFlatInfo(interested);
        addFlatInfo(mentors);


        // write separated data to individual files
        await fs.writeJson('data/table-of-contents.json', tableOfContents);
        await fs.writeJson('data/speakers-data.json', speakers); 
        await fs.writeJson('data/organizers-data.json', organizers); 
        await fs.writeJson('data/interested-data.json', interested); 
        await fs.writeJson('data/mentors-data.json', mentors); 

    } catch (error) {
        console.error(error);
    }
    
}

init();