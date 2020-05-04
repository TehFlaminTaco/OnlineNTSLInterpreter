var https = require('https');
var request = require('request');
var WebSocket = require('ws');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var options = {
    key: "Nope",
    cert: "Nope"
};
var config = {
    ntsl_daemon_hostname: "localhost",
    ntsl_daemon_port: 1945
};

try{
    config = JSON.parse(fs.readFileSync('config.json'));
}catch(e){
    console.error("Failed to load config.json, using default config.");
    console.error(e);
}

try{
    options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
}catch(e){
    https = require('http');
    console.error("Unable to launch webserver securely, falling back to insecure.")
    console.error(e)
}

// NTSL Interface

ntsl = {};
ntsl.run = function(params, callback){
    var encodedString = "";
    var encodeSep = "";
    for(var name in params){
        encodedString += encodeSep +encodeURIComponent(name) + "=" +encodeURIComponent(params[name]);
        encodeSep = "&"
    }
    var url = new URL("http://"+config.ntsl_daemon_hostname);
    url.port = config.ntsl_daemon_port;

    request(url.toString() + encodedString, callback);
} 
ntsl.cycle = function(ws, count=3000){
    if(ws.programID != null){
        ntsl.run({action: "execute", id: ws.programID, cycles: count}, (error, response, body)=>{
            if(body == "0"){ // Program died.
                ws.programID = null;
                ws.send(JSON.stringify({action: "update_terminal", body: "<font color=red>Error in program.</font>"}))
            }else{
                ntsl.run({action: "get_buffered", id: ws.programID}, (error, response, body)=>{
                    ws.send(JSON.stringify({action: "update_terminal", body: body}));
                });
            }
        });
    }
}

// HTTPS SERVER

var httpsServer = https.createServer(options, function (req, response) {
    var parsedPath = path.join('www/', path.normalize(req.url));
    if(req.url == "/")
        parsedPath = path.join("www","interpreter.html")
    if(!parsedPath.match(`www\\${path.sep}`))
        parsedPath = "www/404.html";
    
    fs.exists(parsedPath, exists=>{
        var write = (err, data)=>{
            response.write(data);
            response.end();
        }
        if(exists){
            response.writeHead(200, {"Content-Type": mime.lookup(parsedPath)||"text/html"});
            fs.readFile(parsedPath, write);
        }else{
            response.writeHead(404, {"Content-Type": "text/html"});
            fs.readFile("www/404.html", write);
        }
        
    });
});

// WEBSOCKET

var wss = new WebSocket.Server({port: 4132})

wss.on('connection', function (ws){

    ws.programID = null;
    ws.lastProgramExecution = 0;
    ws.isAlive = true;

    ws.on('message', function (message){
        ws.isAlive = true;
        try {
            var data = JSON.parse(message)
            if(data.action)
                ws.emit(":"+data.action, data);
        }catch(e){
            return;
        }
    });
    ws.on('pong', function(){
        ws.isAlive = true;
        ntsl.cycle(ws, 30000);
    });
    ws.on('closed', function(){
        if(ws.programID){
            return ntsl.run({action: "remove", id: ws.programID}, ()=>{});
        }
    })

    // Server-client functions.
    ws.on(":execute", data => {
        if(ws.programID == null){
            // No program? Just run it.
            ntsl.run({action: "new_program", code: data.code}, (error, response, body)=>{
                if(!error)
                    ws.programID = body;
            });
        }else{
            // First, kill whatever program is running.
            ntsl.run({action: "remove", id: ws.programID}, ()=>{
                // THEN launch the code.
                ntsl.run({action: "new_program", code: data.code}, (error, response, body)=>{
                    if(!error)
                        ws.programID = body;
                });
            });
        }
    });
    ws.on(":topic",  data => {
        // Only alive programs get to run.
        if(ws.programID != null){
            ntsl.run({action: "topic", id: ws.programID, topic: data.topic}, ()=>{
                ntsl.cycle(ws);
            });
        }
    })
});

// Keep ws alive.
setInterval(function(){
    wss.clients.forEach(function(ws){
        if(ws.isAlive === false){
            ws.emit("closed", ws)
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(()=>{});
    })
}, 2000);

httpsServer.listen(8000)
ntsl.run({action: "clear"}, ()=>{})