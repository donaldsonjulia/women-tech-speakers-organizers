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
        { name: 'Code of Conduct' }, 
        { name: 'Contributing' },
        { name: 'Formatting' }
        ]; 

        // remove objects unrelated to data
        let cleanData = _.pullAllBy(data, nameValuesToPull , 'name');

        // separate table of contents from data and store as variable
        // TODO: do we need this???
        let tableOfContents = _.pullAt(data, 0);

        // get indices of section headers
        // let indexOfTableOfContents = _.findIndex(cleanData, { name: 'Table of Contents' });
        let indexOfSpeakers = _.findIndex(cleanData, { name: 'Speakers' });
        let indexOfOrganizers = _.findIndex(cleanData, { name: 'Organizers' });
        let indexOfMentors = _.findIndex(cleanData, { name: 'Mentors' });
        let indexOfInterested = _.findIndex(cleanData, { name: 'Getting Started' });


        // create new array for each of the data types (speakers, organizers, interested, mentors)
        // remove first 'title' object ex. { name: 'Women Tech Speakers }
        // let tableOfContents = cleanData.slice(indexOfTableOfContents, indexOfSpeakers).slice(1);
        let speakers = cleanData.slice(indexOfSpeakers, indexOfOrganizers).slice(1);
        let organizers = cleanData.slice(indexOfOrganizers, indexOfMentors).slice(1);
        let mentors = cleanData.slice(indexOfMentors, indexOfInterested).slice(1);
        let interested = cleanData.slice(indexOfInterested).slice(1);
        

        // flatten MDAST trees and attach flat data to each object
        // and remove MDAST tree from object to declutter
        function addFlatInfo(array) {
            return array.map((item) => {
                if (item.type === 'section-header') {
                    return item;
                } 
                let tree = item.info.mdast;
                let flat = flattenTree(tree);
                item = {
                    name: item.name,
                    html: item.info.html,
                    flat: flat
                };  
                return item;        
            });
        }

        // assign regions to each person using preceding section-header value
        // function returns an array of region-assigned persons without section-headers
        function assignRegions(array) {
            let currentRegion = '';

            // assign preceding region section-header as property on each person object
            array.forEach((item) => {
                if (item.type === 'section-header') {
                    currentRegion = item.name;
                } else {
                    item.region = currentRegion;
                }
            });

            // remove section-headers from data after using them to assign regions
            _.pullAllBy(array, [{ type: 'section-header' }], 'type');
        }


        // tableOfContents = addFlatInfo(tableOfContents);
        speakers = addFlatInfo(speakers);
        organizers = addFlatInfo(organizers);
        interested = addFlatInfo(interested);
        mentors = addFlatInfo(mentors);

        assignRegions(speakers);
        assignRegions(organizers);
        assignRegions(interested);
        assignRegions(mentors);


        // write separated data to individual files
        await fs.writeJson('data/table-of-contents.json', tableOfContents);
        await fs.writeJson('data/speakers-data.json', speakers); 
        await fs.writeJson('data/organizers-data.json', organizers); 
        await fs.writeJson('data/interested-data.json', interested); 
        await fs.writeJson('data/mentors-data.json', mentors); 

        console.log('Successfully wrote all .json files to data directory.');

    } catch (error) {
        console.error(error);
    }
    
}

init();