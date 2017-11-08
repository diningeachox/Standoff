//<![CDATA[
var turnnum = 1;
/** Actual game logic */


var games = [];
/* All game variables (that need to be saved) */
var c;
var c2;
var num;
//Turn marker
var turn;
//row, col, and range
var r, co, range;

var tempPacket; //packet in midst of resolution
var tempCard; //Card in midst of resolution

//Keep track of mouse position
var cursorX;
var cursorY;

//Game variables
var market = [];
var hand = [];
var deck = [];
var playarea = [];
var discard = [];
var opp_discard = [];
var field = {};
var effects = {};
var tempfield = {};
var coord;
var oppHand = [];

//Field actions
var count = 0;
var tempShape = [];

//Actions
var actions = 4;
var placements = 1;
var budget = 0;

//Flags
var resolving = 0;

//Improvements
var improv = 0;

//Wells
var wells = [[6, 0], [-6, 0], [0, 6], [0, -6], [6, -6], [-6, 6]];
var placement_wells = [[-3, 6], [3, -6]];


//Follow the mouse
document.onmousemove = function(e){
    cursorX = e.pageX;
    cursorY = e.pageY;
}

function enableButtons(){
	document.getElementById("endTurnBtn").disabled = false;
	document.getElementById("creditBtn").disabled = false;
}

function disableButtons(){
	document.getElementById("endTurnBtn").disabled = true;
	document.getElementById("creditBtn").disabled = true;

}

//Begin a turn (this is the upkeep phase)
socket.on("upkeep", function(){
	budget = 0;
	turn = 1;
	enableButtons();

	if (num == 1){
		turnnum += 1;
		var text = "Turn " + turnnum + ": <br>";
		updateScroll(text);
	}

	//Clear playarea
	var canvas = document.getElementById("playarea");
	ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//Count credit improvs
	for (i = 0; i < wells.length; i++){
		if (field[wells[i]].num == num){
			budget += 1;
		}
	}

	for (i = 0; i < placement_wells.length; i++){
		if (field[placement_wells[i]].num == num){
			placements += 1;
		}
	}
	sendStatus();
	showStatus();

});

//On getting signal from server to start, call all game functions
socket.on("start", function(data){	
	console.log("Player ready!");

	//Create new game object
	var g = new Game(currentRoom);
	games[currentRoom] = g;
	loadVars(g); //Load all game variables from g

	//Get color depending on whether client is first or second player
	c = data.c; 
	c2 = data.c2;
	num = parseInt(data.num);
	turn = parseInt(data.t);		

	initialize_vars();	

	//Disable buttons if not on turn
	if (turn == 0){
		disableButtons();
	}
	document.getElementById("undoBtn").disabled = true; //Undo btn is disabled at start
	
	
	//Send public info to opponent
	if (turn == 1){
		sendStatus();
		var text = "Turn 1: <br>";
		updateScroll(text);
	}
	
	
	drawHand();
	drawField(); 
	//drawDeck();
	drawPiles();
	
	//Initialize the event listeners
	initialize_hand(); 
	initialize_field();
	initialize_deck();	
	initialize_market();
	var canvas = document.getElementById("deck_display");
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "brown";
	ctx.fillRect(0, 0, cardWidth, cardHeight);
	ctx.font = "48px serif";
  	ctx.strokeText(deck.length, 10, 50);

  	showStatus(); 

});

function drawPiles(){
	var canvas = document.getElementById("discard");
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "gray";
	ctx.fillRect(0, 0, 150, 200);
	ctx.font = "30px serif";
  	ctx.strokeText("Discard", 10, 50);
  	ctx.strokeText("pile", 10, 100);

  	//Draw opp discard
  	canvas = document.getElementById("opp_discard");
	ctx = canvas.getContext("2d");
  	ctx.fillStyle = "gray";
	ctx.fillRect(0, 0, 150, 200);
	ctx.font = "30px serif";
  	ctx.strokeText("Opponent's", 10, 50);
  	ctx.strokeText("discard", 10, 100);

  	canvas = document.getElementById("opp_hand");
	ctx = canvas.getContext("2d");

	var image = images[images.length - 1]; //Hand image is the last one
	if (image.complete){
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	}

	//Opp deck
	canvas = document.getElementById("opp_deck");
	ctx = canvas.getContext("2d");
	ctx.fillStyle = "brown";
	ctx.fillRect(0, 0, cardWidth, cardHeight);
	ctx.font = "48px serif";
  	ctx.strokeText("5", 10, 50);
}

//Checks if the field contains a player's tiles
function contains(arr, num){
	for (i = -1 * boardsize; i < boardsize; i++) {
		for (j -1 * boardsize; j < boardsize; j++) {
			if (field.hasOwnProperty([i, j]) && field[[i, j]].num == num){
				return true;
			}	    	
		}
	}
	return false;
}

function displayCard(obj){
	var canvas = document.getElementById("card_display");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	obj.drawImg(ctx, 0, 0, canvas.width, canvas.height);	
}

