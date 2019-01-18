![](site/source/imgs/lorb.jpg)

# Lorb Front End

This package has currently only been tested on Ubuntu 16, but should work on any OS that can run Node.js, Python 3, postgres and RabbitMQ)

There are 3 main components:
1. Nginx web server (configuration `server.conf`)
2. Hexo static files for webapp `site/`
3. Node.js prediction request server (HTTP POST -> RabbitMQ RPC) `server.js`

- A test web server can be run using `app.js`

