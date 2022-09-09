const $ = require("jquery");
window.$ = $;

const _ = require("lodash");
window._ = _;

$(function() {
    var setupDrop = require(__dirname + "/setupDrop.js");
    setupDrop();

    window.model = null;

    _.defer(function() {
        try {
            roboflow
            .auth({
                publishable_key: "rf_5w20VzQObTXjJhTjq6kad9ubrm33"
            })
            .load({
                model: "aerial-solar-panels",
                version: 5,
            })
            .then(function(m) {
                m.configure({
                    threshold: 0.9,
                    overlap: 0.5
                });
    
                window.model = m;
            });
        } catch (e) {
            console.error("error loading model", e && e.error);
        }
    });
});