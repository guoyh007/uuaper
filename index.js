'use strict';

var fs = require('fs');
var url = require('url');

// var request = require('superagent');
// var bodyParser = require('body-parser');
var birdAuth = require('bird-auth');
var fsPath = require('fs-path');

var httpProxy = require('./libs/proxy');

var options = {};

var Uuaper = module.exports = function (params) {

    options = {
        username: params.username,
        password: params.password,
        uuapServer: params.uuapServer,
        service: params.service.match(/%3A%2F%2F/ig) ? params.service : encodeURIComponent(params.service),
        debug: params.debug ? params.debug : false,
        mock: params.mock ? params.mock : false,
        mockDir: params.mockDir,
        mockCache: params.mockCache ? params.mockCache : false
    }

    // 某些项目比较奇葩
    if (!params.server) {
        var tmp  = url.parse(decodeURIComponent(params.service));
        options.server = tmp.protocol + '//' + tmp.hostname + (~~tmp.port ? ':' + tmp.port : '');
    }
    else {
        options.server = params.server;
    }

    // if (params.express) {
    //     params.express.use(bodyParser.json());
    //     params.express.use(bodyParser.urlencoded({extended: true}));
    // }

    if (params.cookie) {
        if (options.debug) console.log('===== Custom Cookies Mode =====')
        options.custom = true;
        options.cookie = params.cookie;
    }
    else {
        if (options.debug) console.log('===== Auto Get Cookies Mode =====')
        getCookie();
    }

    // fs.exists('./cookie.data', function (isExist) {
    //     if (isExist) {
    //         fs.readFile('./cookie.data', 'utf-8', function (err, data) {
    //             options.cookie = data;
    //         });
    //     }
    //     else {
    //         getCookie();
    //     }
    // });
};

Uuaper.prototype.loadData = function (req, res) {
    if (options.mock) {
        mockData(req, res);
        return;
    }
    proxyData(req, res);
};


Uuaper.prototype.startServer = function (params) {
    var express = require('express');
    var app = express();

    app.use(function (req, res, next) {
        var exec_start_at = Date.now();
        var _send = res.send;
        res.send = function () {
            res.set('X-Execution-Time', String(Date.now() - exec_start_at));
            return _send.apply(res, arguments);
        };
        next();
    });
    // app.use(bodyParser.json());
    // app.use(bodyParser.urlencoded({extended: true}));

    options.port = params.port || 1337;
    options.staticPath = params.staticPath || __dirname;
    options.proxyPath = params.proxyPath || [];

    for (var i = 0; i < options.proxyPath.length; i++) {
        app.use(options.proxyPath[i], this.loadData);
    }

    app.use(express.static(options.staticPath));

    app.listen(options.port, function () {
        console.log('Server listening on http://localhost:' + options.port + ', Ctrl+C to stop')
    });
};

function getCookie(cb) {
    var uuap = new birdAuth.uuap({
        username: options.username,
        password: options.password,
        uuapServer: options.uuapServer,
        service: options.service
    }, function(cookie) {
        options.cookie = cookie;
        // fs.writeFile('./cookie.data', cookie);
        cb && cb();
    });
};

function retry(req, res, body) {
    getCookie(function (cookie) {
        req.headers.cookie = options.cookie;
        httpProxy(options.server, {
            forwardPath: function(req) {
                return req.originalUrl;
            },
            defaultBody: body
        })(req, res, function(e) {
            console.log(e)
        });
    })
}

