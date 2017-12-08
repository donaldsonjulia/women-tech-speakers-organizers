/* eslint-disable no-param-reassign */

const _ = require('lodash');

// assign regions and category to each person (category is String)
// function returns an array of region-assigned, categorized persons without section-headers
function categorize(array, category) {
  let currentRegion = '';

  // assign preceding region section-header as property on each person object
  array.forEach((item) => {
    if (item.type === 'section-header') {
      currentRegion = item.name;
    } else {
      item.region = currentRegion;
      item.type = category;
    }
  });

  // remove section-headers from data after using them to assign regions
  _.pullAllBy(array, [{ type: 'section-header' }], 'type');
}

module.exports = categorize;
