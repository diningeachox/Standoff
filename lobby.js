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
    btn.className = "button -green center"; //Green button
	//btn.onclick = joinRoom();
	cell2.appendChild(btn);
	console.log(inRoom);
	//Only add enter btn if already joined room
	if (inRoom == 1){
		var btn = document.createElement('button');
	    btn.innerHTML = "ENTER";
	    btn.className = "button -green center"; //Green button
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
	$('#wrapper').load('board.html #wrapper', function(){ 

		console.log("Entering room " + id + " (again)"); 
		positionelements();		

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
		$('#wrapper').load('board.html #wrapper', function(){ 

			document.getElementById('doneBtn').style.visibility = 'hidden'; //Hide donebtn
			//Position canvas elements	
			positionelements();
			//Add keyevent to chat textarea
			$("#talk").keyup(
			function(e){
				//Enter key
				console.log(e.which);
			    if(e.which == 13){
			    	
			        // but not Shift + Enter
			        if (e.shiftKey !== true){	        
			        	var text = $("#talk").val();
			        	sendText(text);
			            $("#talk").val(''); //Clear chat
			        }
			        return false;
			    }
			});

			socket.emit("start", id); 
		});
	});
	//Set currentRoom
	currentRoom = id;
 });

socket.on("err", function(data){
 	alert(data);
});

function positionelements(){
	
	var w = window.innerWidth;
	var h = window.innerHeight;
	var field = document.getElementById("field");
	var ctx = field.getContext("2d");
	var overlay = document.getElementById("field_overlay");
	var overlay2 = document.getElementById("field_overlay_2");
	var placements = document.getElementById("field_placement")
	field.width = w / 2;
	field.height = h;
	field.style.left = (w / 4) + "px";
    field.style.top = "0px";
    field.style.position = "absolute";

    overlay.width = w / 2;
	overlay.height = h;
	overlay.style.left = (w / 4) + "px";
    overlay.style.top = "0px";
    overlay.style.position = "absolute";

    overlay2.width = w / 2;
	overlay2.height = h;
	overlay2.style.left = (w / 4) + "px";
    overlay2.style.top = "0px";
    overlay2.style.position = "absolute";

    placements.width = w / 2;
	placements.height = h;
	placements.style.left = (w / 4) + "px";
    placements.style.top = "0px";
    placements.style.position = "absolute";

    //Hexagon size
    hexLength = w / 70;
    blockDist = hexLength * Math.sqrt(3);
    centerX = field.width / 2 + field.width / 16;
    centerY = field.height / 2 - field.height / 12;
    cardWidth = w / 16;
    cardHeight = cardWidth * 1.5;



//Set animation layers
    var fly = document.getElementById("flying_card");
    fly.width = w;
	fly.height = h;
	fly.style.left = "0px";
    fly.style.top = "0px";
    fly.style.position = "absolute";

    //Set position of transcript and chat
    var trans = document.getElementById("transcript");
    trans.style.width = (w / 10) + 'px';
	trans.style.height = h/2 + "px";
	trans.style.right = "5px";
    trans.style.top = "0px";
    trans.style.position = "absolute";
    trans.style.overflow = "auto";
    trans.style.border = "1px solid black";

    var chat = document.getElementById("chat");
    chat.style.width = (w / 10) + 'px';
	chat.style.height = (3.0 * h / 8) + "px";
	chat.style.right = "5px";
    chat.style.top =  h/2 + "px";
    chat.style.position = "absolute";
    chat.style.overflow = "auto";
    chat.style.border = "1px solid black";

    var talk = document.getElementById("talk");
    talk.style.width = (w / 10) - 4 + 'px';
	talk.style.height = (h / 12) + "px";
	talk.style.right = "5px";
    talk.style.top =  (7.0 * h / 8) + "px";
    talk.style.position = "absolute";
    talk.style.overflow = "auto";
    talk.style.border = "1px solid black";

    var canvas = document.getElementById("lobbyBtn");
    canvas.style.top = (h - 80) + "px";

    $('#card_display').css({width: w / 7, height: w / 5, right: $('#chat').width() + 15, top: h / 4});

    $('#hand').prop("width", 5 * cardWidth);
    $('#hand').prop("height", cardHeight);
    $('#hand').css({left: (w / 2) - (3 * cardWidth), bottom: 10});

    $('#opp_hand').css({left: $('#hand').offset().left + (5.5 * cardWidth), top: 10, width: w / 15, height: w / 15});

    $('#hand_overlay').prop("width", 5 * cardWidth);
    $('#hand_overlay').prop("height", cardHeight);
    $('#hand_overlay').css({left: w / 2 - (3 * cardWidth), bottom: 10});

    $('#second_hand').prop("width", 5 * cardWidth);
    $('#second_hand').prop("height", cardHeight);
    $('#second_hand').css({left: (w / 2) - (3 * cardWidth), bottom: 10});

    $('#second_hand_overlay').prop("width", 5 * cardWidth);
    $('#second_hand_overlay').prop("height", cardHeight);
    $('#second_hand_overlay').css({left: w / 2 - (3 * cardWidth), bottom: 10});

    $('#deck_display').prop("width", cardWidth);
    $('#deck_display').prop("height", cardHeight);
    $('#deck_display').css({left: $('#hand').offset().left + (7 * cardWidth), bottom: 10});

    $('#opp_deck').prop("width", cardWidth);
    $('#opp_deck').prop("height", cardHeight);
    $('#opp_deck').css({left: $('#hand').offset().left + (7 * cardWidth), top: 10});

    $('#discard').prop("width", cardWidth);
    $('#discard').prop("height", cardHeight);
    $('#discard').css({left: $('#hand').offset().left + (8 * cardWidth) + 5, bottom: 10});

    $('#opp_discard').prop("width", cardWidth);
    $('#opp_discard').prop("height", cardHeight);
    $('#opp_discard').css({left: $('#hand').offset().left + (8 * cardWidth) + 5, top: 10});

    $('#playarea').css({left: 4 * cardWidth + 20});

    $('#staples').prop("width", 4 * cardWidth);
    $('#staples').prop("height", 2 * cardHeight);
    $('#staples').css({left: 10, top: 10});
    $('#staples_overlay').prop("width", 4 * cardWidth);
    $('#staples_overlay').prop("height", 2 * cardHeight);
    $('#staples_overlay').css({left: 10, top: 10});

    $('#random').prop("width", 4 * cardWidth);
    $('#random').prop("height", 2 * cardHeight);
    $('#random').css({left: 10, top: 10 + (2 * cardHeight) + 10});
    $('#random_overlay').prop("width", 4 * cardWidth);
    $('#random_overlay').prop("height", 2 * cardHeight);
    $('#random_overlay').css({left: 10, top: 10 + (2 * cardHeight) + 10});

    //Buttons
    $('.button').css({width: w / 15 + 10, height: w / 40});
    $('#endTurnBtn').css({left: $('#hand').offset().left + (5 * cardWidth) + 10, bottom: 10});
    $('#creditBtn').css({left: $('#hand').offset().left + (5 * cardWidth) + 10, bottom: 10 + (w / 30)});
    $('#undoBtn').css({left: $('#hand').offset().left + (5 * cardWidth) + 10, bottom: 10 + (w / 15)});

    $('#doneBtn').css({left: $('#hand').offset().left - (1.5 * cardWidth), bottom: 10});
}


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
	//Extra turn
	this.extra = 0;

	//row, col, and range
	this.r, co, range;

	this.tempPacket; //packet in midst of resolution
	this.tempCard; //Card in midst of resolution

	this.tempObj; //Add-on in construction

	//Game variables
	this.market = [];
	this.hand = [];
	this.deck = [];
	this.playarea = [];
	this.discard = [];
	this.opp_discard = [];
	this.field = {};
	this.effects = {};
	this.tempfield = {};
	this.coord;

	this.oppHand = [];

	//Actions
	this.actions = 4;
	this.placements = 1;
	this.budget = 0;

	//Field actions
	this.count = 0;

	//Flags
	this.resolving = 0;

	//Improvements
	this.improv = 0;
}

