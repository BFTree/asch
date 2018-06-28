// console.log('Hello fucking world!');

var http = require("http")

http.createServer(function (request, response) {

    response.writeHead(200, {'Content-Type': 'text/plain'});

    reponse.end('Hello World\n');
}).listen(8888);

// console.log('Server running at http://127.0.0.1:8888/');

const buf = Buffer.from('runoob', 'ascii');

console.log(buf.toString('hex'));
console.log(buf.toString('base64'));



