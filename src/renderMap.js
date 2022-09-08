const mapboxgl = require('mapbox-gl');
window.mapboxgl = mapboxgl;

const Papa = require('papaparse');

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
    });
        
    map.on('click', () => {
        playingVideo = !playingVideo;
            
        if (playingVideo) {
            map.getSource('video').play();
        } else {
            map.getSource('video').pause();
        }
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
}

module.exports = renderMap;