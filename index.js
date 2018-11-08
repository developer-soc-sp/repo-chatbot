var express = require("express");
var app = express();

app.get("/", function(req,res){
    res.send("<h1>Hello World</>");
});

var listener = app.listen(process.env.PORT,
                        process.env.IP,
                        function(){
                            console.log("server started");
                            console.log("listening on port " +
                            listener.address().port);
                        });