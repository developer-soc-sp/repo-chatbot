var express = require("express");
var app = express();

app.get("/", function(req,res){
    res.send("<h1>Hello World</>");
});

app.get("/ai",function(req,res){
    var response = "GET:This is a sample response from your webhook";
    res.send(JSON.stringify({  "fulfillmentText": response + "for v2"
                            }));
});

app.get("/ai",function(req,res){
    var response = "POST:This is a sample response from your webhook";
    res.send(JSON.stringify({  "fulfillmentText": response + "for v2"
                            }));
});
    
var listener = app.listen(process.env.PORT,
                        process.env.IP,
                        function(){
                            console.log("server started");
                            console.log("listening on port " +
                            listener.address().port);
                        });