function saveVars(v){
	v.c = c;
	v.c2 = c2;
	v.num = num;
	//Turn marker
	v.turn = turn;
	//Extra turn
	v.extra = extra;

	//row, col, and range
	v.r = r;
	v.co = co;
	v.range = range;

	v.tempPacket = tempPacket; //packet in midst of resolution
	v.tempCard = tempCard; //Card in midst of resolution

	v.tempObj = tempObj; //Add-on in construction

	//Game variables
	v.market = market;
	v.hand = hand;
	v.deck = deck;
	v.playarea = playarea;
	v.discard = discard;
	v.opp_discard = opp_discard;
	v.field = field;
	v.effects = effects;
	v.tempfield = tempfield;
	v.coord = coord;
	v.oppHand = oppHand;
	
	//Actions
	v.actions = actions;
	v.placements = placements;
	v.budget = budget;

	//Field actions
	v.count = count;

	//Flags
	v.resolving = resolving;

	//Improvements
	v.improv = improv;
}

function loadVars(v){
	c = v.c;
	c2 = v.c2;
	num = v.num;
	//Turn marker
	turn = v.turn;
	//Extra turn
	extra = v.extra;

	//row, col, and range
	r = v.r;
	co = v.co;
	range = v.range;

	tempPacket = v.tempPacket; //packet in midst of resolution
	tempCard = v.tempCard; //Card in midst of resolution

	tempObj = v.tempObj; //Add-on in construction

	//Game variables
	market = v.market;
	hand = v.hand;
	deck = v.deck;
	discard = v.discard;
	playarea = v.playarea;
	opp_discard = v.opp_discard;
	field = v.field;
	effects = v.effects;
	tempfield = v.tempfield;
	coord = v.coord;
	oppHand = v.oppHand;	

	//Actions
	actions = v.actions;
	placements = v.placements;
	budget = v.budget;

	//Field actions
	count = v.count;

	//Flags
	resolving = v.resolving;

	//Improvements
	improv = v.improv;
}