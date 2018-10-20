var express = require('express');
var app = express();



app.use(express.static(__dirname + '/site/source')); //__dir and not _dir
var port = 420; // you can use any port
app.listen(port);
console.log('server on ' + port);



// app.get('/', function (req, res) {
//   res.send('Hello Worqwewqld!');
// });

// app.listen(80, function () {
//   console.log('Example app listening on port 80!');
// });