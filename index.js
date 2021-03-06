/* eslint-disable no-param-reassign */

const fs = require('fs-extra');
const _ = require('lodash');
const mdToJson = require('./utils/md-to-json');
const categorize = require('./utils/categorize-data');
const mapPersons = require('./utils/map-persons');
const catchFormatErrors = require('./utils/catch-format-errors');


async function init() {
  try {
    // check to see if data folder exists, if not, create it
    await fs.ensureDir('./data');

    // get README.md as string
    const md = fs.readFileSync('./README.md').toString();

    // map markdown string to object in which all headings are keys
    const rawJson = mdToJson(md);

    // create array of [key, value] pairs from parsed markdown object
    const jsonEntries = Object.entries(rawJson);

    // change [key, value] pairs into objects where { name: key, info: value }
    // identify any object keys that are flagged as duplicate names
    // remove the duplicate flag from those strings before assinging their value to name property
    const data = jsonEntries.map((i) => {
      const hasDupeFlag = /.+!DUPE\+\d+/g;

      if (hasDupeFlag.test(i[0])) {
        const trimmedName = _.split(i[0], /!DUPE\+\d+/, 1)[0];
        i[0] = trimmedName;
      }

      // flag as type:'section-header' if they do not contain data
      if (i[1].html === '') {
        return {
          name: i[0],
          type: 'section-header',
        };
      }

      return {
        name: i[0],
        html: i[1].html,
        mdast: i[1].mdast,
      };
    });

    // define values for objects parsed from markdown (unrelated to data) that we want to remove
    const nameValuesToPull = [
      { name: 'Fempire' },
      { name: 'Code of Conduct' },
      { name: 'Contributing' },
      { name: 'Formatting' },
    ];

    // remove objects unrelated to data
    const cleanData = _.pullAllBy(data, nameValuesToPull, 'name');

    // get indices of section headers
    const indexOfSpeakers = _.findIndex(cleanData, { name: 'Speakers' });
    const indexOfOrganizers = _.findIndex(cleanData, { name: 'Organizers' });
    const indexOfMentors = _.findIndex(cleanData, { name: 'Mentors' });
    const indexOfInterested = _.findIndex(cleanData, { name: 'Getting Started' });


    // create new array for each of the data types (speakers, organizers, interested, mentors)
    let speakers = cleanData.slice(indexOfSpeakers, indexOfOrganizers).slice(1);
    let organizers = cleanData.slice(indexOfOrganizers, indexOfMentors).slice(1);
    let mentors = cleanData.slice(indexOfMentors, indexOfInterested).slice(1);
    let interested = cleanData.slice(indexOfInterested).slice(1);

    // assign region and category to each person
    categorize(speakers, 'speaker');
    categorize(organizers, 'organizer');
    categorize(interested, 'interested');
    categorize(mentors, 'mentor');

    // map data appropriately based on category
    speakers = mapPersons(speakers);
    organizers = mapPersons(organizers);
    interested = mapPersons(interested);
    mentors = mapPersons(mentors);

    // compile any and all format errors and throw error with summary
    catchFormatErrors(speakers);
    catchFormatErrors(organizers);
    catchFormatErrors(interested);
    catchFormatErrors(mentors);

    // write separated data to individual files
    await fs.writeJson('data/speakers-data.json', speakers);
    await fs.writeJson('data/organizers-data.json', organizers);
    await fs.writeJson('data/interested-data.json', interested);
    await fs.writeJson('data/mentors-data.json', mentors);

    console.log('Successfully wrote all .json files to data directory.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

init();
