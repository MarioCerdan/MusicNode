var http = require('http');
var Static = require('node-static');
var app = http.createServer(handler);
var io = require('socket.io').listen(app);
var LastFmNode = require('lastfm').LastFmNode;
var superRequest = require('superagent');
var port = 8080;

var files = new Static.Server('./public');

var lastfm = new LastFmNode({
		api_key: 'a513d4548c07017bb294cccca38d9d73',
		secret: '83ba07e87bc9a95f7034af7a8ec6119f'
	});
var songkickKey = '1bAtK0aScvwgGTDE';
	
var artists = [];

function handler (request, response) {
	request.on('end', function() {
		files.serve(request, response);
	}).resume();
}

// delete to see more logs from sockets
io.set('log level', 1);

io.sockets.on('connection', function (socket) {

	socket.on('send:coords', function (data) {
		socket.broadcast.emit('load:coords', data);
	});
	
	
var request = lastfm.request("chart.getTopArtists", {
    handlers: {
        success: function(data) {
            console.log("Success: " + data);
			
			for(var i=0; i < data.artists.artist.length; i++){
					artists[i] = {}
				    artists[i]['name'] = data.artists.artist[i]['name'];
					artists[i]['icon'] = data.artists.artist[i].image[0]['#text'];
					console.log("veamos:  joer "+require('util').inspect(data.artists.artist[i].image[0]['#text']));
			}
	    	for(var j=0; j < artists.length; j++){
				(function(i) {
					superRequest('http://api.songkick.com/api/3.0/search/artists.json?query='+encodeURIComponent(artists[i]['name'])+'&apikey=1bAtK0aScvwgGTDE', function (res) {
					//console.log("tercero:  joer "+require('util').inspect(res.body.resultsPage.results.artist[0].id));
						if (200 == res.status) {
							artists[i]['id'] = res.body.resultsPage.results.artist[0].id;
							superRequest('http://api.songkick.com/api/3.0/artists/'+artists[i].id+'/calendar.json?apikey=1bAtK0aScvwgGTDE', function (res) {
							if (200 == res.status) {
									(function(h) {
									  if (res.body.resultsPage.results.event && res.body.resultsPage.results.event[0].location){
										socket.emit('load:coords',res.body.resultsPage.results.event[0].location, res.body.resultsPage.results.event[0].uri, artists[h]);
										//socket.broadcast.emit('load:coords',res.body.resultsPage.results.event[0].location, res.body.resultsPage.results.event[0].displayName, artists[h].name);
										}
									})(i);
							}
							});
						}
					});
					})(j);
		}
		},
	
        error: function(error) {
            console.log("Error: " + error.message);
        }
    }
});	
	
});

// start app on specified port
app.listen(port);
console.log('Your server goes on localhost:' + port);