function initialize_market(){
	var overlay = document.getElementById("random_overlay");
	var overlay2 = document.getElementById("staples_overlay");
	var sel = new Selection(event, overlay);
	var sel2 = new Selection(event, overlay2);

	overlay.addEventListener("mousedown", 
		function(event){
			if (turn == 1){
				//Do selection				
				var number = sel.draw(2, Math.min(8, market.length));
				if (number != -1 && number < market.length){
					//If player has enough resources
					var card = cards[market[number]];
					var cost = card.price;
					if (budget >= cost && actions > 0){
						updateDiscard(cards[(market.splice(number, 1)[0])]);
						drawMarket();
						socket.emit("market", {room: currentRoom, market: market});
						drawDiscard(discard[discard.length - 1]);
						actions -= 1;
						budget -= cost;
						showStatus();
						sendStatus();
						var text ="<strong> Player " + num + "</strong> buys <strong>" + card.name + "<strong>. <br>";
						updateScroll(text);
					} else if (budget < cost) {
						alert("You do not have enough credits to buy this card!");
					} else if (actions == 0){
						alert("You do not have enough actions to buy this card!");
					}
				}
			}
		}, 
	false);

	overlay.addEventListener("mousemove", 
		function(event){
			//Draw card
			var num = sel.index();
			
			displayCard(cards[market[num]]);
		}, 
	false);
	
	overlay2.addEventListener("mousedown", 
		function(event){
			if (turn == 1){
				//Draw selection
				var number = sel2.draw(2, 8);
				if (number != -1 && quantity[number] > 0){
					var card = cards[staples[number]];
					var cost = card.price;
					if (budget >= cost && actions > 0){
						updateDiscard(cards[staples[number]]);	
						quantity[number] -= 1; //Subtract 1 from the staple pile
						drawMarket();
						socket.emit("market", {room: currentRoom, market: market});
						socket.emit("quantity", {room: currentRoom, number: number});
						drawDiscard(discard[discard.length - 1]);
						budget -= cost;
						actions -= 1;
						showStatus();
						sendStatus();
						var text ="<strong> Player " + num + "</strong> buys <strong>" + card.name + "<strong>. <br>";
						updateScroll(text);
					} else if (budget < cost) {
						alert("You do not have enough credits to buy this card!");
					} else if (actions == 0){
						alert("You do not have enough actions to buy this card!");
					}
				}
			}
		}, 
	false);

	overlay2.addEventListener("mousemove", 
		function(event){
			//Draw card			
			var num = sel2.index();

			displayCard(cards[staples[num]]);
		}, 
	false);

	overlay.addEventListener("mouseout", 
		function(event){
			//Clear overlay canvas
			var ctx = overlay.getContext("2d");
			ctx.clearRect(0, 0, overlay.width, overlay.height);
			sel.reset(); //Reset selection
		}, 
	false);

	overlay2.addEventListener("mouseout", 
		function(event){
			//Clear overlay canvas
			var ctx = overlay2.getContext("2d");
			ctx.clearRect(0, 0, overlay2.width, overlay2.height);
			sel2.reset(); //Reset selection
		}, 
	false);

	//Update market and discard piles
	drawMarket();
}

//Initialize variables on connection to server
function initialize_vars(){
	//Want a hex grid spanning 7 hexes from the center in all directions (in axial coords)
	for (i = -1 * boardsize; i <= boardsize; i++){
		for (j = -1 * boardsize; j <= boardsize; j++){
			var dist = Math.abs(i) + Math.abs(j) + Math.abs(-1 * (i + j));
			if (dist <= 2 * boardsize){
				field[[i, j]] = new Hex(i, j, hexLength);
				tempfield[[i, j]] = new Hex(i, j, hexLength);
				if (dist == boardsize + 1 && i != 0 && j != 0 && i != -j){
					field[[i, j]].num = 3;
				}
				if (dist == 2 * boardsize){
					field[[i, j]].num = 3;
				} 
			}
		}		
	}

	var cleartiles = [[3, 4],  [-7, 3], [-3, -4],  [7, -3],
						[4, 3],  [-7, 4], [-4, -3],  [7, -4]];
	for (i = 0; i < cleartiles.length; i++){
		field[cleartiles[i]].num = 0;
	}

	//Add +credit tiles
	for (i = 0; i < wells.length; i++){
		field[wells[i]].addOn = 3;
	}

	var forcefields = [[-2, 4], [2, -4]];

	for (i = 0; i < forcefields.length; i++){
		field[forcefields[i]].addOn = 2;
	}

	
	for (i = 0; i < placement_wells.length; i++){
		field[placement_wells[i]].addOn = 4;
	}

	//Deck	
	deck = starter.slice();
	//Shuffle deck and draw 5 cards as the starting hand
	deck = shuffle(deck);
	//Draw 5
	draw(5, 0);

}

//Check to see if end of game is triggered, if so check to see who has won
function checkEnd(){
	var p1 = 0;
	var p2 = 0;
	var p1_total = 0;
	var p2_total = 0;
	var values = [0, 1, 0, 0];
	
	for (i = -1 * boardsize; i <= boardsize; i++){
		for (j = -1 * boardsize; j <= boardsize; j++){
			var dist = Math.abs(i) + Math.abs(j) + Math.abs(-1 * (i + j));
			if (dist <= 4){ //In central hex grid
				if (field.hasOwnProperty([i, j])) {
					if (field[[i, j]].num == 0){
						//Empty hex, then game has not yet ended
						return -1;
					} else {
						p1 += values[field[[i, j]].num];
						p2 += values[3 - field[[i, j]].num];
					}
				}
				
			} else if (dist <= 2 * boardsize){
				//Add up all player hexes
				if (field.hasOwnProperty([i, j])) {					
					p1_total += values[field[[i, j]].num];
					p2_total += values[3 - field[[i, j]].num];				
				}
			}
		}		
	}

	/*If tied in the central grid, the one with the 
	least tiles on the entire field wins; if still tied
	the win goes to the second player */
	return (((p2 > p1) ? 1 : 0) + 1) - ((p2 == p1 && p2_total < p1_total) ? 1 : 0);
}

function showStatus(){
	document.getElementById("display").innerHTML = 
	"Actions left: " + actions + "<br>" + 
	"Placements left: " + placements + "<br>" + 
	"Credits: " + budget + "<br>";
}

//Measures hex distance between (a, b) and (c, d)
function dist(a, b, c, d){
	return (Math.abs(c - a) + Math.abs(d - b) + Math.abs(-1 * (a + b) + (c + d))) / 2;
}

function tutor(){
	//First create a canvas to display the cards in the deck
	function tutorCard(selection, arr){
		hand.push(arr[selection[0]]); //Add tutored card to hand
		arr.splice(selection[0], 1);
		drawHand();
		drawDeck();
		showStatus();
		sendStatus();
		var text ="<strong> Player " + num + "</strong> chooses a card from his/her deck and puts it into his/her hand. <br>";
		update(text);
		
	}
	var newthing = new Box("#dialog", 1, deck, num, "Choose a card from your deck to put into your hand", tutorCard, 1);
	sendStatus();
	showStatus();
	//resolving = 0;
}

function disposal(){
	function trashCards(selection, arr){
		var cards = selection;
  		//Then remove one by one
  		//console.log(selection);
  		for (var i = 0; i < cards.length; i++){
			var a = arr.splice(cards[i], 1);
			var text ="<strong> Player " + num + "</strong> trashes <strong>" + a[0].name + "<strong>. <br>";
			update(text);
		}
	}
	var newthing = new Box("#dialog", 3, hand, num, "Choose up to 2 cards to trash from your hand", trashCards, 0);
	sendStatus();
	showStatus();
	
}

