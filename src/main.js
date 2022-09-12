const ROBOFLOW_SETTINGS = {
    publishable_key: "rf_5w20VzQObTXjJhTjq6kad9ubrm33", // grab from your account settings (you can use it to restrict access to your model)

    model: "aerial-solar-panels",   // change to detect something other than solar panels (find other models at https://universe.roboflow.com/browse/aerial)
                                    // or train your own at https://app.roboflow.com
    version: 5, // use the version of your model with the best results

    threshold: 0.6, // adjust the confidence threshold upwards if you're getting false positives, downwards if it's missing predictions
    overlap: 0.5 // how much predictions can overlap each other; not too important here since we combine nearby predictions into a single marker
};

const $ = require("jquery");
window.$ = $;

const _ = require("lodash");
window._ = _;

$(function() {
    // setup the initial screen which asks users for their video and flight log CSV
    var setupDrop = require(__dirname + "/setupDrop.js");
    setupDrop();

    // load the CV model so it's ready when we want to start using it
    window.model = null;
    _.defer(function() {
        try {
            roboflow
            .auth({
                publishable_key: ROBOFLOW_SETTINGS.publishable_key
            })
            .load({
                model: ROBOFLOW_SETTINGS.model,
                version: ROBOFLOW_SETTINGS.version,
            })
            .then(function(m) {
                m.configure({
                    threshold: ROBOFLOW_SETTINGS.threshold,
                    overlap: ROBOFLOW_SETTINGS.overlap
                });
    
                window.model = m;
            });
        } catch (e) {
            console.error("error loading model", e && e.error);
        }
    });
});