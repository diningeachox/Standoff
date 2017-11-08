//Open server
var express = require("express");
var app = express();
var serv = require("http").Server(app);
var Room = require('./room.js');
var uuid = require('uuid');

app.get('/', function(req, res){
	res.sendFile(__dirname + "/index.html");
	//exec("php index.php", function (error, stdout, stderr) {res.send(stdout);});
});
app.use("/", express.static(__dirname));

//Listen to port
console.log("Server started!");
const PORT = process.env.PORT || 8080;
serv.listen(PORT);

var io = require("socket.io")(serv, {});

var num = 1; //Room number
var SOCKET_LIST = [];

var people = {};  
var rooms = {};  
var clients = [];

//Cards that are randomized for each draft
var cardlist = [7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 20];


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



// Handle incoming connections from clients
io.sockets.on('connection', function(socket) {
	//socket.id = Math.random(); //Assign random ID
	SOCKET_LIST[socket.id] = socket;
	//people[socket.id] = {"name": socket.id, "room": ""};
	//clients.push(client);
	socket.emit('id', socket.id); //Tell client their ID
	console.log(socket.id + " has connected!");

	//show new client list of rooms
	listRooms();

    // once a client has connected, we expect to get a ping from them saying what room they want to join
    socket.on('create', function(name) {
    	var id = uuid.v4();
    	var room = new Room(name, id, socket.id); //create new room object
        socket.join(name); //Join the room

        room.addPerson(socket.id); //Add client to room's people
        rooms[id] = room;
        socket.room = name;
        listRooms();
        socket.emit("join", id); //Tell client to open game window

    });

    //client attempting to join a room
    socket.on('join', function(id) {
    	var room = rooms[id];
    	
    	//only join if room doesn't already contain the client or isn't already full
    	if (room.people.indexOf(socket.id) == -1 && room.people.length < 2){
    		room.addPerson(socket.id); //Add client to room's people
    		
    		socket.join(room.name); //Join room
    		socket.room = room.name;    		
    		socket.emit("join", room.id); //Tell client to open game window	

    	} else if (room.people.indexOf(socket.id) != -1){
    		socket.emit("err", "You have already joined this room!");
    	} else if (room.people.length >= 2){
    		socket.emit("err", "This room is already full!");
    	}
    });

	//Only start the game if both players are done loading the html page
	socket.on("start", function(id){
		var room = rooms[id];
		if (room.people.length == 2){ //If room is full (has 2 players)
			var p1 = SOCKET_LIST[room.people[0]]; //Player 1
			var p2 = SOCKET_LIST[room.people[1]]; //Player 2

    		p1.emit("msg", "Opponent found!<br>");	

			//Setup and start
			p1.emit("start", {c: "rgb(255, 255, 0)", c2: "rgb(150, 150, 255)", num: "1", t: "1"});
			p2.emit("start", {c: "rgb(150, 150, 255)", c2: "rgb(255, 255, 0)", num: "2", t: "0"});
			
			/* Set up the markets */			
			//create market
			var market = [];
			for (i = 0; i < cardlist.length; i++){
				for (j = 0; j < 4; j++){
					market.push(cardlist[i]);
				}
			}
			market = shuffle(market);
			io.sockets.in(room.name).emit("market", market); //Tell clients what the market is

			console.log("The game begins in room " + id + "!");
			io.sockets.in(room.name).emit("msg", "Game started!<br>");
		} else {
        	socket.emit("msg", "Waiting for opponent...<br>");
		}
	});

	socket.on("list_rooms", function(){
		listRooms();
		console.log("Listing rooms...");
	});

    socket.on("msg", function(data){
    	var room = rooms[data.room];
		socket.broadcast.to(room.name.toString()).emit("msg", data.msg);
	});

    //Delete client on disconnect
	socket.on("disconnect", function(){
		console.log(socket.id + " has disconnected");
		
		//Delete all rooms created with socket
		for (var id in rooms){
	    	var client = rooms[id].owner;
	    	if (client == socket.id){
	    		delete rooms[id];
	    	}
	    }
	    //Delete socket itself
		delete SOCKET_LIST[socket.id];
	});


	//Communication between clients in the same room

	//Exchange public info
	socket.on("status", function(data){
		var room = rooms[data.room];
		//Send to everyone else in the same room
		socket.broadcast.to(room.name.toString()).emit("status", {
			actions: data.actions, placements: data.placements, 
			budget: data.budget, handsize: data.handsize, decksize: data.decksize
		});
	});

	//Communicate placement between clients
	socket.on("placement", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("placement", {
			xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh, num: data.num, imp: data.imp
		});
	});

	//Communicate placement between clients
	socket.on("destroy", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("destroy", {
			xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh, num: data.num, imp: data.imp
		});
	});
	//Placement of improvements
	//Communicate placement between clients
	socket.on("improvement", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("improvement", {
			xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh, n: data.n
		});
	});

	socket.on("outline", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("outline", {
			xcoord: data.xcoord, ycoord: data.ycoord
		});
	});

	//Communicate shadow between clients
	socket.on("shadow", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("shadow", {
			xcoord: data.xcoord, ycoord: data.ycoord, sh: data.sh, color: data.color
		});
	});

	//Targetted discard
	socket.on("targetDiscard", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("targetDiscard", {ind: data.ind});
	});

	//Hand info
	socket.on("hand", function(data){
		var room = rooms[data.room];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("hand", {hand: data.hand});
	});

	//Start upkeep
	socket.on("upkeep", function(data){
		var room = rooms[data];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("upkeep");
	});

	//Add a trojan horse card
	socket.on("trojan", function(data){
		var room = rooms[data];
		//Send location of placement to p2
		socket.broadcast.to(room.name).emit("trojan");
	});
	
	//Write transcript
	socket.on("event", function(data){
		var room = rooms[data.room];
		socket.broadcast.to(room.name).emit("event", data.text);
	});

	//Update market
	socket.on("market", function(data){
		var room = rooms[data.room];
		socket.broadcast.to(room.name).emit("market", data.market);
	});
	
	//Update discard piles
	socket.on("discard", function(data){
		var room = rooms[data.room];
		socket.broadcast.to(room.name).emit("discard", data.discard);
	});

	//Update playarea
	socket.on("play", function(data){
		var room = rooms[data.room];
		socket.broadcast.to(room.name).emit("play", data.play);
	});

	socket.on("toDiscard", function(data){
		var room = rooms[data.room];
		socket.broadcast.to(room.name).emit("toDiscard", data.play);
	});

	//Update  quantity piles
	socket.on("quantity", function(data){
		var room = rooms[data.room];
		socket.broadcast.to(room.name).emit("quantity", data.number);
	});


});

function listRooms()
{
    //Tell each client to create a rooms table
    for (var id in SOCKET_LIST){
    	var socket = SOCKET_LIST[id];
    	socket.emit("list_rooms", rooms);
    }
}