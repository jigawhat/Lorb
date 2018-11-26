const fs = require('fs')

// Create logs directory
var dir = './logs';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}


