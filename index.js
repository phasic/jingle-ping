var fs = require("fs");
var readimage = require("readimage");
var sharp = require("sharp");
var PNG = require('png-js');
var ping = require ("net-ping");

var FILENAME = process.argv[2];
async function start() {
    determineSizes()
}


function determineSizes() {
    console.log('Starting to determine correct sizes...');
    var filedata = fs.readFileSync(FILENAME)


    readimage(filedata, function (err, image) {
        if (err) {
            console.log("failed to parse the image")
            console.log(err)
            return;
        }

        let d = { width: image.width, height: image.height };
        if (d.width > 160) {
            console.log('Width too big, resizing...');
            d = { width: 160, height: Math.floor(image.height * (160 / image.width)) };

            sharp(FILENAME)
                .resize(d.width, d.height)
                .toFile("d" + FILENAME).then(() => {
                    dimensions = d;
                    FILENAME = "d" + FILENAME;
                    buildPingData(d);

                });
            return
        } else if (d.height > 120) {
            console.log('Height too big, resizing...');

            d = { width: Math.floor(image.width * (120 / image.height)), height: 120 };
            sharp(FILENAME)
                .resize(d.width, d.height)
                .toFile("d" + FILENAME).then(() => {
                    dimensions = d;
                    FILENAME = "d" + FILENAME;
                    buildPingData(d);

                });
        }
    });


}

function buildPingData(dimensions) {
    console.log('Building pingData...');
    PNG.decode(FILENAME, function (pixels) {
        const arr = [...pixels];
        let colors = [];
        for (let i = 0; i < arr.length; i += 4) {
            const x = [arr[i], arr[i + 1], arr[i + 2]];
            colors.push(x.join(':'));
        }

        let pixelMap = [];
        let colorIndex = 0;

        for (let r = 0; r < dimensions.height; r++) {
            for (let c = 0; c < dimensions.width; c++) {
                pixelMap[colorIndex] = ['2001:4c08:2028', c, r, colors[colorIndex]].join(':');
                colorIndex++;
            }
        }
        console.log('Done building pingData!');

        pingHosts(pixelMap);
    });
}

function pingHosts(pixelMap) {
    console.log('Pinging hosts...');
    var session = ping.createSession ();

    pixelMap.forEach(function (host) {
        session.pingHost (host, function (error, target) {
            if (error)
                if (error instanceof ping.RequestTimedOutError)
                    console.log (target + ": Not alive");
                else
                    console.log (target + ": " + error.toString ());
            else
                console.log (target + ": Alive");
        });
    });
}



start();