//Look through the discard pile
function seeDiscard(element, arr){
	if (arr.length > 0){
		$( function() {
			var canvas = document.createElement("canvas");
			//Change title to state number of cards in discard
			var title = $(element).attr('title');
			$(element).attr('title', title + ': ' + arr.length + ' cards');

			$( element).dialog({
			  dialogClass: "no-close",
			  modal: true,
			  width: 1100,
			  height: 350,
			  buttons: [
			    {
			      id: "button_ok",
			      text: "OK",
			      click: function() {
			      	//Just close and do nothing else
			        $( this ).dialog( "close" );
			      }
			    }
			  ]
			});
			//Create canvas for display			
			canvas.width = arr.length * 150;
			canvas.height = 200;
			canvas.style.left = "0px";
       	 	canvas.style.top = "0px";
        	canvas.style.position = "absolute";

			var offset = $(element).offset();
			$(element).append(canvas);
			
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			//draw the cards
			for (index = 0; index < arr.length; index++){
				cards[arr[index].ind].drawImg(ctx, index * 150, 0, 150, 200);
			}
		  } );
	}
}

function trojan(){
	socket.emit("trojan", currentRoom);
}

//Take back a current placement
function undo(){
	resolving = 0;
	tempPacket = null;
	tempShape = [];
	for (var key in tempfield) {
	    // check if the property/key is defined in the object itself, not in parent
	    if (tempfield.hasOwnProperty(key)) {           
	        tempfield[key].num = 0; 	      
	    }
	}
	drawField();
	//Put card currently in resolution back to owner's hand
	if (tempCard != null){
		hand.push(tempCard);
		//Update play area
		playarea.pop();
		socket.emit("play", {room: currentRoom, play: playarea});
		drawPlay(playarea);
	}
	drawHand();
	//clear field overlay
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	document.getElementById("undoBtn").disabled = true;
}

//Play a polyomino
function playPoly(p){
	var poly = new Poly([[0, 0]]);	
	tempPacket = {poly: poly, color: colors[num], len: p, placement: 1, improv: -1, num: num};
	count = tempPacket.len;
	resolving = 1;
	document.getElementById("tiles").innerHTML = 
			"Tiles placed: 0/" + tempPacket.len;
	document.getElementById("undoBtn").disabled = false;
}

