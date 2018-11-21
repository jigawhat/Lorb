//
//  Node.js Lorb prediction web server
//


const fs = require('fs');
const cluster = require('cluster');
// const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const os = require('os')
const amqp = require('amqplib/callback_api');


// Script options
const port = 8080;
// const port = 32077;
const n_workers = os.cpus().length;


var request_counter = 0;
if(cluster.isMaster) {  // Cluster master
    console.log('Master cluster setting up ' + n_workers + ' workers...');
    for(var i = 0; i < n_workers; i++) {
        cluster.fork();
    }
    cluster.on('online', function(worker) {
        // console.log('Worker ' + worker.process.pid + ' is online');
    });
    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });

} else { // Cluster worker

    // Load champion dictionary
    const ch_json = JSON.parse(eval(fs.readFileSync('site/source/champ_list.js', 'utf8')));
    var champ_dict = {};
    for (var i = 0; i < ch_json["list"].length; i++) {
        champ_dict[ch_json["list"][i][0]] = ch_json["list"][i][2];
    }

    // amqp.connect('amqp://localhost', function(err, conn) {});
    amqp.connect('amqp://localhost', function(err, conn) {
                
        // var app = require('express')();
        // app.all('/*', function(req, res) {res.send('process ' + process.pid + ' says hello!').end();})
        // var server = app.listen(8000, function() {
        //     console.log('Process ' + process.pid + ' is listening to all incoming requests');
        // });

        var app = express();
        // Only accept requests under a certain size
        app.use(bodyParser.text({limit: '0.001MB', type: "application/x-www-form-urlencoded"}));
        // app.use(bodyParser.text({limit: '0.0005MB', type: "gzip"}));
        app.post('/match/', function(req, res) {

            // console.log("here");
            if (req.method == 'POST') {
                // console.log("here-1");
                // console.log(typeof req.body);
                console.log(req.body);

                // var body = '';
                // req.on('data', function (data) {
                //     // console.log("here1");
                //     body += data;
                //     // console.log("Partial body: " + body);
                // });
                // req.on('end', function () {
                //     // console.log("here2");
                //     // console.log("Body: " + body);

                const body = req.body;

                const headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Max-Age': 2592000, // 30 days
                    "Content-Type": "application/json",
                };
                res.writeHead(200, headers);

                var req_d = null;
                try {
                    req_d = JSON.parse(body);
                } catch (err) {
                    console.log(err)
                    // res.write("request decode error"); // Don't send anything in return (probably h4x0rz)
                    res.end();
                    return;
                }

                // Validate request json
                const val_res = validate_req(req_d);
                if (val_res !== 200) {
                    console.log(val_res);
                    res.end();
                    return;
                }

                var req_i = req_d[3];
                var res_prom = new Promise(function(resolve, reject) {
                    request_counter++;
                    // var result = [req_i * 1, -1, -1, req_i];
                    // resolve('[' + result + ']');
                    // setTimeout(function(resolve_, result_) { // Simulate processing time
                    //     resolve(result);
                    // }, 1000);

                    // Get result through RabbitMQ RPC
                    try {
                        conn.createChannel(function(err, ch) {
                            ch.assertQueue('', {exclusive: true}, function(err, q) {
                                var corr = generateUuid();
                                ch.consume(q.queue, function(msg) {
                                    if (msg.properties.correlationId == corr) {
                                        // console.log(msg.content);
                                        resolve(msg.content);
                                    }
                                }, {noAck: true});

                                ch.sendToQueue('match_pred_rpc_queue', Buffer.from(body),
                                    { correlationId: corr, replyTo: q.queue });
                            });
                        });
                    } catch (err) {
                        reject(String(err));
                    }

                });
                res_prom.then(function(result) {
                    send_result(res, result);
                }, function(err) {
                    console.log(err);
                    // send_result(res, err);
                });
                // });
            }
        });

        var server = app.listen(port, function () {
            console.log('Worker ' + process.pid + ' listening on ' + port);
        });
    });

}

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}

const send_result = function(res, result) {
    console.log('process ' + process.pid + ': ' + result + " (request counter: " + request_counter + ')');
    // console.log(result);
    // res.write(JSON.stringify(result));
    res.write(result);
    res.end();
};

const validate_req = function(req) {
    if (!(req instanceof Array)) {
        return "request not array";
    } else if (req.length !== 7) {
        return "request array length";
    } else if ((!(req[0] instanceof Array)) && req[5] === -1) {
        return "request data not array";
    } else if (!Number.isInteger(req[1])) {
        console.log(req[1])
        return "request region index is not an integer";
    } else if (req[1] < 0 || req[1] > 10) {
        return "request region index is not between 0 and 10 (inclusive)";
    } else if (!Number.isInteger(req[2])) {
        return "request average elo index is not an integer";
    } else if(req[2] < 0 || req[2] > 27) {
        return "request average elo index is not between 0 and 27 (inclusive)";
    } else if (!Number.isInteger(req[3])) {
        return "request current request index is not an integer";
    }
    // TODO: Validate session id, shortlink and composition

    req_d = req[0];
    if (req_d !== -1) {
        if(req_d.length < 1 || req_d.length > 10) {
            return "request data array length error";
        }
        for (var i = 0; i < req_d.length; i++) {
            req_d_i = req_d[i];
            if (!(req_d_i instanceof Array)) {
                return "request data " + i + " not array";
            } else if(req_d_i.length !== 4) {
                return "request data " + i + " array length";
            } else if(!Number.isInteger(req_d_i[0])) {
                return "request data " + i + " team index is not an integer";
            } else if(!(req_d_i[0] == 0 || req_d_i[0] == 1)) {
                return "request data " + i + " team index is not 0 or 1";
            } else if(!Number.isInteger(req_d_i[1])) {
                return "request data " + i + " role index is not an integer";
            } else if(req_d_i[1] < 0 || req_d_i[1] > 4) {
                return "request data " + i + " role index is not between 0 and 4 (inclusive)";
            } else if(!Number.isInteger(req_d_i[2])) {
                return "request data " + i + " champion id is not an integer";
            } else if((!(req_d_i[2] in champ_dict)) && (!(req_d_i[2] == -2))) {
                return "request data " + i + " champion id is not valid: " + req_d_i[2];
            } else if(!((typeof req_d_i[3] == "string") || (Number.isInteger(req_d_i[3]) && req_d_i[3] == -1))) {
                return "request data " + i + " name is not a string or -1: " + req_d_i[3];
            } else if(req_d_i[2] === -1 && req_d_i[3] === -1) {
                return "request data " + i + " is empty";
            } else if(req_d_i[3] == '') {
                return "request data " + i + " name is empty";
            } else if(req_d_i[3].length > 16) {
                return "request data " + i + " name length has too many characters";
            }
        }
        var roles = {};
        var blue_count = 0;
        var red_count = 0;
        for (i = 0; i < req_d.length; i++) {
            t = req_d[i][0]
            r = t + '_' + req_d[i][1];
            if (r in roles) {
                return "request data " + i + " duplicate role: " + r;
            }
            blue_count += 1 - t
            if (blue_count > 5) {
                return "more than 5 players on blue team";
            }
            red_count += t
            if (red_count > 5) {
                return "more than 5 players on red team";
            }
            roles[r] = 1;
        }
    }
    return 200;
};


