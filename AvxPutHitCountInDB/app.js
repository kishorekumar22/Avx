const express = require('express');
const path = require('path');
const bodyParser  = require("body-parser");
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret :"secret Key"
}));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname+'/html/input.html'));
});
app.get('/jQuery', function(req, res) {
    res.sendFile(path.join(__dirname+'/scripts/jQuery.js'));
});

app.post("/getHitCountData", function(req, res) {

	var URL = "mongodb://"+req.body.uname+":"+req.body.pwd+"@"+req.body.ip+":5000?ssl=true";
	//console.log(URL)
	req.session.sslEnabled = true;
	MongoClient.connect(URL,{ useNewUrlParser: true}, function(err, db) {
		
		if (err){
			//retrying
			URL = URL.substring(0, URL.indexOf('?'));
			console.log(URL);
			MongoClient.connect(URL,{ useNewUrlParser: true}, function(err, db) {
			if (err){
				console.log("Could not connect to DB!")
				console.log(err)
				res.send("<h2>Error!! <h2><h3>Could not connect to DB using the credentials provided!!!<h3>");
			} else{
				req.session.ip = req.body.ip;
				req.session.uname = req.body.uname;
				req.session.pwd = req.body.pwd;
				var dbo = db.db("appviewx")
					dbo.collection("firewallStats").distinct("policyName",function(err, result) {
						if (err) throw err;
						var htmlString = "<h3>Policies in DB</h3><p><i>Please click on the policy to randomly update hits for the policy</i></p><table><tr><th>S.No</th><th>Policyname</th></td>"
						result.forEach(function(pol,i){htmlString += "<tr><td>"+(i+1)+"</td><td><a href='#' id="+pol+" onclick='return updateHitcount(event)'>"+pol+"</a></tr>"});
	htmlString+="</table>"
						res.send(htmlString);
						db.close();
					});
				}
			});
		} else{
			req.session.ip = req.body.ip;
			req.session.uname = req.body.uname;
			req.session.pwd = req.body.pwd;
			var dbo = db.db("appviewx")
				dbo.collection("firewallStats").distinct("policyName",function(err, result) {
					if (err) throw err;
					var htmlString = "<h3>Policies in DB</h3><p><i>Please click on the policy to randomly update hits for the policy</i></p><table><tr><th>S.No</th><th>Policyname</th></td>"
						result.forEach(function(pol,i){htmlString += "<tr><td>"+(i+1)+"</td><td><a href='#' id="+pol+" onclick='return updateHitcount(event)'>"+pol+"</a></tr>"});
	htmlString+="</table>"
						res.send(htmlString);
						db.close();
				});
			}
	});
});
app.get('/updateHitcount', function(req, res) {
	//console.log("sesion data" + JSON.stringify(req.session))
	var URL = "mongodb://"+req.session.uname+":"+req.session.pwd+"@"+req.session.ip+":5000?ssl="+req.session.sslEnabled;
	MongoClient.connect(URL,{ useNewUrlParser: true}, function(err, db) {
		
		if (err){
			console.log("Could not connect to DB for updating Hit count for  : " + req.query.policyName)
			console.log(err)
			res.send("<h2>Error!! </h2><h3>Could not connect to DB for updating Hit count for  : " + req.query.policyName + "!!!</h3>");
		} else{
			var dbo = db.db("appviewx")
				dbo.collection("firewallStats").find({"policyName":req.query.policyName}).toArray(
					function(err,doc){
						for(i in doc){
							dbo.collection('firewallStats').updateOne({"ruleName":doc[i].ruleName, "policyName" : req.query.policyName },{"$set" : {"hitCount":   Math.floor(Math.random() * 799)}},
							function(err, result) {
								if (err) {
										console.log(err)
										res.send("Hit count update failed" );
									}
								});
						
						}
					res.send("<p style='color:red' ><b>Updated Hit count data for  : " +  req.query.policyName +"</b></p>");
					db.close();
				});
			}
	});   
});
const server = app.listen(7000);
console.log("Application start in the port : 7000");
console.log("Please use localhost:7000 to access")
