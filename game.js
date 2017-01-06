// turn off limits by default (BE CAREFUL)

//require('events').EventEmitter.prototype._maxListeners = 0;

//Open server
var express = require("express");
var app = express();
var serv = require("http").Server(app);


//Variable used to keep track of automatic pairing
var pendingPair = null;
var p1 = null;
var p2 = null;
var deck1 = null;
var deck2 = null;

//To get node.js to execute php scripts
var exec = require("child_process").exec;
app.get('/', function(req, res){
	res.sendFile(__dirname + "/index.html");
	//exec("php index.php", function (error, stdout, stderr) {res.send(stdout);});
});
app.use("/", express.static(__dirname));



var bodyParser = require("body-parser");
/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

app.post("/", function (req, res) {
	//Assign decks
    if (deck1 == null && deck2 == null){
    	deck1 = req.body.deck;
    } else if (deck1 != null && deck2 == null){
    	deck2 = req.body.deck;
    } else if (deck1 != null && deck2 != null){
    	deck1 = req.body.deck;
    	deck2 = null;
    }
    //Redirect to game page
    /*
	app.get('*',function(req,res){  
	    res.redirect("http://localhost:2000/app.html")
	})
	*/
	res.writeHead(301,
	  {Location: 'http://localhost:2000/constructed.html'}
	);
	res.end();
});




console.log("Server started!");
const PORT = process.env.PORT || 2000;
serv.listen(PORT);


//Store multiple clients
var SOCKET_LIST = [];

var io = require("socket.io")(serv, {});
io.on("connection", function(socket){

	//Give each client an ID at random
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	console.log(socket.id + "has connected");

	//Pair automatically when a second client connects
	if (!pendingPair){
		pendingPair = socket;
		//Assigns the color yellow to player 1
		socket.emit("color", {c: "rgb(255, 255, 0)", c2: "rgb(50, 50, 255)", num: "1"});
		socket.emit("turn", {t : "1"});
	} else {
		p1 = pendingPair;
		p2 = socket;
		//Assigns the color (light) blue to player 2
		p2.emit("color", {c: "rgb(50, 50, 255)", c2: "rgb(255, 255, 0)", num: "2"});
		
		pendingPair = null;
		console.log("Pairing successful!")
		//p2.emit("start");
		p1.emit("deck", {number: deck1});
		p2.emit("deck", {number: deck2});
		
		p2.emit("start");
		p1.emit("start");
		p2.emit("turn", {t : "0"});
		

	}
	
	//Delete client on disconnect
	socket.on("disconnect", function(){
		console.log(socket.id + " has disconnected");
		delete SOCKET_LIST[socket.id];
	});

	//If two clients are connected and paired
	if (p1 != null && p2 != null){
		//Tell players to start the game
		//io.sockets.emit("start");
		

		//Exchange public info
		p1.on("status", function(data){
			//Send location of placement to p2
			p2.emit("status", {
				actions: data.actions, placements: data.placements, 
				budget: data.budget, handsize: data.handsize
			});
		});
		p2.on("status", function(data){
			//Send location of placement to p2
			p1.emit("status", {
				actions: data.actions, placements: data.placements, 
				budget: data.budget, handsize: data.handsize
			});
		});

		//Communicate placement between clients
		p1.on("placement", function(data){
			//Send location of placement to p2
			p2.emit("placement", {
				xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh, color: data.color
			});
		});
		p2.on("placement", function(data){
			//Send location of placement to p1
			p1.emit("placement", {
				xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh, color: data.color
			});
		});

		//Placement of improvements
		//Communicate placement between clients
		p1.on("improvement", function(data){
			//Send location of placement to p2
			p2.emit("improvement", {
				xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh,
				n: data.n
			});
		});
		p2.on("improvement", function(data){
			//Send location of placement to p1
			p1.emit("improvement", {
				xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh,
				n: data.n
			});
		});

		//Communicate addons between clients
		p1.on("addon", function(data){
			//Send location of placement to p2
			p2.emit("addon", {
				xcoord: data.xcoord, ycoord: data.ycoord, type: data.type
			});
		});
		p2.on("addon", function(data){
			//Send location of placement to p1
			p1.emit("addon", {
				xcoord: data.xcoord, ycoord: data.ycoord, type: data.type
			});
		});

		//Discard
		p1.on("randomDiscard", function(){
			//Send location of placement to p2
			p2.emit("randomDiscard");
		});
		p2.on("randomDiscard", function(){
			//Send location of placement to p2
			p1.emit("randomDiscard");
		});

		//Start upkeep
		p1.on("upkeep", function(){
			p2.emit("upkeep");
		});
		p2.on("upkeep", function(){
			p1.emit("upkeep");
		});

		//Enable buttons
		p1.on("enable", function(){
			p2.emit("enable");
		});
		p2.on("enable", function(){
			p1.emit("enable");
		});

		//Boardwipe
		p1.on("boardwipe", function(){
			p2.emit("boardwipe");
		});
		p2.on("boardwipe", function(){
			p1.emit("boardwipe");
		});

		//Boardwipe
		p1.on("playCard", function(){
			p2.emit("playCard");
		});
		p2.on("playCard", function(){
			p1.emit("playCard");
		});


		//Queue info
		p1.on("queue", function(data){
			p2.emit("queue", 
				{card: data.card, player: data.player, slot: data.slot});
		});
		p2.on("queue", function(data){
			p1.emit("queue", 
				{card: data.card, player: data.player, slot: data.slot});
		});

		//updatequeue
		//Boardwipe
		p1.on("updateQueue", function(){
			p2.emit("updateQueue");
		});
		p2.on("updateQueue", function(){
			p1.emit("updateQueue");
		});
	}

/*
	socket.on("placement", function(data){
		console.log(data.sh);
	});
*/

});

/*
setInterval(function(){
	//Process data and send data to other player
	if (p1 != null && p2 != null){
		p1.on("placement", function(data){
			console.log(data.x + ", " + data.y + ", " + data.packet);
		});
	}
}, 1000/25);
*/

//-----------------------------------------------

