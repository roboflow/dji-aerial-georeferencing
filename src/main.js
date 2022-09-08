const $ = require("jquery");
window.$ = $;

$(function() {
    var setupDrop = require(__dirname + "/setupDrop.js");
    setupDrop();
});