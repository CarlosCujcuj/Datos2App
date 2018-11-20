const http = require('http');
const app= require('./app2.js')

const port = process.env.port || 3000;

const server = http.createServer(app);

server.listen(port);