function proxyData(req, res) {
    var tmp = req.originalUrl.match(/\?/i) ? req.originalUrl.match(/(.+)\?{1}/i)[1] : req.originalUrl;
    
    if (options.debug) console.log(req.originalUrl + ' > ' + options.server + req.originalUrl);
    
    req.headers.cookie = options.cookie || '';
    httpProxy(options.server, {
        forwardPath: function(req) {
            return req.originalUrl;
        },
        intercept: function(resp, data, req, res, body, callback) {
            if (+resp.statusCode === 302) {
                retry(req, res, body);
                return;
            }
            else if (!req.originalUrl.match(/[\w]+[\.](avi|mpeg|3gp|mp3|mp4|wav|jpeg|gif|jpg|png|apk|exe|txt|html|zip|Java|doc|js|json|css|ttf|woff|csv|doc|xlsx|rar|7z)/g)){
                var data = data.toString();
                if (!data) {
                    retry(req, res, body);
                    return;
                }
                if (options.mockCache || options.mockDir) {
                    fs.exists(options.mockDir + tmp + '.json', function (isExist) {
                        if (!isExist) {
                            fsPath.writeFile(options.mockDir + tmp + '.json', data);
                        }
                    });
                }
            }
            callback(null, data);
        }
    })(req, res, function(e) {
        console.log(e)
    });
}


function mockData(req, res) {
    var tmp = req.originalUrl.match(/\?/i) ? req.originalUrl.match(/(.+)\?{1}/i)[1] : req.originalUrl;
    fs.exists(options.mockDir + tmp + '.json', function (isExist) {
        if (isExist) {
            fs.readFile(options.mockDir + tmp + '.json', 'utf-8', function (err, data) {
                if (options.debug) console.log(tmp + ' > ' + options.mockDir + tmp + '.json')
                res.send(data);
            });
        }
        else {
            proxyData(req, res);
        }
    });
}


/* 已废弃 */
// function getData(req, res) {

//     if (options.debug) console.log(req.originalUrl + ' > ' + options.server + req.originalUrl);

//     // hack cookie
//     req.headers.cookie = options.cookie

//     if (req.originalUrl.match(/[\w]+[\.](avi|mpeg|3gp|mp3|mp4|wav|jpeg|gif|jpg|png|apk|exe|txt|html|zip|Java|doc|js$|css|ttf|woff|csv|doc|xlsx|rar|7z)/g)) {
//         var tmp = request(options.server + req.originalUrl)
//             .set(req.headers)
//             .on('response', function(resp) {
//                 if (resp.get('Connection') == 'close') {
//                     getCookie();
//                     tmp.write('<script>window.location.reload()</script>');
//                 }
//                 else {
//                     res.set({'Content-Type': resp.get('Content-Type')})
//                 }
//             })
//             .pipe(res)
//     }
//     else {
//         var tmp = req.originalUrl.match(/\?/i) ? req.originalUrl.match(/(.+)\?{1}/i)[1] : req.originalUrl;
//         request(req.method, options.server + req.originalUrl)
//             .set(req.headers)
//             .send(req.body)
//             .end(function(err, resp) {
//                 if (err && err.status != 403) {
//                     res.send({error: 'uuaper get data error', message: err.status});
//                 }
//                 else if (!options.custom && resp && (resp.req.path.match('login') || (err && err.status == 403))) {
//                     getCookie(function() {
//                         req.headers.cookie = options.cookie
//                         request(req.method, options.server + req.baseUrl + req.url)
//                             .set(req.headers)
//                             .send(req.body)
//                             .end(function(err, resp) {
//                                 if (resp.text) {
//                                     res.set({'Content-Type': resp.get('Content-Type')})
//                                     if (options.mockCache || options.mockDir) {
//                                         fs.exists(options.mockDir + tmp + '.json', function (isExist) {
//                                             if (!isExist) {
//                                                 fsPath.writeFile(options.mockDir + tmp + '.json', resp.text);
//                                             }
//                                         });
//                                     }
//                                 }
//                                 else {
//                                     res.set(resp.headers)
//                                 }
//                                 res.send(resp.text);
//                             })
//                     })
//                 }
//                 else {
//                     if (resp.text) {
//                         res.set({'Content-Type': resp.get('Content-Type')})
//                         if (options.mockCache || options.mockDir) {
//                             fs.exists(options.mockDir + tmp + '.json', function (isExist) {
//                                 if (!isExist) {
//                                     fsPath.writeFile(options.mockDir + tmp + '.json', resp.text);
//                                 }
//                             });
//                         }
//                     }
//                     else {
//                         res.set(resp.headers)
//                     }
//                     res.send(resp.text);
//                 }
//             })
//     }    
// }