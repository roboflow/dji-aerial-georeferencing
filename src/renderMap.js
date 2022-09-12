const CONFIG = {
    // use your own MapBox access token to access your custom maps & usage quota
    // get yours here: https://account.mapbox.com/access-tokens/create
    mapboxAccessToken: 'pk.eyJ1IjoieWVsZGFyYnkiLCJhIjoiY2w3czRlcG5qMGxvbDNxbnVoOTUzeW9nNCJ9.RKnzgCuuLaaFzcFsuZWdFQ',

    // if detections are closer than this constant, combine them into a single marker
    MIN_SEPARATION_OF_DETECTIONS_IN_METERS: 20,

    // wait until a detection is made on this number of distinct frames before showing the marker
    MIN_DETECTIONS_TO_MAKE_VISIBLE: 3
}

// Dependency for map rendering
const mapboxgl = require('mapbox-gl');
window.mapboxgl = mapboxgl;
require('mapbox-gl/dist/mapbox-gl.css');
mapboxgl.accessToken = CONFIG.mapboxAccessToken;

// Dependency for CSV parsing
const Papa = require('papaparse');

// Dependency for Geospatial calculations 
const turf = {
    point: require('@turf/helpers').point,
    rhumbDestination: require('@turf/rhumb-destination').default,
    distance: require('@turf/distance').default
};
window.turf = turf;

