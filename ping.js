var cmd = require('node-cmd');

console.log('Starting to ping...');
cmd.get(
    'fping < a.txt --ipv6 -e',
    function (err, data, stderr) {
        console.log('err :', err);
        console.log('stderr :', stderr);
        console.log('data :', data);
    }
);