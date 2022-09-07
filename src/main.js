// Load module
let DJISRTParser = require('dji_srt_parser');

// Specify data source name
let fileName = '../data/DJI_0753.SRT';

// And load the data in a string (with your preferred method)
let dataString = require('../data/DJI_0753.SRT').default;

// You can create multiple instances, one for reading each SRT file. Specify data as a string and filename for future reference.
var DJIData = DJISRTParser(dataString, fileName);

// toGeoJSON(raw, waypoints, elevationOffset) exports the current interpretation of data to the geoJSON format. The optional value raw exports the raw data instead. The second parameter, waypoints, specifies whether to include a single feature with all the data for each waypoint. The third parameter, elevationOffset, offset the elevation values by the specified meters. You can then use tokml or togpx modules to convert to those formats
let geoJSON = DJIData.toGeoJSON();

// rawMetadata() returns an array of objects with labels and the unmodified SRT data in the form of strings
console.log(DJIData.rawMetadata());

// metadata() returns an object with 2 elements
// (1) a packets array similar to rawMetadata() but with smoothing applied to GPS locations (see below why smoothing is used), distances and with computed speeds in 2d, 3d and vertical
// (2) a stats object containing stats like minimum, average and maximum speeds based on the interpreted data
console.log(DJIData.metadata());

//getSmoothing() returns the current smoothing value (how many data packets to average with, in each array direction)
console.log(DJIData.getSmoothing());
//setSmoothing() modifies the current smoothing value, 0 for no smoothing
// If multiple files are imported, this will be applied to all the files
console.log(DJIData.setSmoothing(0));

//getMillisecondsPerSample() returns the current millisecondsPerSample value. This delimits how many milliseconds have to pass between data packets, useful for scenarios that imply long files, and/or for drones that record in excesive sample rate, like mavic 2 pro (every 40ms.)
console.log(DJIData.getMillisecondsPerSample());
//setMillisecondsPerSample() modifies the current sample rate value, 0 for no resample. NOTE: if used in conjuntion with setSmoothing, must be in last position. The discarded packets will not affect the stats and the calculated smooth value.
// If multiple files are imported, this will be applied to all the files
console.log(DJIData.setMillisecondsPerSample(0));

// setProperties() add custom properties to the features. These are incorporated into the "properties" of each feature in the GeoJSON, and as new columns if it's exported to CSV.
// Use false to clean the properties already added, otherwise use an JSON Object to add data.
let obj = { customProperty: 'value', customProperty2: 123 };
console.log(DJIData.setProperties(obj));

//getFileName() returns the filename, useful if you loaded multiple files in multiple instances
// If multiple files are imported, it's return an array of fileNames
console.log(DJIData.getFileName());

//toCSV() exports the current interpretation of data to CSV format. The optional value raw exports the raw data instead
let csvData = DJIData.toCSV();

//toMGJSON(elevationOffset) exports the current interpretation of data to Adobe's mgJSON format for use in After Effects (see more info below). An elevation offset can be specified in meters.
let mgjsonData = DJIData.toMGJSON();