// run once to initialize map mode
var renderMap = async function(videoFile, flightLogFile) {
    // render the map UI
    var mapTemplate = require(__dirname + "/templates/map.hbs");
    $('body').html(mapTemplate());

    // parse the flight log from CSV to an array of objects (keyed by header column)
    const observations = await readCSVFile(flightLogFile);

    // filter the flight log for the first continuous video
    // and get the extent of the flight path so we can zoom it into view
    var videoObservations = [];
    var top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    _.find(observations, function(o) {
        // wait until we're recording a video & stop once that video finishes
        if(o.isVideo == "0") return videoObservations.length;

        // convert from strings to numbers
        o.latitude = parseFloat(o.latitude);
        o.longitude = parseFloat(o.longitude);

        videoObservations.push(o);

        if(o.longitude > top) top = o.longitude;
        if(o.longitude < bottom) bottom = o.longitude;
        if(o.latitude < left) left = o.latitude;
        if(o.latitude > right) right = o.latitude;
    });
    
    // create a map view with the default streets styling zoomed out to the full world
    const map = new mapboxgl.Map({
        container: 'map',
        zoom: 1,
        style: 'mapbox://styles/mapbox/streets-v11'
    });
    window.map = map;
    
    // wait until the map is initialized to add things to it
    map.on('load', function() {
        // GeoJSON representing the flight path
        var pathGeoJSON = {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [_.map(videoObservations, function(o) {
                        return [o.longitude, o.latitude];
                    })]
                }
            }
        };

        map.addSource("dronePath", pathGeoJSON);

        // draw a line around the flight path
        map.addLayer({
            'id': 'droneOutline',
            'type': 'line',
            'source': 'dronePath',
            'layout': {},
            'paint': {
                'line-color': '#6706CE',
                'line-width': 3
            }
        });

        // add the video to the map (we'll animate it according to the flight path)
        map.addSource('video', {
            'type': 'video',
            'urls': [URL.createObjectURL(videoFile)],
            'coordinates': [ // start with video in center of path; will get immediately overwritten but needs a default
                [(top+bottom)/2+0.0007, (left+right)/2 - 0.0007],
                [(top+bottom)/2+0.0007, (left+right)/2 + 0.0007],
                [(top+bottom)/2-0.0007, (left+right)/2 + 0.0007],
                [(top+bottom)/2-0.0007, (left+right)/2 - 0.0007]
            ]
        });

        map.addLayer({
            'id': 'video',
            'type': 'raster',
            'source': 'video'
        });

        // zoom the map to the flight path (with 50px of padding)
        map.fitBounds([
            [top, left],
            [bottom, right]
        ], {
            padding: 50
        });

        var videoSource = map.getSource('video');
        
        var fov = 60; // drone camera field of view in degrees; via https://mavicpilots.com/threads/measured-field-of-view-for-mavic-air-59%C2%B0-video-69%C2%B0-photo.85228/
        var fovAtan = Math.atan(fov); // multiply by altitude to get distance across the video's diagonal

        // used to throttle the ML code so it doesn't make the display laggy
        var detectionInFlight = false;
        var lastDetection = 0;

        // keep track of where we've placed markers so we can smooth them out when the same panel is found across multiple frames
        var foundPoints = [];

        // sync the video with the flight log & use it to update the video's orientation on the map,
        // look for solar panels using our computer vision model, and plot them on the map with markers
        var detectFrame = function() {
            // run this function on every tick
            requestAnimationFrame(detectFrame);

            // wait for the video to load
            var video = videoSource.video;
            if(!video || !video.videoWidth) return;

            // speed the video up 4x so it's not so boring
            video.playbackRate = 4.0;

            // pull video vars into local scope
            var {
                videoWidth,
                videoHeight,
                currentTime
            } = video;
            
            // the flight log observations are recorded every 100ms; pull the one corresponding to the current video timestamp
            var frame = Math.floor(currentTime * 10);
            var observation = videoObservations[frame%videoObservations.length];

            // store the location of the drone
            var center = turf.point([observation.longitude, observation.latitude]);
            var altitude = parseFloat(observation["ascent(feet)"]) * 0.3048; // convert to meters

            // calculate the ground distance shown (diagonal distance from top-left to bottom-right corner)
            var diagonalDistance = altitude * fovAtan;
            var distance = diagonalDistance/2; // distance (in meters) from center point to any of the 4 corners

            // the direction the drone is pointed
            var bearing = (parseFloat(observation["compass_heading(degrees)"]) - 90) % 360;
            // the number of degrees the top corners of the video are offset from the drone heading
            var offset = Math.atan(videoHeight / videoWidth) * 57.2958;

            // calculate the GPS coordinates of the video's four corners by starting at the drone's location and
            // traveling `distance` meters in the direction of that corner
            var options = {units: 'meters'};
            var topLeft = turf.rhumbDestination(center, distance, (bearing-offset+180)%360-180, options).geometry.coordinates;
            var topRight = turf.rhumbDestination(center, distance, (bearing+offset+180)%360-180, options).geometry.coordinates;
            var bottomRight = turf.rhumbDestination(center, distance, (bearing-offset)%360-180, options).geometry.coordinates;
            var bottomLeft = turf.rhumbDestination(center, distance, (bearing+offset)%360-180, options).geometry.coordinates;
            
            // orient the video on the map
            videoSource.setCoordinates([
                topRight,
                bottomRight,
                bottomLeft,
                topLeft
            ]);

            // if the model has loaded, we're not already waiting for a prediction to return,
            // and it's been at least 200ms since we last ran a frame through the vision model,
            // run a video frame through our computer vision model to detect & plot solar panels
            if(window.model && !detectionInFlight && Date.now() - lastDetection >= 200) {
                // pause the video so it doesn't get out of sync
                detectionInFlight = true;
                video.pause();

                // run the current frame through the model
                window.model.detect(video).then(function(predictions) {
                    // for each solar panel detected, convert its x/y position in the video frame to a GPS coordinate
                    _.each(predictions, function(p) {
                        // change coordinate system so the center point of the video is (0, 0) (instead of the top-left point)
                        // this means that (0, 0) is where our drone is and makes our math easier
                        var normalized = [p.bbox.y - videoHeight / 2, p.bbox.x - videoWidth / 2];

                        // calculate the distance and bearing of the solar panel relative to the center point
                        var distanceFromCenterInPixels = Math.sqrt((videoWidth/2-p.bbox.x)*(videoWidth/2-p.bbox.x)+(videoHeight/2-p.bbox.y)*(videoHeight/2-p.bbox.y));
                        var diagonalDistanceInPixels = Math.sqrt(videoWidth*videoWidth + videoHeight*videoHeight);
                        var percentOfDiagonal = distanceFromCenterInPixels / diagonalDistanceInPixels;
                        var distance = percentOfDiagonal * diagonalDistance; // in meters

                        var angle = Math.atan(normalized[0]/(normalized[1]||0.000001)) * 57.2958;
                        // if the detection is in the right half of the frame we need to rotate it 180 degrees
                        if(normalized[1] >= 0) angle += 180;

                        // use that distance and bearing to get the GPS location of the panel
                        var point = turf.rhumbDestination(center, distance, (bearing + angle)%360, options);

                        // combine detections that are close together so we end up with a single marker per panel
                        // instead of clusters when a panel is detected across multiple frames of the video
                        var duplicate = _.find(foundPoints, function(p, i) {
                            var distanceFromPoint = turf.distance(point, p.location, {units: 'kilometers'});
                            if(distanceFromPoint < CONFIG.MIN_SEPARATION_OF_DETECTIONS_IN_METERS/1000) {
                                // if we have already found this panel, average the position of the new observation with
                                // its existing position
                                p.points.push(point.geometry.coordinates);
                                var location = [0, 0];
                                _.each(p.points, function(point) {
                                    location[0] += point[0];
                                    location[1] += point[1];
                                });
                                location[0] = location[0]/p.points.length;
                                location[1] = location[1]/p.points.length;
                                p.location = turf.point(location);

                                // only show a panel if it has been detected at least twice
                                // (this prevents noisy predictions from clogging up the map)
                                if(!p.marker && p.points.length >= CONFIG.MIN_DETECTIONS_TO_MAKE_VISIBLE) {
                                    var marker = new mapboxgl.Marker()
                                        .setLngLat(location)
                                        .addTo(map);

                                    p.marker = marker;
                                } else if(p.marker) {
                                    // if the marker is already shown, update its position to the new average
                                    p.marker.setLngLat(location);
                                }

                                return true;
                            }
                        });

                        // if this is a new point, save it
                        if(!duplicate) {
                            foundPoints.push({
                                location: point,
                                points: [point.geometry.coordinates],
                                marker: null
                            });
                        }
                    });
                }).finally(function() {
                    // then start the video playing again
                    detectionInFlight = false;
                    lastDetection = Date.now();
                    video.play();
                });
            }
        };

        // start animating & detecting frames
        detectFrame();
    });
};

const readCSVFile = function(file) {
    return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var text = e.target.result;
            var results = Papa.parse(text, {
                header: true,
                transformHeader:function(h) { return h.trim(); }
            });
            resolve(results.data);
        }
        reader.readAsText(file);
    });
};

module.exports = renderMap;