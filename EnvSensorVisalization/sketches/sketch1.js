var milkcocoa;
var ds;
var sensors = new Object();
var plotX1, plotY1;
var plotX2, plotY2;
var labelX, labelY;
var inited = false;
var min_datetime = 9999999999999;
var max_datetime = 0;
var dataMin, dataMax;

var culumns = [{ title: "temperature", label: "", min: 0, max: 35, intervalMinor: 5, interval: 10 },
    { title: "humidity", label: "%", min: 10, max: 100, intervalMinor: 5, interval: 10 },
    { title: "noise", label: "dB", min: 20, max: 100, intervalMinor: 5, interval: 10 },
    { title: "illuminance", label: "lx", min: 0, max: 1000, intervalMinor: 50, interval: 100 },
    { title: "air_pressure", label: "hPa", min: 1000, max: 1100, intervalMinor: 5, interval: 10 }
];
var currentColumn = 0;
var volumeIntervalMinor = 5; // Add this above setup()
var volumeInterval = 10;
var colorNum = 0;

// センサーの数
var sensorNum = 3;

// 表示する日数
var duration = 2;

function preload() {}

function setup() {
    createCanvas(720, 405);
    milkcocoa = new MilkCocoa.connectWithApiKey('teaix6xae7c.mlkcca.com', 'JKKHFNMFBCALOPDF', 'DchkjkhnbdajCfnEPlmeIWFSJBXNhYCDXPbKXiGk');
    ds = milkcocoa.dataStore('EnvData');

    ds.on('send', function() {
        // console.log('sendされました！');
    });
    ds.stream().size(24 * 6 * sensorNum * duration).next(function(err, data) {
        // console.log(data);
        parse(data);
    });
    dataMax = culumns[currentColumn].max;
    dataMin = culumns[currentColumn].min;
    // Corners of the plotted time series 
    plotX1 = 80;
    plotX2 = width - plotX1;
    plotY1 = 60;
    plotY2 = height - plotY1;
    labelX = 30;
    labelY = height - 25;
}

function draw() {
    background(224);

    // Show the plot area as a white box 
    fill(255);
    rectMode(CORNERS);
    noStroke();
    rect(plotX1, plotY1, plotX2, plotY2);

    drawTitle();

    drawLabels();
    drawAxisLabels();
    drawVolumeLabels();
    strokeWeight(2);

    if (inited) {
        Object.keys(sensors).forEach(function(topic) {
            var sensor = this[topic];
            // TODO
            drawDataLine(sensor);

            colorNum += 1;
        }, sensors);

        colorNum = 0;
        Object.keys(sensors).forEach(function(topic) {
            var sensor = this[topic];
            drawDataHighlight(sensor);
            colorNum += 1;
        }, sensors);
    }
}


function drawTitle() {
    fill(0);
    textSize(20);
    textAlign(LEFT);
    var title = culumns[currentColumn].title;
    text(title, plotX1, plotY1 - 30);
}

function drawAxisLabels() {
    fill(0);
    textSize(13);
    textLeading(15);

    textAlign(CENTER, CENTER);
    var label = culumns[currentColumn].label;
    text(label, labelX, (plotY1 + plotY2) / 2);
    textAlign(CENTER);
    text("Datetime", (plotX1 + plotX2) / 2, labelY);
}

function drawLabels() {
    fill(0);
    textSize(10);
    textAlign(CENTER, TOP);

    // Use thin, gray lines to draw the grid
    stroke(224);
    strokeWeight(1);

    for (var i = 0; i < duration; i++) {
        var date = new Date(year(), month() - 1, day() - i, 9, 0, 0, 0);
        //console.log(date);
        var dateStr = date.toLocaleDateString();
        var x = map(date, min_datetime, max_datetime, plotX1, plotX2);
        text(dateStr, x, plotY2 + 5);
        line(x, plotY1, x, plotY2);
    }
}




