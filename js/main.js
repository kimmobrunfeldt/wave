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

    $('#speedSlider').slider({
        range: "min",
        value: 0,
        max: 14,
        slide: function(event, ui) {
            wave.setSpeed(-ui.value);
        }
    });

    $('#rewind').click(function() {
        var thisCheck = $(this);
        if (thisCheck.is(':checked')) {
            wave.setRewind(true);
        } else {
            wave.setRewind(false);
        }

    });


})($, window);
