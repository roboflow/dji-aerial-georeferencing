const mapboxgl = require('mapbox-gl');
window.mapboxgl = mapboxgl;

require('mapbox-gl/dist/mapbox-gl.css');

const Papa = require('papaparse');
const { LazyResult } = require('postcss');

const turf = {
    point: require('@turf/helpers').point,
    rhumbDestination: require('@turf/rhumb-destination').default
};

window.turf = turf;

var renderMap = async function(videoFile, flightLogFile) {
    var mapTemplate = require(__dirname + "/templates/map.hbs");
    $('body').html(mapTemplate());

    const observations = await readCSVFile(flightLogFile);

    var videoObservations = [];
    
    // filter for the first continuous video
    var top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    _.find(observations, function(o) {
        if(o.isVideo == "0") return videoObservations.length;

        o.latitude = parseFloat(o.latitude);
        o.longitude = parseFloat(o.longitude);

        videoObservations.push(o);

        if(o.longitude > top) top = o.longitude;
        if(o.longitude < bottom) bottom = o.longitude;
        if(o.latitude < left) left = o.latitude;
        if(o.latitude > right) right = o.latitude;
    });

    // var video = await loadVideo();
    mapboxgl.accessToken = 'pk.eyJ1IjoieWVsZGFyYnkiLCJhIjoiY2w3czRlcG5qMGxvbDNxbnVoOTUzeW9nNCJ9.RKnzgCuuLaaFzcFsuZWdFQ';
        
    const map = new mapboxgl.Map({
        container: 'map',
        zoom: 1,
        style: 'mapbox://styles/mapbox/streets-v11'
    });

    window.map = map;
        
    let playingVideo = true;

    map.on('load', function() {
        var polygon = _.map(videoObservations, function(o) {
            return [o.longitude, o.latitude];
        });

        var pathGeoJSON = {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [polygon]
                }
            }
        };

        map.addSource("dronePath", pathGeoJSON);

        map.addLayer({
            'id': 'droneOutline',
            'type': 'line',
            'source': 'dronePath',
            'layout': {},
            'paint': {
                'line-color': '#000',
                'line-width': 3
            }
        });

        map.addSource('video', {
            'type': 'video',
            'urls': [URL.createObjectURL(videoFile)],
            'coordinates': [
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

        map.fitBounds([
            [top, left],
            [bottom, right]
        ], {
            padding: 150
        });

        var videoSource = map.getSource('video');
        var videoLayer = map.getLayer('video');

        var fov = 60; // degrees; via https://mavicpilots.com/threads/measured-field-of-view-for-mavic-air-59%C2%B0-video-69%C2%B0-photo.85228/
        var fovAtan = Math.atan(fov);

        var prevPrint = 0;
        var i = 0;
        var detectionInFlight = false;
        var lastDetection = 0;
        var detectFrame = function() {
            var video = videoSource.video;
            window.video = video;
            if(video && video.videoWidth) {
                video.playbackRate = 4.0;

                var videoWidth = video.videoWidth;
                var videoHeight = video.videoHeight;

                var currentTime = video.currentTime;

                var frame = Math.floor(video.currentTime * 10);
                var observation = videoObservations[frame%videoObservations.length];

                var center = turf.point([observation.longitude, observation.latitude]);
                
                var altitude = parseFloat(observation["ascent(feet)"]) * 0.3048; // convert to meters
                var diagonalDistance = altitude * fovAtan;
                var distance = diagonalDistance/2;

                var options = {units: 'meters'};

                var bearing = (parseFloat(observation["compass_heading(degrees)"]) - 90) % 360;

                var offset = Math.tan(videoHeight / videoWidth) * 57.2958;

                var topLeft = turf.rhumbDestination(center, distance, (bearing-offset+180)%360-180, options).geometry.coordinates;
                var topRight = turf.rhumbDestination(center, distance, (bearing+offset+180)%360-180, options).geometry.coordinates;
                var bottomRight = turf.rhumbDestination(center, distance, (bearing-offset+180+180)%360-180, options).geometry.coordinates;
                var bottomLeft = turf.rhumbDestination(center, distance, (bearing+offset+180+180)%360-180, options).geometry.coordinates;
                
                var coords = [
                    topRight,
                    bottomRight,
                    bottomLeft,
                    topLeft
                ];

                videoSource.setCoordinates(coords);

                if(window.model && !detectionInFlight && Date.now() - lastDetection >= 200) {
                    detectionInFlight = true;
                    video.pause();
                    window.model.detect(video).then(function(predictions) {
                        console.log(predictions);
                        if(predictions.length) {
                            var marker = new mapboxgl.Marker()
                                .setLngLat([observation.longitude, observation.latitude])
                                .addTo(map);

                            console.log("ADD MARKER AT", [observation.longitude, observation.latitude]);
                        }
                    }).finally(function() {
                        detectionInFlight = false;
                        lastDetection = Date.now();
                        video.play();
                    });
                }
            }
            
            requestAnimationFrame(detectFrame);
        };

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