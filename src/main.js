const $ = require("jquery");
window.$ = $;

const mapboxgl = require('mapbox-gl');
window.mapboxgl = mapboxgl;

var flightLogFile, videoFile;

$(function() {
    function setupDrop() {
        var dropTemplate = require(__dirname + "/templates/drop.hbs");
        $('body').html(dropTemplate({
            flightLogFile: flightLogFile,
            videoFile: videoFile
        }));

        $('#videoButton').click(function() {
            $('#videoInput').click();
        });

        $('#flightLogButton').click(function() {
            $('#flightLogInput').click();
        });

        var onEnter = function(e) {
            $('#dropContainer').removeClass("bg-gray-900").addClass("bg-green-900");

            e.preventDefault();
            e.stopPropagation();
        };

        var onLeave = function(e) {
            $('#dropContainer').addClass("bg-gray-900").removeClass("bg-green-900");

            e.preventDefault();
            e.stopPropagation();
        };

        var onDrop = function(e) {
            $('#dropContainer').addClass("bg-gray-900").removeClass("bg-gray-700");

            e.preventDefault();
            e.stopPropagation();

            _.each(e.originalEvent.dataTransfer.files, function(file) {
                if(file.type && file.type.indexOf("video/") == 0) {
                    videoFile = file;
                } else if(file.type && file.type.indexOf("/csv") >= 0) {
                    flightLogFile = file;
                }
            });

            setupDrop();
        };

        $('#dropContainer').bind({
            dragenter: onEnter,
            dragover: onEnter,
            dragleave: onLeave,
            drop: onDrop,
            dragdrop: onDrop
        });

        $('#videoInput').change(function(e) {
            videoFile = e.currentTarget.files[0];
            setupDrop();
        });

        $('#flightLogInput').change(function(e) {
            flightLogFile = e.currentTarget.files[0];
            setupDrop();
        });
    }

    setupDrop();

    if(true) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoieWVsZGFyYnkiLCJhIjoiY2w3czRlcG5qMGxvbDNxbnVoOTUzeW9nNCJ9.RKnzgCuuLaaFzcFsuZWdFQ';
    const videoStyle = {
        'version': 8,
        'sources': {
            'satellite': {
                'type': 'raster',
                'url': 'mapbox://mapbox.satellite',
                'tileSize': 256
            },
            'video': {
                'type': 'video',
                'urls': [
                    'https://static-assets.mapbox.com/mapbox-gl-js/drone.mp4',
                    'https://static-assets.mapbox.com/mapbox-gl-js/drone.webm'
                ],
                'coordinates': [
                    [-122.51596391201019, 37.56238816766053],
                    [-122.51467645168304, 37.56410183312965],
                    [-122.51309394836426, 37.563391708549425],
                    [-122.51423120498657, 37.56161849366671]
                ]
            }
        },
        'layers': [
            {
                'id': 'background',
                'type': 'background',
                'paint': {
                    'background-color': 'rgb(4,7,14)'
                }
            },
            {
                'id': 'satellite',
                'type': 'raster',
                'source': 'satellite'
            },
            {
                'id': 'video',
                'type': 'raster',
                'source': 'video'
            }
        ]
    };
        
    const map = new mapboxgl.Map({
        container: 'map',
        minZoom: 14,
        zoom: 17,
        center: [-122.514426, 37.562984],
        bearing: -96,
        style: videoStyle
    });

    window.map = map;
        
    let playingVideo = true;
        
    map.on('click', () => {
        playingVideo = !playingVideo;
            
        if (playingVideo) {
            map.getSource('video').play();
        } else {
            map.getSource('video').pause();
        }
    });
});