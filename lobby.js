/* Game room management */

 var socket = io.connect();
 var id;
 var currentRoom; //Only displays one room at a time (remembers the name)
 var games = []; 
 var num = 1; //Keeps track of number of rooms client has created
 function createRoom(){
 	var name = prompt("Choose a room name", "");
	if (name != null) {
	    socket.emit('create', name);
	} 	
 }

 function joinRoom(id){
 	socket.emit('join', id);
 }

/*Managing rooms table. If owned == 1, will not have join button
If owned == 0, will have join button */
 function addRow(name, id, inRoom){
     var table = document.getElementById("room_table");
	// Create an empty <tr> element and add it to the 1st position of the table:
	var row = table.insertRow(0);

	// Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);

	// Add some text to the new cells:
	cell1.innerHTML = name;
	//Join button on cell two
	var btn = document.createElement('button');
	//var t = document.createTextNode("JOIN");
    btn.innerHTML = "JOIN";
    btn.id = id; //Remember the ID of the room
    btn.addEventListener('click', function(event) {
	    joinRoom(btn.id);
	  });
	//btn.onclick = joinRoom();
	cell2.appendChild(btn);
	console.log(inRoom);
	//Only add enter btn if already joined room
	if (inRoom == 1){
		var btn = document.createElement('button');
	    btn.innerHTML = "ENTER";
	    btn.id = id; //Remember the ID of the room
	    btn.addEventListener('click', function(event) {
		    enter_room(id);
		  });
		//btn.onclick = joinRoom();
		cell3.appendChild(btn);
	}
	
}

function send(){
 	socket.emit("msg", "Hello!");
}

function lobby(){
	//Go back to the lobby
	$('#wrapper').load('index.html #wrapper', function(){ 
		socket.emit("list_rooms");
		console.log("Back to lobby");
	});

	//Save game variables
	if (games[currentRoom]){
		saveVars(games[currentRoom]);
	}
 }

 function quit(id){
 	socket.emit("quit", id);
 }

function enter_room(id){
	$('#wrapper').load('main.html #wrapper', function(){ 
		console.log("Entering room " + id + " (again)"); 
		//Set currentroom to id
		currentRoom = id;
		
		//Load variables
		if (games[id]){
			loadVars(games[id]);

			//Redraw everything
			drawHand();
			drawField(); 
			drawDeck();
			drawPiles();
			sendStatus();
			showStatus(); 

			//Enable/disable buttons
			if (games[id].turn == 0){
				disableButtons();
			}
			document.getElementById("undoBtn").disabled = true;

			//Initialize the event listeners
			initialize_hand(); 
			initialize_field();
			initialize_deck();
			initialize_market(); 
		}
	});


}

function draw_table(rooms){
	if (rooms) {
 		$("#room_table tr").remove();  //Clear table rows first
        for (var room in rooms) {
           	var r = rooms[room];
            //Draw a table row with room info
            console.log(r.people);
            addRow(r.name, r.id, r.people.indexOf(id) != -1);  	           
        }
	}
}

//Add a row when server tells the client that a new client has connected
socket.on("add", function(data){
 	addRow(data);
 });

//Get client ID
socket.on("id", function(data){
 	id = data;
});

socket.on("list_rooms", function(rooms){
 	draw_table(rooms);
});

socket.on("join", function(id){
	//Load contents from main.html, tell server that it's ready to start after loading
	$(document).ready(function() {
		$('#wrapper').load('main.html #wrapper', function(){ socket.emit("start", id); });
	});
	//Set currentRoom
	currentRoom = id;
 });

socket.on("err", function(data){
 	alert(data);
});

/*____________________________________________________________________*/
/*--------------------------------------------------------------------*/
/*____________________________________________________________________*/

/* Stores all relevant game variables for page switching */
function Game(id){
	//Room name (very important!)
	this.id = id;

	//Following are all game variables
	this.c;
	this.c2;
	this.num;
	//Turn marker
	this.turn;
	//Debt
	this.debt = 0;
	//Trojan Horses giving free resources
	this.horses = 0;
	//Extra turn
	this.extra = 0;

	//row, col, and range
	this.r, co, range;

	this.tempPacket; //packet in midst of resolution
	this.tempColor;
	this.tempCard; //Card in midst of resolution

	this.tempObj; //Add-on in construction

	//Game variables
	this.market = [];
	this.hand = [];
	this.deck = [];
	this.discard = [];
	this.opp_discard = [];
	this.field = [];
	this.addOns = [];
	this.effects = [];
	this.coord;

	this.oppHand = [];

	//Actions
	this.actions = 4;
	this.placements = 1;
	this.budget = new Vector(0, 0);

	//Flags
	this.resolving = 0;
	//Next action is free
	this.free = 0;
	this.isPoly = 0;

	//Improvements
	this.improv = 0;
}

function saveVars(v){
	v.c = c;
	v.c2 = c2;
	v.num = num;
	//Turn marker
	v.turn = turn;
	//Debt
	v.debt = debt;
	//Trojan Horses giving free resources
	v.horses = horses;
	//Extra turn
	v.extra = extra;

	//row, col, and range
	v.r = r;
	v.co = co;
	v.range = range;

	v.tempPacket = tempPacket; //packet in midst of resolution
	v.tempColor = tempColor;
	v.tempCard = tempCard; //Card in midst of resolution

	v.tempObj = tempObj; //Add-on in construction

	//Game variables
	v.market = market;
	v.hand = hand;
	v.deck = deck;
	v.discard = discard;
	v.opp_discard = opp_discard;
	v.field = field;
	v.addOns = addOns;
	v.effects = effects;
	v.coord = coord;
	v.oppHand = oppHand;
	
	//Actions
	v.actions = actions;
	v.placements = placements;
	v.budget = budget;

	//Flags
	v.resolving = resolving;
	//Next action is free
	v.free = free;
	v.isPoly = isPoly;

	//Improvements
	v.improv = improv;
}

function loadVars(v){
	c = v.c;
	c2 = v.c2;
	num = v.num;
	//Turn marker
	turn = v.turn;
	//Debt
	debt = v.debt;
	//Trojan Horses giving free resources
	horses = v.horses;
	//Extra turn
	extra = v.extra;

	//row, col, and range
	r = v.r;
	co = v.co;
	range = v.range;

	tempPacket = v.tempPacket; //packet in midst of resolution
	tempColor = v.tempColor;
	tempCard = v.tempCard; //Card in midst of resolution

	tempObj = v.tempObj; //Add-on in construction

	//Game variables
	market = v.market;
	hand = v.hand;
	deck = v.deck;
	discard = v.discard;
	opp_discard = v.opp_discard;
	field = v.field;
	addOns = v.addOns;
	effects = v.effects;
	coord = v.coord;
	oppHand = v.oppHand;	

	//Actions
	actions = v.actions;
	placements = v.placements;
	budget = v.budget;

	//Flags
	resolving = v.resolving;
	//Next action is free
	free = v.free;
	isPoly = v.isPoly;

	//Improvements
	improv = v.improv;
}