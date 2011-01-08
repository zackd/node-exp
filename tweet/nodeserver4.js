/*
* simple static fileserver + twitter feed
*/

var sys = require("sys"),
	http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	events = require("events"),
	port = 8000;

// simple static server	
function loadStaticFile(uri, response) {
	var filename = path.join(process.cwd(), uri);
	//
	path.exists(filename, function(exists) {
		if (!exists) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not Found\n");
			response.end();
			return;
		}
		fs.readFile(filename, "binary", function(err, file) {
			if (err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}

			response.writeHead(200);
			response.write(file, "binary");
			response.end();
		});
		
	});
}	

var twitterClient = http.createClient(80, 'api.twitter.com');
var tweetEmitter = new events.EventEmitter();

function getTweets() {
	var request = twitterClient.request("GET", "/1/statuses/public_timeline.json", {"host": "api.twitter.com"});
	request.addListener("response", function (response) {
		var body = "";
		
		response.addListener("data", function (data) {
			body += data;
		});
		
		response.addListener("end", function (end) {
			var tweets = JSON.parse(body);
			if ('error' in tweets) {
				
				console.log(tweets.error);
				
			} else if (tweets.length > 0) {
				tweetEmitter.emit("tweets", tweets);
				//console.log(tweets, 'tweets loaded');
			}
		});
	});
	
	request.end();
}

setInterval(getTweets, 2000); // twitter accepts max 150 requests per hour: 1 req every 24 seconds

http.createServer(function (request, response) {
	var uri = url.parse(request.url).pathname;
	console.log(uri);
	if (uri === '/stream') {
		var cb = function (tweets) {
			console.log('tweet'); // never happens!
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write(JSON.stringify(tweets));
			response.end();
			clearTimeout(timeout);
		};
		tweetEmitter.addListener("tweets", cb);
		
		// timeout to kill requests that take longer than 10 secs
		var timeout = setTimeout(function () {
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write(JSON.stringify([]));
			response.end();
			tweetEmitter.removeListener("tweets", cb);
		}, 5000);
		
	} else {
		loadStaticFile(uri, response);
	}

}).listen(port);

console.log("Server running at http://localhost:" + port + "/");
