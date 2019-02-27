This package is one of three required for the full web app. The other two, `lolorb` and `opggapi` should be cloned into the same directory, i.e.:
```
project_root
     ├ lolorb
     ├ lorb
     └ opggapi
```
Note: `lorb` is only required for the website/HTTP prediction request interface; the RabbitMQ prediction API server can run without it.

Please see the `lolorb` readme file for a more detailed description of the system.


![](site/source/imgs/lorb.jpg)

# Lorb Front End


This package (`lorb`) has currently only been tested on Ubuntu 16, but should work on any OS that can run Node.js and Python 3)

There are 3 main components:
1. Nginx web server (configuration `server.conf`)
2. Hexo static files for webapp are in `site/`, public files generated by `hexo generate` are in `site/public` and are copied to `/www/public/`
3. Node.js prediction request server (HTTP POST -> RabbitMQ RPC) `node server.js`

- A test web server can be run using `node app.js` or, from within the `site` folder, `hexo server`

