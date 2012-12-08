(function($, window){

    var wave = undefined;
    $(window).load(function() {
        wave = new Wave({canvas: canvas});
    });

    $('#amplitudeSlider').slider({
        range: "min",
        value: 100,
        max: 300,
        slide: function(event, ui) {
            wave.setWaveSize(ui.value);
        }
    });

})($, window);
