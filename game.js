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
var market = [];

var exec = require("child_process").exec;
app.get('/', function(req, res){
	res.sendFile(__dirname + "/main.html");
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

 /*
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
	res.writeHead(301,
	  {Location: 'http://localhost:8080/constructed.html'}
	);
	res.end();
});
*/

//Shuffle an array
function shuffle(arr){
	var temp = [];
	var a = [];
	while (arr.length > 0){
		var card = Math.floor(Math.random() * arr.length);
		temp.push(arr[card]);
		arr.splice(card, 1);

	}
	
	
	return temp.slice();
}


console.log("Server started!");
const PORT = process.env.PORT || 8080;
serv.listen(PORT);


//Store multiple clients
var SOCKET_LIST = [];
var partners = [];

var io = require("socket.io")(serv, {});
io.on("connection", function(socket){

	//Give each client an ID at random
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	console.log(socket.id + "has connected");

	//Cards that are randomized for each draft
	var cardlist = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 31, 32, 35, 37];
	//create market
	for (i = 0; i < cardlist.length; i++){
		for (j = 0; j < 8; j++){
			market.push(cardlist[i]);
		}
	}
	market = shuffle(market);

	//Pair automatically when a second client connects
	if (!pendingPair){
		pendingPair = socket;
		partners[socket.id] = null;
		//Assigns the color yellow to player 1
		socket.emit("color", {c: "rgb(255, 255, 0)", c2: "rgb(50, 50, 255)", num: "1"});
		socket.emit("turn", {t : "1"});
	} else {
		p1 = pendingPair;
		p2 = socket;

		//Assign each other as partner sockets
		partners[pendingPair.id] = socket;

		//Assigns the color (light) blue to player 2
		p2.emit("color", {c: "rgb(50, 50, 255)", c2: "rgb(255, 255, 0)", num: "2"});
		
		pendingPair = null;
		console.log("Pairing successful! " + p1.id + " is paired with " + p2.id + "!");
		//p2.emit("start");

		//Tell p1 to randomize the draft market
		p1.emit("market", market);
		p2.emit("market", market);

		p1.emit("deck", {number: deck1});
		p2.emit("deck", {number: deck2});
		
		p2.emit("turn", {t : "0"});
		p2.emit("start");
		p1.emit("start");
		

	}
	
	//Delete client on disconnect
	socket.on("disconnect", function(){
		console.log(socket.id + " has disconnected");
		
		//Delete pair of partners
		partners[socket.id] = null;
		delete SOCKET_LIST[socket.id];
	});

	//Iterate over all pairings
	for (var id in partners){
		//If two clients are connected and paired
		if (partners.hasOwnProperty(id) && partners[id] != null){
			p1 = SOCKET_LIST[id];
			p2 = partners[id];
			console.log(p1.id + ", " + p2.id);
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

			//Communicate addons between clients
			p1.on("addForcefield", function(data){
				//Send location of placement to p2
				p2.emit("addForcefield", {
					xcoord: data.xcoord, ycoord: data.ycoord, player: data.player
				});
			});
			p2.on("addForcefield", function(data){
				//Send location of placement to p1
				p1.emit("addForcefield", {
					xcoord: data.xcoord, ycoord: data.ycoord, player: data.player
				});
			});

			//Communicate addons between clients
			p1.on("clearForcefield", function(data){
				//Send location of placement to p2
				p2.emit("clearForcefield", {
					xcoord: data.xcoord, ycoord: data.ycoord, player: data.player
				});
			});
			p2.on("clearForcefield", function(data){
				//Send location of placement to p1
				p1.emit("clearForcefield", {
					xcoord: data.xcoord, ycoord: data.ycoord, player: data.player
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

			//Targetted discard
			p1.on("targetDiscard", function(data){
				//Send location of placement to p2
				p2.emit("targetDiscard", {ind: data.ind});
			});
			p2.on("targetDiscard", function(data){
				//Send location of placement to p2
				p1.emit("targetDiscard", {ind: data.ind});
			});

			//Hand info
			p1.on("hand", function(data){
				//Send location of placement to p2
				p2.emit("hand", data);
			});
			p2.on("hand", function(data){
				//Send location of placement to p2
				p1.emit("hand", data);
			});

			//Start upkeep
			p1.on("upkeep", function(){
				p2.emit("upkeep");
			});
			p2.on("upkeep", function(){
				p1.emit("upkeep");
			});

			//Add a trojan horse card
			p1.on("trojan", function(){
				p2.emit("trojan");
			});
			p2.on("trojan", function(){
				p1.emit("trojan");
			});

			//Keep track of trojan horse gifts
			p1.on("horse", function(){
				p2.emit("horse");
			});
			p2.on("horse", function(){
				p1.emit("horse");
			});
			
			//Write transcript
			p1.on("event", function(data){
				p2.emit("event", data);
			});
			p2.on("event", function(data){
				p1.emit("event", data);
			});

			//Update market
			p1.on("market", function(data){
				p2.emit("market", data);
			});
			p2.on("market", function(data){
				p1.emit("market", data);
			});
			
			//Update discard piles
			p1.on("discard", function(data){
				p2.emit("discard", data);
			});
			p2.on("discard", function(data){
				p1.emit("discard", data);
			});

			//Update  quantity piles
			p1.on("quantity", function(data){
				p2.emit("quantity", data);
			});
			p2.on("quantity", function(){
				p1.emit("quantity", data);
			});

		}
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

