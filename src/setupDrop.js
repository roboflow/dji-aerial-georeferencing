var flightLogFile, videoFile;

var setupDrop = function() {
    // if we've already got our files, switch to map view
    if(flightLogFile && videoFile) {
        var renderMap = require(__dirname + "/renderMap.js");
        renderMap(videoFile, flightLogFile);
        return;
    }

    // render the UI
    var dropTemplate = require(__dirname + "/templates/drop.hbs");
    $('body').html(dropTemplate({
        flightLogFile: flightLogFile,
        videoFile: videoFile
    }));

    // setup click + drag & drop listeners
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
};

module.exports = setupDrop;