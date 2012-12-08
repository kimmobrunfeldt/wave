window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback ){
    window.setTimeout(callback, 1000 / 40);
  };
})();


var Wave = (function(options) {

    var width = $(window).width(),
        height = $(window).height();

    var defaultDrawOptions = {
        startingPosition: [0, height/2],
        waveCount: 3,
        amplitudeRange: [0,70],
        waveLengthRange: [1200, 2000],
        rotationRange: [0, 0],
        strokeColor: 'black',
        strokeWidth: 3,
        backgroundColor: [192, 226, 250]
    };

    var my = {},
        canvas = options.canvas,
        drawOptions = $.extend(true, {}, defaultDrawOptions, options.drawOptions),
        ctx = canvas.getContext('2d'),
        paperObjects = [],
        amplitudes = [],
        amplitudeAddition = 100,
        waveLengths = [],
        waveRotations = [],
        startingHeights = [],
        waveAdditions = [],
        waveSpeeds = [],
        waveColors = []
        startTime = Date.now();


    var init = function() {
        canvas.width = width;
        canvas.height = height;
        paper.setup(canvas);

        for (var i = 0; i < drawOptions.waveCount; ++i) {
            amplitudes.push(randomInt(drawOptions.amplitudeRange));
            waveLengths.push(randomInt(drawOptions.waveLengthRange));
            waveRotations.push(randomFloat(drawOptions.rotationRange));
            startingHeights.push(randomInt([height/2 - 20, height/2 + 20]));
            waveAdditions.push(randomInt([10, 30]));
            waveSpeeds.push(randomInt([1400, 2000]));
            waveColors.push(randomChoice(['#1800B3', '#13008C', '#2B17B0', '#331EBA']));
        }
        requestAnimFrame(my.renderLoop);
    };

    // Public methods

    my.renderLoop = function() {
        draw();
        requestAnimFrame(my.renderLoop);
    };

    my.setWaveSize = function(size) {
        amplitudeAddition = size;
    };

    // Private methods

    // Draw the whole scene
    function draw() {
        clearCanvas();
        drawBackground();

        for (var i = 0; i < drawOptions.waveCount; ++i) {

            var waveOptions = {
                amplitude: amplitudes[i] + amplitudeAddition,
                waveLength: waveLengths[i],
                waveRotation: waveRotations[i],
                fillColor: waveColors[i],
                waveSpeed: waveSpeeds[i],
                waveAddition: waveAdditions[i],
                startingHeight: startingHeights[i]
            };

            if (i === drawOptions.waveCount - 1) {
                raster = new paper.Raster('ship');
                paperObjects.push(raster);
                drawWave(waveOptions, drawOptions, raster);
            } else {
                drawWave(waveOptions, drawOptions);
            }
        }

        paper.view.draw();
        clearPaperObjects();
    };

    function drawBackground() {
        var background = new paper.Path();

        var color = drawOptions.backgroundColor;
        var factor = 1 - amplitudeAddition / 1000;
        color = color.map(function(x) { return x * factor});
        color = 'rgb(' + color[0].toFixed(0) + ',' + color[1].toFixed(0) + ',' + color[2].toFixed(0) + ')';

        background.style = {fillColor: color};
        background.lineTo(new paper.Point(canvas.width, 0));
        background.lineTo(new paper.Point(canvas.width, canvas.height));
        background.lineTo(new paper.Point(0, canvas.height));
        background.lineTo(new paper.Point(0, 0));
        paperObjects.push(background);
    };

    /*
     * Draws a single wave, also if raster is defined, positionShip() is
     * called to move the drawed ship to correct position.
     * It is done this way because positionShip function has to get the last
     * wave-path to calculate the middle position, and the path gets messed
     * up when the wave is color filled.
     */
    function drawWave(waveOptions, drawOptions, raster) {

        var amplitude = waveOptions.amplitude,
            waveLength = waveOptions.waveLength,
            waveRotation = waveOptions.waveRotation,
            waveSpeed = waveOptions.waveSpeed,
            waveAddition = waveOptions.waveAddition,
            lineLength = canvas.width;

        var path = new paper.Path();
        paperObjects.push(path);
        path.style = {
            strokeColor: drawOptions.strokeColor,
            strokeWidth: drawOptions.strokeWidth,
            strokeCap: 'round',
            fillColor: waveOptions.fillColor
        };

        var time = Date.now() - startTime;
        for (var x = 0; x < lineLength + 10; x += lineLength / 10) {

            newX = x + drawOptions.startingPosition[0];
            y = wave(time, x, amplitude, waveLength, waveAddition, waveSpeed);
            y = y + waveOptions.startingHeight;

            path.lineTo(new paper.Point(newX, y));
        }
        path.rotate(waveRotation);
        path.smooth();

        if (typeof raster !== 'undefined') {
            positionShip(raster, path, amplitude);
        }

        path.lineTo(new paper.Point(width, height));
        path.lineTo(new paper.Point(0, height));
        path.lineTo(new paper.Point(0, 100));
    };

    function positionShip(raster, lastWavePath, amplitude) {
        var path = lastWavePath;

        var point = path.getPointAt(path.length / 2);
        var startingHeight = startingHeights[startingHeights.length - 1];
        if (point.y > startingHeight) {
            var diff = point.y - startingHeight;
            diff = diff / amplitude * 3;
            point.y += diff;
        }
        point.y -= 130;

        raster.position = point;

        var a = path.getPointAt(path.length / 2 - 10),
            b = path.getPointAt(path.length / 2 + 10);

        var rotation = Math.atan((b.x - a.x) / (b.y - a.y));
        rotation = 180 / Math.PI * rotation;
        rotation = (rotation < 0) ? rotation + 90: rotation - 90;
        raster.rotate(-rotation - 8);
    };

    function clearPaperObjects() {
        for (var i = 0; i < paperObjects.length; ++i) {
            paperObjects[i].remove();
        }
    }

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
    function wave(time, x, amplitude, waveLength, addition, speed) {
        // The multiplier of x defines the wave's length. E.g sin(3x) has 3 times
        // smaller wave length than sin(x).
        var x = x * (2 * Math.PI / waveLength);

        // Substituting or increasing x moves the wave horizontally.
        // Substituting pi/2 moves the wave, so it's "first" peak is where x=0.
        // sin returns values from -1 to 1, we want from 0 - 1, that's why we
        // add 1 and divide by 2.
        var zeroToOne = (Math.sin(addition + x - Math.PI / 2 + time/speed) + 1) / 2;

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

    function randomChoice(list) {
        if (list.length === 0) {
            return undefined;
        }
        var index = Math.floor(Math.random() * (list.length));
        return list[index];
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
