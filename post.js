/* 
* simple POST 
*/

var sys = require('sys'),
	http = require('http'),
	port = 8000;

http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	//Add a listener to the request for the request body data
	var thing = null;
	req.addListener('data', function(data){
		thing = data.toString();
	}).addListener('end', function() {
		res.end("Post data:"+thing);
	});  

}).listen(port);

sys.puts("Server running at http://localhost:" + port + "/");


// test with
// curl -d "param1=value1" localhost:8000