function drawVolumeLabels() {
    fill(0);
    textSize(10);
    textAlign(RIGHT);

    stroke(128);
    strokeWeight(1);

    for (var v = dataMin; v <= dataMax; v += volumeIntervalMinor) {
        if (v % volumeIntervalMinor == 0) { // If a tick mark
            var y = map(v, dataMin, dataMax, plotY2, plotY1);
            if (v % volumeInterval == 0) { // If a major tick mark
                var textOffset = textAscent() / 2; // Center vertically
                if (v == dataMin) {
                    textOffset = 0; // Align by the bottom
                } else if (v == dataMax) {
                    textOffset = textAscent(); // Align by the top
                }
                text(floor(v), plotX1 - 10, y + textOffset);
                line(plotX1 - 4, y, plotX1, y); // Draw major tick
            } else {
                line(plotX1 - 2, y, plotX1, y); // Draw minor tick
            }
        }
    }
}

// Draw the data as a series of points 
function drawDataLine(target) {
    var hue = (160 + 360 / sensorNum * colorNum) % 360;
    var c = color('hsl(' + hue + ', 55%, 75%)');
    stroke(c);
    var rowCount = target.length;
    var xx, yy;
    var culumn = culumns[currentColumn];

    for (var row = 0; row < rowCount; row++) {
        var sensor = target[row];
        var x = map(sensor.datetime, min_datetime, max_datetime, plotX1, plotX2);
        var y = map(sensor[culumn.title], culumn.min, culumn.max, plotY2, plotY1);
        line(xx, yy, x, y);
        xx = x;
        yy = y;
    }
}


function parse(data) {

    for (var i = 0; i < data.length; i++) {
        var sensor = data[i].value;
        var topic = sensor.topic;
        var datetime = Date.parse(sensor.datetime);
        sensor.datetime = datetime;

        if (min_datetime > datetime)
            min_datetime = datetime;
        else if (max_datetime < datetime)
            max_datetime = datetime;

        if (sensors[topic] == undefined) {
            sensors[topic] = new Array();
        }
        sensors[topic].push(sensor);
    }

    inited = true;
}

function drawDataHighlight(target) {
    var hue = (160 + 360 / sensorNum * colorNum) % 360;
    var c = color('hsl(' + hue + ', 55%, 75%)');
    stroke(c);
    var rowCount = target.length;
    var culumn = culumns[currentColumn];

    for (var row = 0; row < rowCount; row++) {
        var sensor = target[row];
        var value = sensor[culumn.title];

        var x = map(sensor.datetime, min_datetime, max_datetime, plotX1, plotX2);
        var y = map(value, culumn.min, culumn.max, plotY2, plotY1);


        if (dist(mouseX, mouseY, x, y) < 3) {
            strokeWeight(10);
            point(x, y);
            strokeWeight(0);
            fill(0);
            textSize(10);
            textAlign(CENTER);
            text(nf(value, 0, 2), x, y - 8);
            textAlign(LEFT);

            // 一度で終わり
            break;
        }
    }
}

/**
 * 日付をフォーマットする
 * @param  {Date}   date     日付
 * @param  {String} [format] フォーマット
 * @return {String}          フォーマット済み日付
 */
function formatDate(date, format) {
    if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS';
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    if (format.match(/S/g)) {
        var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
        var length = format.match(/S/g).length;
        for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
    }
    return format;
};

function keyPressed() {
    if (keyCode === RIGHT_ARROW) {
        currentColumn--;
        if (currentColumn < 0) {
            currentColumn = culumns.length - 1;
        }
    } else if (keyCode === LEFT_ARROW) {
        currentColumn++;
        if (currentColumn == culumns.length) {
            currentColumn = 0;
        }
    }
    dataMax = culumns[currentColumn].max;
    dataMin = culumns[currentColumn].min;
    volumeIntervalMinor = culumns[currentColumn].intervalMinor; // Add this above setup()
    volumeInterval = culumns[currentColumn].interval;
}