var fs = require("fs");
var readimage = require("readimage");
var sharp = require("sharp");
var PNG = require('png-js');
var ping = require("net-ping");
//160 120
const WIDTH = 40;
const HEIGHT = 30;

const XOFFSET = 0;
const YOFFSET = 90;

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
        if (d.width > WIDTH) {
            console.log('Width too big, resizing...');
            d = { width: WIDTH, height: Math.floor(d.height * (WIDTH / d.width)) };
            if (d.height > HEIGHT) {
                d = { width: Math.floor(d.width * (HEIGHT / d.height)), height: HEIGHT };
            }
            sharp(FILENAME)
                .resize(d.width, d.height)
                .toFile("d" + FILENAME).then(() => {
                    dimensions = d;
                    FILENAME = "d" + FILENAME;
                    buildPingData(d);

                });
            return
        } else if (d.height > HEIGHT) {
            console.log('Height too big, resizing...');
            d = { width: Math.floor(image.width * (HEIGHT / image.height)), height: HEIGHT };
            if (d.width > WIDTH) {
                d = { width: WIDTH, height: Math.floor(d.height * (WIDTH / d.width)) };
            }
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
                pixelMap[colorIndex] = ['2001:4c08:2028', c + XOFFSET, r + YOFFSET, colors[colorIndex]].join(':');
                colorIndex++;
            }
        }
        console.log('Done building pingData!');

        pingHosts(pixelMap);
    });
}

function pingHosts(pixelMap) {
    console.log('Pinging hosts...');
    var file = 'a.txt';
    console.log('Clearing file...');
    fs.truncate(file, 0, function(){
        console.log('Writing to file...');
        pixelMap.forEach((host, i, arr) => {
            fs.appendFile(file, host + "\n", function (err) {
                if (err) return console.log(err);
                // console.log('successfully appended "' + host + '"');
    
                if (i === arr.length - 1) {
                    console.log('Starting to ping...');
                    var cmd = require('node-cmd');
                    cmd.get(
                        'fping < a.txt --ipv6',
                        function (err, data, stderr) {
                            console.log('err :', err);
                            console.log('stderr :', stderr);
                            console.log('data :', data);
                        }
                    );
                }
            });
        });    
    
    });
}

start();