function airdrop(){
	var poly = new Poly([[0, 0]]);	
	tempPacket = {poly: poly, color: colors[num], len: 1, placement: 0, improv: -1, num: num};
	count = tempPacket.len;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function artillery(){
	var poly = new Poly([[0, 0]]);	
	tempPacket = {poly: poly, color: "orange", len: 1, placement: 0, improv: 1, num: -1};
	count = tempPacket.len;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function force(){
	var poly = new Poly([[0, 0]]);	
	tempPacket = {poly: poly, color: "orange", len: 1, placement: 0, improv: 2, num: -1};
	count = tempPacket.len;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function obstruct(){
	var poly = new Poly([[0, 0]]);
	tempPacket = {poly: poly, color: "black", len: 1, placement: 0, improv: -1, num: 3};
	count = tempPacket.len;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function destroy(a, b, ran, piercing){	
	var poly = new Poly([[0, 0]]);
	tempPacket = {poly: poly, color: "white", len: 1, placement: 0, improv: piercing, num: 0};
	count = tempPacket.len;
	r = a;
	co = b;
	range = ran;
	resolving = 1;
	document.getElementById("tiles").innerHTML = 
			"Tiles placed: 0/" + tempPacket.len;
	document.getElementById("undoBtn").disabled = false;
}

function offensive(){
	var poly = new Poly([[0, 0]]);	
	tempPacket = {poly: poly, color: "purple", len: 1, placement: 0, improv: -1, num: 0};
	count = tempPacket.len;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function napalm(){
	var poly = new Poly([[0, 0]]);	
	tempPacket = {poly: poly, color: "white", len: 1, placement: 0, improv: 0, num: -1};
	count = tempPacket.len;
	r = 0;
	co = 0;
	range = 1000;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function smartpush(arr, item){
	if (!arr.includes(item)){
		arr.push(item);
	}
}

function addForcefield(a, b, dist, n){
	for (i = -1 * boardsize; i <= boardsize; i++){
		for (j = -1 * boardsize; j <= boardsize; j++){
			var distance = (Math.abs(a - i) +  Math.abs(b - j) + Math.abs((i + j) - (a + b))) / 2;
			if (distance <= dist){
				if (effects.hasOwnProperty([i, j])){					
					smartpush(effects[[i, j]], n);
				} else {
					effects[[i, j]] = [n];
				}
			}
		}
	}	 
}

//Reset variables for new turn
function reset(){
	lastAction = null;
	actions = 4;
	placements = 1;
	tempCard = null;
	tempPacket = null;	

	//Put all cards in playarea into discard pile
	var canvas = document.getElementById("playarea");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var animationTime = 200;

	requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
    	starttime = timestamp || new Date().getTime(); 
    	if (playarea.length == 0){
        	animationTime = 0;
        } 
        toDiscard(1, discard, playarea, timestamp, animationTime);
    });	
	

	
}

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

//Add actions
function addActions(n){
	actions += n;
}

//"Fast" gain, must pay 2 credits at the beginning of next turn (after decay happens first)
function fastGain(n){
	gain(n);
	debt += 1;
}

//Gain "coins"
function gain(n){
	budget += n;
}

function fundraiser(){
	gain(hand.length);
}

//Discard at end of turn
function selectedDiscard(t, num){
	//Can only discard after turn ends and with you have more than 7 cards in hand
	if (turn == 2 && hand.length > 5){
		if (num != -1){
			discardHand(num);
			sendStatus();
			showStatus();				
			num = -1;
			//Hand turn to next player if hand size is acceptable
			if (hand.length <= 5){					
				turn = 0;					
				socket.emit("upkeep", currentRoom);					 
			}
		} else {
			alert("Select a card first!");
		}
	} else if (turn == 2 && hand.length <= 5){
		//Hand turn to next player
		turn = 0;
		socket.emit("upkeep", currentRoom);
		 
	} 

	if (turn == 1) {
		//Discarding as an action
		if (num != -1 && num < hand.length){
			if (actions > 0){				
				discardHand(num);				
				actions -= 1;
				sendStatus();
				showStatus();
				
				num = -1;
				
			} else {
				alert("You don't have enough actions to discard a card!");
			}
			
		} else {
			alert("Select a card first!");
		}

	}
	
	var canvas = document.getElementById("hand_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function update(text){
	drawHand();
	sendStatus();
	showStatus();
	updateScroll(text);
}

//Discard a particular card from own hand 
function discardHand(ind){	
	var a = hand.splice(ind, 1);
	updateDiscard(a[0]);
	drawDiscard(a[0]);
	drawHand();
	sendStatus();
	showStatus();
	var text ="<strong> Player " + num + "</strong> discards <strong>" + a[0].name + "<strong>. <br>";
	updateScroll(text);
}

function targetDiscard(player){
	if (player == 1){
		socket.emit("targetDiscard", {room: currentRoom, ind: -1});
		//resolving = 1;
	}
}

//Draw cards
function draw(n, p){	
	if (turn == 1 || p == 0){
		for (i = 0; i < n; i++){
			if (deck.length == 0){	
				//Shuffle discard pile into deck
				if (discard.length > 0){
					deck = shuffle(discard);
					socket.emit("discard", {room: currentRoom, discard: discard}); //Tell opponent discard pile is empty
					//Redraw discard
					var canvas = document.getElementById("discard");
					var ctx = canvas.getContext("2d");
					ctx.fillStyle = "gray";
					ctx.fillRect(0, 0, 150, 200);
					ctx.font = "30px serif";
				  	ctx.strokeText("Discard pile is currently empty", 10, 50);
				} else {
					alert("Your discard pile is empty so you cannot draw a card!");
					actions += 1; //Give back the action expended
				}				
			}
			var card = deck.pop();
			hand.push(card);
			actions -= p;
			var canvas = document.getElementById("hand_overlay");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
		drawHand();
		drawDeck();
	}	
}

function creditAction(){
	if (actions > 0){
		gain(1);
		actions -= 1;		
	} else {
		alert("You are out of actions!");
	}
	sendStatus();
	showStatus();
	var text ="<strong> Player " + num + "</strong> uses an action to add <strong> 1 credit <strong> to his/her budget. <br>";
	updateScroll(text);
}

function drawAction(){
	if (actions > 0){
		draw(1, 1);		
	} else {
		alert("You are out of actions!");
	}
	sendStatus();
	showStatus();
	var text ="<strong> Player " + num + "</strong> uses an action to draw <strong> a card <strong>. <br>";
	updateScroll(text);
}

function addActions(n){
	actions += n;
}

function initialize_deck(){
	
	var canvas = document.getElementById("deck_display");
	canvas.addEventListener("mousedown", drawAction, false);

	canvas = document.getElementById("discard");
	canvas.addEventListener("mousedown", function(){
		seeDiscard('#discard_display', discard);
	}, false);

	canvas = document.getElementById("opp_discard");
	canvas.addEventListener("mousedown", function(){
		seeDiscard('#opp_discard_display', opp_discard);
	}, false);	
}

//Initialize event listeners for th field canvas
function initialize_field(){
	var canvas = document.getElementById("field_overlay");
	var coord = canvas.getBoundingClientRect();

	canvas.addEventListener("mousemove", function(event){
		var cursorX = event.clientX;
		var cursorY = event.clientY;
		drawShadow(cursorX - coord.left, cursorY - coord.top);
	}, false);

	canvas.addEventListener("mousedown", function(event){
		if (turn == 1){
			fieldActions();
		}
	}, false);
	
	window.addEventListener("keydown", function(event) {
		if (event.keyCode == 88){
			rotatePacket(event); drawShadow(cursorX - coord.left, cursorY - coord.top);
		}
	}, false);	
}

//Rotate selected packet (clockwise) and redraw
function rotatePacket(event){
	tempPacket.rotate();
}

//Put selected packet onto the field
function fieldActions(event){	
	var canvas = document.getElementById("field");
	var coord = canvas.getBoundingClientRect();
	var x = cursorX - coord.left;
	var y = cursorY - coord.top;

	var arr = pixtoHex(x, y);
	var a = arr[0];
	var b = arr[1];

	var permitted = 1;

	//If we're using an action card/poly card
	if (tempCard != null && resolving == 1){	
		if (placements - tempPacket.placement >= 0){		
			//Draw shape			
			var hex = new Hex(a, b, hexLength / 2);
			var pcanvas = document.getElementById("field_placement");
			var ctx = pcanvas.getContext("2d");
			
			if (count > 0){						
				var colliding = tempPacket.poly.collide(a, b, 3 - num, field);
				var adjacent = tempPacket.poly.adjacent(a, b, num, field);
				var collidingBlocks = tempPacket.poly.collide(a, b, -10, field);
				var touchingEdge = tempPacket.poly.touchingEdge(a, b);

				if (count < tempPacket.len){
					adjacent = tempPacket.poly.adjacent(a, b, num, tempfield);
					collidingBlocks = tempPacket.poly.collide(a, b, -10, tempfield);
					colliding = tempPacket.poly.collide(a, b, 3 - num, tempfield);
					touchingEdge = false; //We don't care about this after first tile
				}
				
				if (((!colliding && (adjacent || touchingEdge)) || 
					(tempPacket.color == "black" && !collidingBlocks)) && 
					tempPacket.color != "orange"){

					hex.draw(centerX, centerY, tempPacket.color, 3, 1.0, ctx);
					tempfield[[a, b]].num = tempPacket.num;
					tempShape.push([a, b]);
					count -= 1;						
					
				} else if (tempPacket.color == "orange" && field.hasOwnProperty([a, b]) && field[[a, b]].addOn == 0
					&& tempPacket.poly.collideWith(a, b, num, field)){
					//Each tile you control can only have one improvement of each type	
					tempShape.push([a, b]);
					count -= 1;	
				}	

				//Destruction tiles can be placed anywhere within range
				if (tempPacket.color == "white" && dist(r, co, a, b) <= range){				
					//Place packet with value 0 (essentially resetting the tile it was placed on)
					if (field.hasOwnProperty([a, b])){
						hex.draw(centerX, centerY, "green", 3, 1.0, ctx);
						tempfield[[a, b]].num = tempPacket.num;
						tempShape.push([a, b]);
						count -= 1;	
						if (tempPacket.num != -1){ //If not napalm
							permitted = 0;
						}
						
					}												
				}


				//Tactical offensive
				if (tempPacket.color == "purple"){									
					if (tempPacket.poly.adjacent(a, b, num, field)){	
						hex.draw(centerX, centerY, "green", 3, 1.0, ctx);
						tempfield[[a, b]].num = tempPacket.num;
						tempShape.push([a, b]);
						count -= 1;		
						permitted = 0;
					 } else {
					 	alert("You must target a tile adjacent to a tile of your colour!")
					 }						
				}

				document.getElementById("tiles").innerHTML = 
				"Tiles placed: " + (tempPacket.len - count) + "/" + tempPacket.len;

				if (count == 0){
					if (permitted){
						var poly = new Poly(tempShape);
						poly.place(0, 0, tempPacket.num);
						poly.placeImp(0, 0, tempPacket.improv);
						socket.emit("placement", {room: currentRoom, xcoord: 0, ycoord: 0, sh: tempShape, num: tempPacket.num, imp: tempPacket.improv});
						
						//Reset tempfield
						for (var key in tempfield) {
						    // check if the property/key is defined in the object itself, not in parent
						    if (tempfield.hasOwnProperty(key)) {           
						        tempfield[key].num = 0; 	      
						    }
						}
					} else {
						socket.emit("destroy", {room: currentRoom, xcoord: 0, ycoord: 0, sh: tempShape, num: tempPacket.num, imp: tempPacket.improv});
						$('#screen').fadeIn(100);
						$( '#screen' ).css( 'pointer-events', 'all' );
					}
					
					//Update stuff upon successful field placement
					drawHand();

					var text;					
					text ="<strong> Player " + num + "</strong> plays <strong>" + tempCard.name +  "<strong>. <br>";					
					updateScroll(text);
					
					placements -= tempPacket.placement;
					budget -= tempCard.cost;
					actions -= tempCard.ac;
					//updateDiscard(tempCard);
					resolving = 0;
					tempCard = null;
					tempPacket = null;	
					tempShape = [];
					document.getElementById("undoBtn").disabled = true;

					var canvas = document.getElementById("field_placement");
					var ctx = canvas.getContext("2d");
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					//Check if end of game is triggered
					var end = checkEnd();
					if (end != -1){
						disableButtons();
						alert("Player " + end + " has achieved victory!");
					}
				}
			} 
			var canvas = document.getElementById("hand_overlay");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			sendStatus();
			showStatus();				
			
		} else {
			alert("You have used up all your placements for the turn!");
			var canvas = document.getElementById("field_overlay");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
	} else {
		//This is when using improvements already on the field
		if (resolving == 1){
			

			if (tempPacket.color == "white" && dist(r, co, a, b) <= range){
				

				//Send message to server containing coordinates and packet shape
				socket.emit("destroy", {room: currentRoom, xcoord: 0, ycoord: 0, sh: [[a, b]], num: 0, imp: 0});	
				$('#screen').fadeIn(100);
				$( '#screen' ).css( 'pointer-events', 'all' );

				var text;					
				text ="<strong> Player " + num + "</strong> activates an <strong> Artillery Token <strong>. <br>";					
				updateScroll(text);	

				var canvas = document.getElementById("field_placement");
				var ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				budget -= 1;
				actions -= 1;
				resolving = 0;
				tempPacket = null;
				document.getElementById("undoBtn").disabled = true;
			}
		} else {
			if (field.hasOwnProperty([a, b])){
				//Artillery
				if (field[[a, b]].addOn == 1 && field[[a, b]].num == num){
					if (actions > 0 && budget > 0){
						destroy(a, b, 3, 0);	//Nerfed to 3 range from 4				
					} else if (actions == 0){
						alert("You do not have enough actions to fire an artillery!");
					} else if (budget <= 0){
						alert("You do not have enough credits to fire an artillery!");
					}
				} 				
			}
		}		
		sendStatus();
		showStatus();
	}	
}

//Draw a shadow of the packet onto the field
function drawShadow(x, y){	
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//display axial coord	
	var arr = pixtoHex(x, y);
	var a = arr[0];
	var b = arr[1];

	if (tempPacket != null){		
		//Draw shape
		var colliding = tempPacket.poly.collide(a, b, 3 - num, field);
		//This doesn't check collision with forcefields
		var collidingBlocks = tempPacket.poly.collide(a, b, -10, field);
		var adjacent = tempPacket.poly.adjacent(a, b, num, field);
		var touchingEdge = tempPacket.poly.touchingEdge(a, b);
		var color = tempPacket.color;

		//If not the first tile placed then check adjacency and collision on tempfield instead
		if (count < tempPacket.len){
			adjacent = tempPacket.poly.adjacent(a, b, num, tempfield);
			collidingBlocks = tempPacket.poly.collide(a, b, -10, tempfield);
			colliding = tempPacket.poly.collide(a, b, 3 - num, tempfield);
			touchingEdge = false; //We don't care about this after first tile
		}
		//If shape is obstruction then only need to check collisions (with blocks and not forcefields)
		if (color == "black" && collidingBlocks){
			color = "red";
		} else if (color != "black" && (colliding || 
			!(adjacent || touchingEdge) )) {
			//Otherwise it's a player's piece so also need to check collision with forcefields and adjacency
			color = "red";
		} 
		//Bomb
		if (tempPacket.color == "white"){
			//check range
			if (dist(r, co, a, b) <= range){
				color = "#00FF00"; //green
			} else {
				color = "red";
			}
		}
		//Add-on
		if (tempPacket.color == "orange"){
			//Must collide with itself (Equiv to being on an own tile)
			if (field.hasOwnProperty([a, b]) && field[[a, b]].addOn == 0 && tempPacket.poly.collideWith(a, b, num, field)){
				color = "green";				
			} else {
				color = "red";
			}
		}
		//Offensive
		if (tempPacket.color == "purple"){
			//Must collide with itself (Equiv to being on an own tile)
			if (adjacent){
				color = "green";				
			} else {
				color = "red";
			}
		}
		if (resolving == 1){
			tempPacket.poly.drawShape(ctx, a, b, color, 0.5);
			if (tempPacket.color == "white" || tempPacket.color == "purple" || tempPacket.color == "orange"){
				socket.emit("shadow", {room: currentRoom, xcoord: a, ycoord: b, sh: tempPacket.poly.shape, color: color});
			}
		}
	} 	
}

//Initialize event listeners for the hand canvas
function initialize_hand(){
	var canvas = document.getElementById("hand_overlay");
	var sel = new Selection(event, canvas);

	//Disable menu that pops up on right-click
	canvas.oncontextmenu = function() {
     	return false;  
	} 
	canvas.addEventListener("mousemove", 
		function(event){
			showCard(event, hand);
		}
	, false);
	//Left click to select/play card, right click to discard card
	canvas.addEventListener("mousedown", 
		function(event){
			//Get card selected
			var number = sel.index();
			if (event.button == 0){		
				if (turn == 1){		
					number = sel.draw(1, hand.length);
					selectCard(hand, number, 0);	
				} 	
			} else if (event.button == 2){	
				number = sel.index();
				selectedDiscard(turn - 1, number);
			}
		}
	, false);
}

function initialize_second_hand(arr){
	var canvas = document.getElementById("second_hand_overlay");
	var sel = new Selection(event, canvas);
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	canvas.style.pointerEvents = "all";

	document.getElementById('doneBtn').style.visibility = 'visible';

	for (i = 0; i < arr.length; i++){
		var n = arr[i];
		ctx.shadowBlur = 20;
		ctx.shadowColor = "rgb(0, 0, 255)";
		ctx.strokeStyle = "rgb(0, 0, 255)";
		ctx.lineWidth = 8;
		ctx.strokeRect(n * cardWidth, 0, cardWidth, cardHeight);
	}

	//Disable menu that pops up on right-click
	canvas.oncontextmenu = function() {
     	return false;  
	} 

	//Left click to trigger card
	canvas.addEventListener("mousedown", 
		function(event){
			var number = sel.index();
			if (event.button == 0){						
				if (arr.includes(number)){ //Triggerable card
					var card = hand[number];
					card.trigger(number);

					

					removeListeners();

					canvas = document.getElementById("field_placement");
					ctx = canvas.getContext("2d");
					ctx.clearRect(0, 0, canvas.width, canvas.height);

					drawHand();

					document.getElementById('doneBtn').style.visibility = 'hidden';

					//Clear event listeners
					$("#doneBtn").unbind("click");
				}						
			}
		}		
	, false);
}

function removeListeners(){
	var canvas = document.getElementById("second_hand_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	canvas.style.pointerEvents = "none";
	var new_element = canvas.cloneNode(true);
	canvas.parentNode.replaceChild(new_element, canvas);
	new_element.style.pointerEvents = "none;"
}

function selectCard(arr, number, p){
	if (number != -1 && number < arr.length){
		//If player has enough resources
		var card = arr[number];
		var cost = card.cost;
		if (budget >= cost && actions >= card.ac){
			drawHand();
			//Finished resolving or if it's picking a polyomino
			if (resolving == 0 || p == 1){
				if (card.ind == cards.length - 1){
					//Can't play trojan horse card
					alert("You cannot play this card!");
				} else {
					execute(arr, number, p);
				}
			} else {
				alert("Please finish resolving your current card!");
			}
		} else if (actions < card.ac){
			alert("You do not have enough actions to play this card!");
		} else if (budget < cost){
			alert("You do not have enough credits to play this card!");
		} 
	}
}


//Display the card the mouse is hovering over
function showCard(event, arr){
	var canvas = document.getElementById("card_display");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var hand = document.getElementById("hand");
	 var rect = hand.getBoundingClientRect();
	var x = event.pageX - rect.left;
	var y = event.pageY - rect.top;
	var w = Math.min(cardWidth * 6 / arr.length, cardWidth);
	var index = Math.floor(x / w);
	if (index < arr.length){
		arr[index].drawImg(ctx, 0, 0, canvas.width, canvas.height);
	}
}

function execute(arr, number, poly){
	//Clear tempPacket first
	tempPacket = null;
	var temp;
	obj = arr[number];
	
	temp = arr.splice(number, 1)[0];				
	
	//If card is ok to resolve
	if (obj.resolve(1) == 1){

		var oldX = $("#hand").offset().left + (number * cardWidth);
		var oldY = $("#hand").offset().top;
		var newX = $("#playarea").offset().left;
		var newY = playarea.length * 50 + $("#playarea").offset().top;
		//Animation of card flying to play area
		requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
	    	starttime = timestamp || new Date().getTime(); 
	        var f = cardAnim(updatePlay, [obj]); //Draw animation over 1 sec
	        f(obj, oldX, oldY, newX, newY, timestamp, 200);
	    });

		//When card is finished resolving
		if (resolving == 0){			
			//Update transcript
			var text ="<strong> Player " + num + "</strong> plays <strong>" + obj.name + "<strong>. <br>";
			updateScroll(text);
			
			//Trash instead of discard if the card is Trojan
			if (obj.name !== "Trojan"){

				//updateDiscard(obj);
				//drawDiscard(discard[discard.length - 1]);
			} else {
				var text ="<strong> Player " + num + "</strong> trashes <strong> Trojan <strong>. <br>";
				updateScroll(text);
			}
			showStatus();
			sendStatus();			
		} else {			
			tempCard = obj;
		}
		//Redraw Hand
		drawHand();		
	} else {
		//Put temp card back in hand
		hand.push(temp);
	}
		
	//Redraw canvasses
	var canvas = document.getElementById("hand_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawHand();
}

//Draw discard pile
function drawDiscard(obj){
	var canvas = document.getElementById("discard");
	var ctx = canvas.getContext("2d");
	obj.drawImg(ctx, 0, 0, cardWidth, cardHeight);
}

//Draw deck (has a number on it indicating number of cards left)
function drawDeck(){
	var canvas = document.getElementById("deck_display");
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "brown";
	ctx.fillRect(0, 0, cardWidth, cardHeight);
	ctx.font = "48px serif";
  	ctx.strokeText(deck.length, 10, 50);
	sendStatus();		
}

//Converts (x, y) in pixels to (a, b) in axial coordinates
function pixtoHex(x, y){
	var h = new Hex(0, 0, hexLength);
	//Get rid of offset
	var blockDist = h.blockDist;
	var size = h.size;
	var trueX = x - centerX;
	var trueY = (y - centerY);
	//First do an affine transformation to line up edges of hex with rectangles
	/* for x, (blockDist / 2, size / 2) -> (1, 0)
				(0, -size) -> (0, 1)
				i.e. (1, 0) -> (2 / blockDist, 1 / blockDist)
				(0, 1) -> (0, -1 / size)
		for y, (-blockdist / 2, size / 2) -> (1, 0)
				(blockdist / 2, size / 2) -> (0, 1)
				i.e. (1, 0) -> (-1 / blockDist, 1 / blockDist)
				(0, 1) -> (1 / size, 1 / size)
		See: http://playtechs.blogspot.ca/2007/04/hex-grids.html
			*/

	//Multiply points by the transformation matrices
	var x1 = Math.floor(trueX * 2.0 / blockDist);
	var y1 = Math.floor((trueX / blockDist) + (-1.0 * trueY / size));
	var a = Math.floor((x1 + y1 + 2) / 3.0);

	var x2 = Math.floor((trueX * -1.0 / blockDist) + (trueY / size));
	var y2 = Math.floor((trueX / blockDist) + (trueY / size));
	var b = Math.floor((x2 + y2 + 2) / 3.0);
	return [a, b];
}

//Draw field
function drawField(){
	var c = document.getElementById("field");
	var ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);
	effects = {};
	//Draw hex grid
	for (var key in field) {
	    // check if the property/key is defined in the object itself, not in parent
	    if (field.hasOwnProperty(key)) {           
	        var h = field[key];
	        var color = colors[h.num]; //Get right color
			var x = h.a;
    		var y = h.b;
    		var z = -1 * (x + y);
    		h.draw(centerX, centerY, color, 3, 1.0, ctx); 
    		//Draw center
    		if (Math.abs(x) + Math.abs(y) + Math.abs(z) <= 4){
    			//Line width of 3 to indicate the control zone
    			h.drawThick(centerX, centerY, ctx);
    		} 
    		//Draw over center hexes
    		if (h.num != 0){
				h.draw(centerX, centerY, color, 3, 1.0, ctx); 
			}

			//Addons
			var tile = h.addOn;
    		x = h.getX(centerX, centerY);
    		y = h.getY(centerX, centerY);
    		if (tile != 0){
    			var letters = ['A', 'F', 'C', 'P']; //Different letters for different improvements
				//Draw a circle for the artillery
		        var radius = blockLength / 4;
		        ctx.beginPath();
		        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		        ctx.fillStyle = colors[h.num];
		        if (h.num == 3){
		        	ctx.fillStyle = "white";
		        }
		        ctx.fill();
		        ctx.lineWidth = 2;
		        ctx.strokeStyle = '#003300';
		        ctx.stroke();
		        ctx.fillStyle = "black";
		        
		        ctx.font = 'bold 18px arial';
  				ctx.fillText(letters[tile - 1], x - 6, y + 7);
  				if (tile == 2 && (h.num == 1 || h.num == 2)){
  					//Draw forcefield
  					addForcefield(h.a, h.b, 2, h.num);
  				}
 			} 
	    }
	}

	//Draw forcefield markers
	for (var key in effects) {
		key = key.split(",");
		if (effects.hasOwnProperty(key) && field.hasOwnProperty(key)){ 	 				
			var hex = new Hex(parseInt(key[0]), parseInt(key[1]), hexLength - 5);
			var c = [];
			for (i = 0; i < effects[key].length; i++){
				c.push(colors[effects[key][i]]);
			}
			hex.drawEffects(centerX, centerY, ctx, c);
		}    
	}


}

function drawHand(){
	var canvas = document.getElementById("hand");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (index = 0; index < hand.length; index++){
		var posX = Math.min((500 / hand.length) * index, cardWidth * index);		
		hand[index].drawImg(ctx, posX, 0, cardWidth, cardHeight);	    
	}
}

//Send public info to opponent
function sendStatus(){
	socket.emit("status", {room: currentRoom, actions: actions, placements: placements, budget: budget, handsize: hand.length, decksize: deck.length});
}

function sendText(text){
	var element = document.getElementById("chat");
	text = "<strong> Player " + num + ":</strong> " + text + "<br>";
	element.innerHTML += text;

	socket.emit("msg", {room: currentRoom, msg: text});
}

//Update opponent's status
socket.on("status", function(data){
	if (turn == 0){
		document.getElementById("display").innerHTML = 
		"Opponent's turn: <br>" + 
		"Actions left: " + data.actions + "<br>" + 
		"Placements left: " + data.placements + "<br>" + 
		"Credits: " + data.budget + "<br>";
	}

	//Draw opp hand
	var canvas = document.getElementById("opp_hand");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var image = images[images.length - 1]; //Hand image is the last one
	if (image.complete){
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	}
	//Draw text indicating num cards in opp hand
	ctx.beginPath();
	ctx.arc(40, 40, 20, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#003300';
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = 'bold 25px arial';
	ctx.fillText(data.handsize, 35, 50);

	//Draw opp deck
  	canvas = document.getElementById("opp_deck");
	ctx = canvas.getContext("2d");
	ctx.fillStyle = "brown";
	ctx.fillRect(0, 0, cardWidth, cardHeight);
	ctx.font = "48px serif";
  	ctx.strokeText(data.decksize, 10, 50);
});

socket.on("improvement", function(data){
	var packet = new Poly(data.sh);
	packet.placeImp(data.xcoord, data.ycoord, parseInt(data.n));
});

//Functions upon receiving messages from server
socket.on("placement", function(data){
	var canvas = document.getElementById("field_placement");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	canvas = document.getElementById("field_overlay");
	ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var packet = new Poly(data.sh);
	packet.place(0, 0, data.num);
	packet.placeImp(0, 0, data.imp);
	
	//Reset blackout screen
	$('#screen').fadeOut(100);
	$( '#screen' ).css( 'pointer-events', 'none' );
	
	//Reset improvements on the tile	
	//drawField();
});

socket.on("destroy", function(data){	
	var packet = new Poly(data.sh);
	//Draw a hex first
	var canvas = document.getElementById("field_placement");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (i = 0; i < data.sh.length; i++){
		var hex = new Hex(data.xcoord + data.sh[i][0], data.ycoord + data.sh[i][1], hexLength - 3);
		hex.drawEffects(centerX, centerY, ctx, ["red"]);
	}	

	var triggercount = 0;
	var triggers = []; //Cards that can be triggered

	for (var i = 0; i < hand.length; i++){
		if (hand[i] instanceof TriggerCard){
			if (hand[i].triggerword === "Destroy"){
				turn = 0.5; //Time to play trigger cards
				triggercount += 1;
				triggers.push(i);
			}
		}
	}

	if (triggers.length > 0){
		var element = document.getElementById("chat");
		text = "You may trigger a card in your hand! <br>";
		element.innerHTML += text;
	}

	//If no trigger cards send back to other player
	if (triggercount == 0){
		
		packet.place(0, 0, data.num);
		packet.placeImp(0, 0, data.imp);
	
		socket.emit("placement", {room: currentRoom, xcoord: 0, ycoord: 0, sh: data.sh, num: data.num, imp: data.imp});
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		canvas = document.getElementById("field_overlay");
		ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

	} else {
		initialize_second_hand(triggers);
		$( "#doneBtn" ).bind("click", function(event) {
			packet.place(0, 0, data.num);
			packet.placeImp(0, 0, data.imp);
			console.log(packet);
	
			socket.emit("placement", {room: currentRoom, xcoord: 0, ycoord: 0, sh: data.sh, num: data.num, imp: data.imp});
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			canvas = document.getElementById("field_overlay");
			ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			document.getElementById('doneBtn').style.visibility = 'hidden';

			removeListeners();
			//Remove this function from the button
			$( this ).unbind( event );
		});
		
	}
	

});

socket.on("shadow", function(data){
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var packet = new Poly(data.sh);
	packet.drawShape(ctx, data.xcoord, data.ycoord, data.color, 0.5);
});

//Add a trojan horse card into the deck
socket.on("trojan", function(){
	deck.push(cards[cards.length - 1]);
	deck = shuffle(deck);
	drawDeck();
});

//Write to transcript
socket.on("event", function(data){
	var element = document.getElementById("transcript");
	element.innerHTML += data;
    element.scrollTop = element.scrollHeight;
});

//Open up dialog box to choose to discard
socket.on("hand", function(data){	
	function discard(selection, arr){
		var number = selection[0];
		if (number != -1 && number < arr.length){
			socket.emit("targetDiscard", {room: currentRoom, ind: number});
		}		
	}
	var arr = [];
	for (i = 0; i < data.hand.length; i++){
		arr.push(cards[data.hand[i].ind]);
	}
	var newthing = new Box("#dialog", 1, arr, num, "Choose a card from your opponent's hand to discard", discard, 1);
	//actions -= 1;
	//budget -= 2;
	sendStatus();
	showStatus();
	resolving = 0;	
});

socket.on("targetDiscard", function(data){
	//Opp is discarding from our hand so need to send hand info
	if (data.ind == -1){
		socket.emit("hand", {room: currentRoom, hand: hand});
	} else {
		//Opp told us which card to discard, so discard it
		var obj = hand.splice(data.ind, 1)[0];
		updateDiscard(obj);
		drawHand();
		drawDiscard(obj);
		sendStatus();
		showStatus();
		var text = "<strong> " + obj.name + "</strong> in <strong> Player " + (num) + "</strong>'s hand has been discarded by <strong> Player " + (3 - num) + "</strong>. <br>";
		update(text);
    }
});

socket.on("market", function(data){
	market = data;
	drawMarket();
});

socket.on("quantity", function(data){
	quantity[data] -= 1;
	drawMarket();
});

socket.on("msg", function(data){
	var element = document.getElementById("chat");
	element.innerHTML += data;
    //element.scrollTop = element.scrollHeight;
});

socket.on("play", function(data){
	var oldX = $("#opp_hand").offset().left;
	var oldY = $("#opp_hand").offset().top;
	var newX = $("#playarea").offset().left;
	var newY = (data.length - 1) * 50 + $("#playarea").offset().top;
	requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
    	starttime = timestamp || new Date().getTime(); 
        var f = cardAnim(drawPlay, [data]); 
	     f(cards[data[data.length - 1].ind], oldX, oldY, newX, newY, timestamp, 200);

    });
});

socket.on("toDiscard", function(data){
	var canvas = document.getElementById("playarea");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var arr = [];
	for (i = 0; i < data.length; i++){
		arr.push(cards[data[i].ind]);
	}
	requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
    	starttime = timestamp || new Date().getTime(); 
        toDiscard(0, opp_discard, arr, timestamp, 200);
    });
});

socket.on("discard", function(data){
	opp_discard = data;
	var canvas = document.getElementById("opp_discard");
	var ctx = canvas.getContext("2d");
	if (data.length > 0){
		cards[data[data.length - 1].ind].drawImg(ctx, 0, 0, cardWidth, cardHeight);
	} else {
		//Reset opp_discard
	  	ctx.fillStyle = "gray";
		ctx.fillRect(0, 0, cardWidth, cardHeight);
		ctx.font = "30px serif";
	  	ctx.strokeText("Opponent's", 10, 50);
	  	ctx.strokeText("discard", 10, 100);
	}
});

function updateDiscard(obj){
	discard.push(obj);
	socket.emit("discard", {room: currentRoom, discard: discard});
	drawDiscard(discard[discard.length - 1]);
}

function updatePlay(obj){
	playarea.push(obj);
	socket.emit("play", {room: currentRoom, play: playarea});
	drawPlay(playarea);
}

function updateScroll(text){
    var element = document.getElementById("transcript");
	element.innerHTML += text;
    element.scrollTop = element.scrollHeight;
    socket.emit("event", {room: currentRoom, text: text});
}

function drawPlay(arr){
	var canvas = document.getElementById("playarea");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (i = 0; i < arr.length; i++){
		cards[arr[i].ind].drawImg(ctx, 0, i * 50, cardWidth, cardHeight);	
	}
}

function drawMarket(){
	var canvas = document.getElementById("staples");
	var ctx = canvas.getContext("2d");
	//Draw staples
	for (i = 0; i < staples.length; i++){
		var row = Math.floor(i / 4);
		var col = i % 4;
		if (quantity[i] > 0){
			cards[staples[i]].drawImg(ctx, col * cardWidth, row * cardHeight, cardWidth, cardHeight);
			//Draw number of copies
			ctx.beginPath();
			ctx.arc(col * cardWidth + 20, row * cardHeight + 30, 15, 0, 2 * Math.PI, false);
	        ctx.fillStyle = 'white';
	        ctx.fill();
	        ctx.lineWidth = 2;
	        ctx.strokeStyle = '#003300';
	        ctx.stroke();
	        ctx.fillStyle = 'black';
	        ctx.font = 'bold 20px arial';
			ctx.fillText(quantity[i], col * cardWidth + 8, row * cardHeight + 40);
		}
	}
	
	//Draw other cards from a shuffled market pile
	canvas = document.getElementById("random");
	ctx = canvas.getContext("2d");
	for (i = 0; i < 8; i++){
		var row = Math.floor(i / 4);
		var col = i % 4;
		cards[market[i]].drawImg(ctx, col * cardWidth, row * cardHeight, cardWidth, cardHeight);
	}
}
//]]>