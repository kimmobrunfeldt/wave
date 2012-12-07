window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback ){
    window.setTimeout(callback, 1000 / 60);
  };
})();


var Wave = (function(options) {

    var width = 1000,
        height = 1000;

    var defaultDrawOptions = {
        amplitudeFactor: 0.999,
        startingPosition: [width/2, height/2],
        waveCount: 30,
        amplitudeRange: [40, 140],
        waveLengthRange: [height/4, height/2],
        lineLengthRange: [height/4, height/2],
        rotationRange: [0, 2 * Math.PI],
        strokeColor: 'black',
        strokeWidth: 3
    };

    var my = {},
        canvas = options.canvas,
        drawOptions = $.extend(true, {}, defaultDrawOptions, options.drawOptions),
        ctx = canvas.getContext('2d'),
        amplitudes = [],
        waveLengths = [],
        lineLengths = [],
        rotations = [];


    var init = function() {
        canvas.width = width;
        canvas.height = height;
        paper.setup(canvas);

        for (var i = 0; i < drawOptions.waveCount; ++i) {
            amplitudes.push(randomInt(drawOptions.amplitudeRange));
            waveLengths.push(randomInt(drawOptions.waveLengthRange));
            lineLengths.push(randomInt(drawOptions.lineLengthRange));
            rotations.push(randomFloat(drawOptions.rotationRange));
        }
        requestAnimFrame(my.renderLoop);
    };

    // Public methods

    my.renderLoop = function() {
        draw();
        requestAnimFrame(my.renderLoop);
    };

    // Private methods

    function draw() {
        clearCanvas();
        var opt = drawOptions;

        var paths = [];
        for (var i = 0; i < opt.waveCount; ++i) {
            var amplitude = amplitudes[i];
                waveLength = waveLengths[i];
                rotation = rotations[i];
                lineLength = lineLengths[i];

            var path = new paper.Path();
            paths.push(path);
            path.style = {
                strokeColor: opt.strokeColor,
                strokeWidth: opt.strokeWidth,
                strokeCap: 'round'
            };

            for (var x = 0; x < lineLength; x += lineLength / 50) {
                amplitude = amplitude * opt.amplitudeFactor;
                var time = Date.now();

                var y = wave(time, x, amplitude, waveLength),
                    coord = rotate(x, y, rotation);

                newX = coord[0] + opt.startingPosition[0];
                y = coord[1] + opt.startingPosition[1];
                path.lineTo(new paper.Point(newX, y));
            }
            path.smooth();
        }
        paper.view.draw();
        for (var i = 0; i < paths.length; ++i) {
            paths[i].remove();
        }
    };

    /*
     * As x grows, (x, y) coordinates start to shape a wave.
     * http://en.wikipedia.org/wiki/Amplitude
     * http://en.wikipedia.org/wiki/Wavelength
     *
     * amplitude: Peak-to-peak amplitude of the wave.
     * waveLength: The spatial period of the wave. The distance over which
     *             the wave's shape repeats.
     *
     * Returns Y value of the graph on given x.
     */
    function wave(time, x, amplitude, waveLength) {
        // The multiplier of x defines the wave's length. E.g sin(3x) has 3 times
        // smaller wave length than sin(x).
        var x = x * (2 * Math.PI / waveLength);

        // Substituting or increasing x moves the wave horizontally.
        // Substituting pi/2 moves the wave, so it's "first" peak is where x=0.
        // sin returns values from -1 to 1, we want from 0 - 1, that's why we
        // add 1 and divide by 2.
        var zeroToOne = (Math.sin(x - Math.PI / 2 + time/350) + 1) / 2;

        return zeroToOne * amplitude;
    };

    /*
     * Rotates x, y coordinates counter clockwise around origin.
     *
     * rotation: radians.
     */
    function rotate(x, y, rotation) {
        var newX = (Math.cos(rotation) * x - (Math.sin(rotation) * y)),
            newY = (Math.sin(rotation) * x + Math.cos(rotation) * y);
        return [newX, newY];
    };

    // Random int between start and end.
    function randomInt(range) {
        var end = range[0],
            start = range[1];
        return Math.floor(Math.random() * (end - start + 1)) + start;
    };

    // Random float between start and end.
    function randomFloat(range) {
        var end = range[0],
            start = range[1];
        return Math.random() * (end - start) + start;
    };

    function clearCanvas() {
        // http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    };

    init();
    return my;
});
