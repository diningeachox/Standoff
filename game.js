//<![CDATA[

/** Actual game logic */
var colors = ["#17dc2f", "yellow", "blue", "black", "#FF69B4"];
var addOnText = ["", "A", "A"];

var games = [];
/* All game variables (that need to be saved) */
var c;
var c2;
var num;
//Turn marker
var turn;
//Debt
var debt = 0;
//Trojan Horses giving free resources
var horses = 0;
//Extra turn
var extra = 0;

//row, col, and range
var r, co, range;

var tempPacket; //packet in midst of resolution
var tempColor;
var tempCard; //Card in midst of resolution

var tempObj; //Add-on in construction

//Keep track of mouse position
var cursorX;
var cursorY;

//Game variables
var market = [];
var hand = [];
var deck = [];
var discard = [];
var opp_discard = [];
var field = [];
var addOns = [];
var effects = [];
var coord;
var oppHand = [];

//Actions
var actions = 4;
var placements = 1;
var budget = new Vector(0, 0);

//Flags
var resolving = 0;
//Next action is free
var free = 0;
var isPoly = 0;

//Improvements
var improv = 0;

//Follow the mouse
document.onmousemove = function(e){
    cursorX = e.pageX;
    cursorY = e.pageY;
}

function enableButtons(){
	document.getElementById("gainBtn").disabled = false;
	document.getElementById("endTurnBtn").disabled = false;
	//document.getElementById("discardBtn").disabled = false;
	document.getElementById("mineBtn").disabled = false;
}

function disableButtons(){
	document.getElementById("gainBtn").disabled = true;
	document.getElementById("endTurnBtn").disabled = true;
	//document.getElementById("discardBtn").disabled = true;
	document.getElementById("mineBtn").disabled = true;
}

//Begin a turn (this is the upkeep phase)
socket.on("upkeep", function(){

	//Then debt is paid and all debt is cleared	
	budget = budget.subtract(new Vector(2 * debt, 0));
	debt = 0;
	sendStatus();
	showStatus();

	//No extra turns
	extra = 0;
	turn = 1;
	enableButtons();
	
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
	sendStatus();
	showStatus(); 
	drawHand();
	drawField(); 
	drawDeck();

	drawPiles();
	
	//Initialize the event listeners
	initialize_hand(); 
	initialize_field();
	initialize_deck();	
	initialize_market();

	

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
}





//Checks if the field contains a player's tiles
function contains(arr, num){
	for (i = 0; i < length; i++) {
		for (j = 0; j < width; j++) {
			if (field[(i + 3) * (length + 6) + (j + 3)] == num){
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
					if (budget.subtract(cost).affordable() && actions > 0){
						updateDiscard(cards[(market.splice(number, 1)[0])]);
						drawMarket();
						socket.emit("market", {room: currentRoom, market: market});
						drawDiscard(discard[discard.length - 1]);
						actions -= 1;
						budget = budget.subtract(cost);
						showStatus();
						sendStatus();
						var text ="<strong> Player " + num + "</strong> buys <strong>" + card.name + "<strong>. <br>";
						updateScroll(text);
					} else if (!budget.subtract(cost.project(0)).affordable()) {
						alert("You do not have enough credits to buy this card!");
					} else if (!budget.subtract(cost.project(1)).affordable()) {
						alert("You do not have enough minerals to buy this card!");
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
					if (budget.subtract(cost).affordable() && actions > 0){
						updateDiscard(cards[staples[number]]);	
						quantity[number] -= 1; //Subtract 1 from the staple pile
						drawMarket();
						socket.emit("market", {room: currentRoom, market: market});
						socket.emit("quantity", {room: currentRoom, number: number});
						drawDiscard(discard[discard.length - 1]);
						budget = budget.subtract(cost);
						actions -= 1;
						showStatus();
						sendStatus();
						var text ="<strong> Player " + num + "</strong> buys <strong>" + card.name + "<strong>. <br>";
						updateScroll(text);
					} else if (!budget.subtract(cost.project(0)).affordable()) {
						alert("You do not have enough credits to buy this card!");
					} else if (!budget.subtract(cost.project(1)).affordable()) {
						alert("You do not have enough minerals to buy this card!");
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
	//Locations of mineral patches
	var patches = [[1, 1], [0, 2], [2, 0],
					[length - 2, length - 2], [length - 1, length - 3], [length - 3, length - 1],
					[length - 2, 1], [length - 1, 2], [length - 3, 0],
					[1, length - 2], [0, length - 3], [2, length - 1]];

	//Array for field
	//Fill the edges
	for (i = 0; i < (length + 6) * (width + 6); i++) {
	    field.push(num);
	    effects.push(new Array());
	}

	//Empty values for the field
	for (i = 0; i < length; i++) {
		for (j = 0; j < width; j++) {
	    	field[(i + 3) * (length + 6) + (j + 3)] = 0;
		}
	}

	//Init add ons and effects
	for (i = 0; i < length * width; i++) {
	    addOns.push(0);	    
	}

	//Add values for patches
	for (i = 0; i < patches.length; i++){
		effects[(patches[i][0] + 3) * (length + 6) + (patches[i][1] + 3)].push(4);
	}
	effects[3 * (length + 6) + 3].push(5);
	effects[3 * (length + 6) + (length + 2)].push(5);
	effects[(length + 2) * (length + 6) + 3].push(5);
	effects[(length + 2) * (length + 6) + (length + 2)].push(5);

	//Obstacles at the start of the game
	var pivot = length / 2 - 1;
	for (i = 0; i < 4; i++){
		//top 
		field[6 * (length + 6) + pivot + 2 + i] = 3;
		//left
		field[(pivot + 2 + i) * (length + 6) + 6] = 3;
		//bottom
		field[(length - 1) * (length + 6) + pivot + 2 + i] = 3;
		//right
		field[(pivot + 2 + i) * (length + 6) + (length - 1)] = 3;
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
	var pivot = length / 2 - 1;
	for (i = 0; i < length; i++){
		for (j = 0; j < width; j++){			
			//Add up tiles in the central rectangle
			if (i >= pivot && i < pivot + 2 && j >= pivot - 1 && j < pivot + 3){
				if (field[(i + 3)* (width + 6) + j + 3] == 0){
					return -1;
				}
				p1 += values[field[(i + 3) * (width + 6) + j + 3]];
				p2 += values[3 - field[(i + 3) * (width + 6) + j + 3]];
			}
			if (
				(i == pivot - 1 && j == pivot) || (i == pivot - 1 && j == pivot + 1) ||
				(i == pivot + 2 && j == pivot) || (i == pivot + 2 && j == pivot + 1)
				){
				if (field[(i + 3)* (width + 6) + j + 3] == 0){
					return -1;
				}
				p1 += values[field[(i + 3) * (width + 6) + j + 3]];
				p2 += values[3 - field[(i + 3) * (width + 6) + j + 3]];
			}
			//Add up all the tiles
			p1_total += values[field[(i + 3) * (width + 6) + j + 3]];
			p2_total += values[3 - field[(i + 3) * (width + 6) + j + 3]]; 
		}
	}
	/*If tied in the central square, the one with the 
	least tiles on the entire field wins; if still tied
	the win goes to the second player */
	return (((p2 > p1) ? 1 : 0) + 1) - ((p2 == p1 && p2_total < p1_total) ? 1 : 0);
}

function showStatus(){
	document.getElementById("display").innerHTML = 
	"Actions left: " + actions + "<br>" + 
	"Placements left: " + placements + "<br>" + 
	"Credits: " + budget.credits + "<br>" + 
	"Minerals: " + budget.minerals + "<br>" + 
	"Debt to be paid next turn: " + (2 * debt);
}

//Measures taxicab distance between (a, b) and (c, d)
function dist(a, b, c, d){
	return Math.abs(a - c) + Math.abs(b - d);
}

function tutor(){
	//First create a canvas to display the cards in the deck
	resolving = 1;
	$( function() {
			var canvas = document.createElement("canvas");
			var overlay = document.createElement("canvas");
			var sel = new Selection(event, overlay);
			var number;
			$( "#deck" ).dialog({
			  dialogClass: "no-close",
			  modal: true,
			  width: 1100,
			  height: 350
			});
			$('#button_ok').button('disable');

			canvas.width = deck.length * 150;
			canvas.height = 200;
			canvas.style.left = "0px";
       	 	canvas.style.top = "0px";
        	canvas.style.position = "absolute";
			
			
			overlay.width = canvas.width;
			overlay.height = canvas.height;
			overlay.style.left = "0px";
       	 	overlay.style.top = "0px";
        	overlay.style.position = "absolute";

			var offset = $('#deck').offset();
			var card;
			$('#deck').append(canvas);
			$('#deck').append(overlay);
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			//draw the cards
			for (index = 0; index < deck.length; index++){
				cards[deck[index].ind].drawImg(ctx, index * 150, 0, 150, 200);

			}
			//Make sure the overlay canvas covers the decklist canvas			
			//add mouse listeners
			overlay.addEventListener("mousedown", 
				function(event){
					number = sel.draw(1, deck.length);
					console.log(number);
					
					if (number != -1 && number < deck.length){
						hand.push(deck[number]); //Add tutored card to hand
						drawHand();
						showStatus();
						sendStatus();
						$( '#deck' ).dialog( "close" );
					}
				}, 
			false);
	  } );
}

function disposal(){
	var newthing = new Box("#opp_hand", 3, hand, num);
	newthing.createBox("#opp_hand", 3, hand, "Choose up to 3 cards to trash", update);
	
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

function extraTurn(){
	extra = 1;
}

//Take back a current placement
function undo(){
	resolving = 0;
	tempColor = null;
	improv = 0;
	//Put card currently in resolution back to owner's hand
	if (tempCard != null){
		hand.push(tempCard);
	}
	drawHand();
	//clear field overlay
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	document.getElementById("undoBtn").disabled = true;

}

function createPacket(shape, placement){
	tempColor = c;
	tempPacket = new Packet(shape, placement);
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function force(){
	tempColor = "orange";
	tempPacket = new Packet("1", 0);
	improv = -1 * num;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function artillery(){
	tempColor = "orange";
	tempPacket = new Packet("1", 0);
	improv = num;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}


function obstruct(shape, placement){	
	tempColor = "black";
	tempPacket = new Packet(shape, placement);
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function destroy(shape, row, col, ran){	
	tempColor = "white";
	tempPacket = new Packet(shape, 0);
	r = row;
	co = col;
	range = ran;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function refinery(){	
	tempColor = "orange";
	tempPacket = new Packet('1', 0);
	improv = num + 2;
	resolving = 1;
	document.getElementById("undoBtn").disabled = false;
}

function mine(){
	if (actions > 0){
		budget = budget.add(new Vector(0, countRef()));
		actions -= 1;
		showStatus();
		sendStatus();
	} else {
		alert("You do not have enough actions to mine minerals!");
	}
}

function countRef(){
	var count = 0;
	for (i = 0; i < length; i++){
		for (j = 0; j < length; j++){
			var tile = addOns[i * length + j];
			if (tile == num + 2){
				//Big minerals
				if (effects[(i + 3) * (length + 6) + j + 3].includes(5)){
					count += 2;
				} else {
					count += 1;
				}
				
			}
		}
	}
	//console.log(count);
	return count;
}

function addForcefield(row, col, dist, n){
	effects[row * (width + 6) + col].push(n);
	if (dist > 0){
		//Add to surrounding tiles

		addForcefield(row + 1, col, dist - 1, n);
		addForcefield(row, col + 1, dist - 1, n);
		addForcefield(row - 1, col, dist - 1, n);
		addForcefield(row, col - 1, dist - 1, n);
	} 
}

function clearForcefield(row, col, dist, n){
	var index = effects[row * (width + 6) + col].indexOf(n);
	if (index != -1){
		effects[row * (width + 6) + col].splice(index, 1);
	}
	if (dist > 0){

		//Add to surrounding tiles
		clearForcefield(row + 1, col, dist - 1, n);
		clearForcefield(row, col + 1, dist - 1, n);
		clearForcefield(row - 1, col, dist - 1, n);
		clearForcefield(row, col - 1, dist - 1, n);
	} 
}

//Play a polyomino
function playPoly(p){
	var image_arr = [];
	var ok = 0;
	resolving = 1;
	//Create canvas for display
	
	//Make a modal dialog box with cards available
	$( function() {
		var canvas = document.getElementById("p");
		var overlay = document.getElementById("p_overlay");
		var sel = new Selection(event, overlay);
		var number;
		$( "#poly" ).dialog({
		  dialogClass: "no-close",
		  modal: true,
		  width: 1100,
		  height: 350
		});

		var w = 150;
		var offset = $('#poly').offset();
		var card;
		$('#poly').append(canvas);
		$('#poly').append(overlay);
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		//draw the cards

		for (index = 0; index < poly[p].length; index++){
			var posX = 1050 / 7 * index;
			
			poly[p][index].drawImg(ctx, posX, 0, 150, 200);
		}
		//add mouse listeners
		overlay.addEventListener("mousedown", 
			function(event){
				number = sel.draw(1, poly[p].length);
				console.log(number);
				selectCard(poly[p], number, 1);
				if (number != -1 && number < poly[p].length){
					$( '#poly' ).dialog( "close" );
				}
			}, 
		false);

  } );
	
	var canvas = document.getElementById("p_overlay");
	
}

//Reset variables for new turn
function reset(){
	free = 0;
	lastAction = null;

	actions = 4;
	placements = 1;	
	sendStatus();
	showStatus();
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//Disable buttons
	turn = 2; //Discard phase

	disableButtons();
	document.getElementById("discardBtn").disabled = false; //Keep discard avaiable
	if (hand.length <= 5){
		//Draw back up to 5
		draw(5 - hand.length, 0);
		//Hand turn to next player
		turn = 0;
		//Empty the credits but keep the minerals
		budget = budget.project(1);
		if (extra == 0){
			disableButtons();
			var text ="____________________";
			updateScroll(text);
			socket.emit("upkeep", currentRoom);
			
		} else {
			enableButtons();
			turn = 1;
		}	
	}
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
	budget = budget.add(new Vector(n, 0));
}

function fundraiser(){
	gain(hand.length);
}

//Discard at end of turn
function selectedDiscard(t, num){
	if (t == 1){
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
					if (extra == 0){
						socket.emit("upkeep", currentRoom);
						//Disable the discard button
						document.getElementById("discardBtn").disabled = true;
					} else {
						enableButtons();
						turn = 1;
					}	
				}
			} else {
				alert("Select a card first!");
			}
		} else if (hand.length <= 5){
			//Hand turn to next player
			turn = 0;
			if (extra == 0){
				socket.emit("upkeep", currentRoom);
				//Disable the discard button
				document.getElementById("discardBtn").disabled = true;
			} else {
				enableButtons();
				turn = 1;
			}	
		}
	} else {
		//Discarding as an action
		if (num != -1 && num < hand.length){
			if (actions > 0){
				//Can't discard horse
				if (num.ind != 33){
					discardHand(num);
				} else {
					alert("You cannot discard the Horse card as an action!");
				}
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
	}
}

//Random discard target toward a player
function randomDiscard(player){
	if (player == 0){
		var ind = Math.floor(hand.length * Math.random());
		discardHand(ind);
	} else {
		socket.emit("randomDiscard", currentRoom);
	}

}

function duplicate(){
	if (lastAction == null){
		free = 1;
	} else {
		//Copy last action
		leftbr = s.indexOf("(");
		rightbr = s.indexOf(")");
		func = s.substring(0, leftbr);
		args = s.substring(leftbr + 1, rightbr).split(", ");
		(window[func]).apply(this, args);
		//Reset current card
		selected[0] = -1;
		selected[1] = -1;
		//Redraw canvasses
		var canvas = document.getElementById("hand_overlay");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		var canvas = document.getElementById("p");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		var canvas = document.getElementById("p_overlay");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		showStatus();
		sendStatus();

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
			//Drawing a trojan horse
			if (card.ind == 33){
				socket.emit("horse", currentRoom);
				var text ="<strong> Player " + num + "</strong> has draw a <strong> Trojan Horse </strong>! <strong> Player " + (3 - num) + "</strong> gains 2 budget during his/her next upkeep. <br>";
				updateScroll(text);
			}
			actions -= p;
			var canvas = document.getElementById("hand_overlay");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
		drawHand();
		drawDeck();
	}
	
}

function transfer(){
	if (budget.minerals > 0){
		budget = budget.add(new Vector(1, -1));
	} else {
		alert("You don't have any minerals to transfer into credits!");
	}

	sendStatus();
	showStatus();
}

function drawAction(){
	if (actions > 0){
		draw(1, 1);
		
	} else {
		alert("You are out of actions!");
	}

	sendStatus();
	showStatus();
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
	coord = canvas.getBoundingClientRect();
	canvas.addEventListener("mousemove", function(event){drawShadow(cursorX - coord.left, cursorY - coord.top)}, false);
	canvas.addEventListener("mousedown", fieldActions, false);
	
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
	x = cursorX - coord.left;
	y = cursorY - coord.top;
	row = Math.floor(y / blockLength);
	
	col = Math.floor(x / blockLength);
	console.log(tempCard);
	console.log(tempPacket);
	//If we're using an action card/poly card
	if (tempCard != null && resolving == 1){	
		if (placements - tempPacket.placement >= 0){		
			//Draw shape
			
			var colliding = tempPacket.collide(row + 3, col + 3, 3 - num);
			var adjacent = tempPacket.adjacent(row + 3, col + 3, num);
			//If not a destruction tile
			if (!colliding && (adjacent || tempColor == "black") && tempColor != "orange"){
				var n = num;
				if (tempColor == "black"){
					n = 3;
				}
				//Draw and place packet
				tempPacket.place(row + 3, col + 3, n);
				drawField();

				//Send message to server containing coordinates and packet shape
				socket.emit("placement", {room: currentRoom, xcoord: col, ycoord: row, sh: tempPacket.getShape(), color: tempColor});

				//Remove card from hand

				//Redraw Hand
				drawHand();
				
				placements -= tempPacket.getPlacement();
				budget = budget.subtract(tempCard.cost);
				actions -= tempCard.ac;
				if (isPoly != 1){
					updateDiscard(tempCard);
				}
				isPoly = 0;
				resolving = 0;
				tempCard = null;
				
			} else if (tempColor == "orange" && addOns[row * (length) + col] == 0
				&& tempPacket.collideWith(row + 3, col + 3, num)){
				//Each tile you control can only have one improvement of each type	
				//Add improvement
				
				//If it's a forcefield also modify the tiles within a distance of 3
				if (improv == -1 * num){
					addForcefield(row + 3, col + 3, 2, num);
					socket.emit("addForcefield", {room: currentRoom, xcoord: col + 3, ycoord: row + 3, player: -1 * improv});
				} 

				//If it's a refinery it can only be placed on mineral tiles
				if ((improv == 2 + num && 
					(effects[(row + 3) * (length + 6) + (col + 3)].includes(4) || effects[(row + 3) * (length + 6) + (col + 3)].includes(5)))
					|| improv != 2 + num){
					
					addOns[row * (length) + col] = improv;
					socket.emit("addon", {room: currentRoom, xcoord: col, ycoord: row, type: improv});
					drawField();
					//Send message to server containing coordinates and packet shape					

					//Redraw Hand
					drawHand();		
					placements -= tempPacket.getPlacement();
					budget = budget.subtract(tempCard.cost);
					actions -= tempCard.ac;
					updateDiscard(tempCard);
					resolving = 0;
					tempCard = null;
				} 
			}	

			//destruction tiles can be placed anywhere within range
			if (tempColor == "white" && dist(r, co, row, col) <= range){
				
				//Can bomb any tile except those under a deflector shield
				//Place packet with value 0 (essentially resetting the tile it was placed on)

				//See if the square contains a forcefield generator
				var generator = addOns[row * width + col];
			
				tempPacket.place(row + 3, col + 3, 0);
				//Erase tile
				tempPacket.placeImp(row, col, 0);
				//Erase forcefield effects
			    if (generator < 0){
			    	clearForcefield(row + 3, col + 3, 2, -1 * generator);
			    	socket.emit("clearForcefield", {room: currentRoom, xcoord: col + 3, ycoord: row + 3, player: -1 * generator});
			    }
				
				drawField();

				//Send message to server containing coordinates and packet shape
				socket.emit("placement", {room: currentRoom, xcoord: col, ycoord: row, sh: tempPacket.getShape(), color: "white"});
				socket.emit("improvement", {room: currentRoom, xcoord: col, ycoord: row, sh: tempPacket.getShape(), n: "0"});
				//Redraw Hand
				drawHand();				

				placements -= tempPacket.getPlacement();
				budget = budget.subtract(tempCard.cost);
				actions -= tempCard.ac;
				updateDiscard(tempCard);
				resolving = 0;
				tempCard = null;				
			}

			var canvas = document.getElementById("hand_overlay");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			sendStatus();
			showStatus();
			
			//Check if end of game is triggered
			var end = checkEnd();
			if (end != -1){
				disableButtons();
				alert("Player " + end + " has achieved victory!");
			}		
				
		} else {
			alert("You have used up all your placements for the turn!");
			var canvas = document.getElementById("field_overlay");
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
	} else {
		//This is when using improvements already on the field
		if (resolving == 1){
			if (tempColor == "white" && dist(r, co, row, col) <= range){
				
				//Place packet with value 0 (essentially resetting the tile it was placed on)

				//See if the square contains a forcefield generator
				var generator = addOns[row * width + col];
			
				tempPacket.place(row + 3, col + 3, 0);
				//Erase tile
				tempPacket.placeImp(row, col, 0);
				//Erase forcefield effects
			    if (generator < 0){
			    	clearForcefield(row + 3, col + 3, 2, -1 * generator);
			    	socket.emit("clearForcefield", {room: currentRoom, xcoord: col + 3, ycoord: row + 3, player: -1 * generator});
			    }				
			    
				drawField();

				//Send message to server containing coordinates and packet shape
				socket.emit("placement", {room: currentRoom, xcoord: col, ycoord: row, sh: tempPacket.getShape(), color: "white"});	
				socket.emit("improvement", {room: currentRoom, xcoord: col, ycoord: row, sh: tempPacket.getShape(), n: "0"});	

				placements -= tempPacket.getPlacement();
				budget = budget.subtract(new Vector(1, 0));;
				actions -= 1;
				resolving = 0;
				tempPacket = null;
			}
		} else {
			if (addOns[row * (length) + col] == num){
				if (actions > 0 && budget.credits > 0){
					//Fire an artillery
					destroy("1", row, col, 4);					
				} else if (actions == 0){
					alert("You do not have enough actions to fire an artillery!");
				} else if (budget.credits <= 0){
					alert("You do not have enough credits to fire an artillery!");
				}
			}
		}
		tempCard = null;		
		sendStatus();
		showStatus();
	}
}

//Draw a shadow of the packet onto the field
function drawShadow(x, y){
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.globalAlpha = 0.3;
	if (tempPacket != null && tempColor != null){		
		//Draw shape

		row = Math.floor(y / blockLength);
		col = Math.floor(x / blockLength);
		var colliding = tempPacket.collide(row + 3, col + 3, 3 - num);
		//This doesn't check collision with forcefields
		var collidingBlocks = tempPacket.collide(row + 3, col + 3, -10);
		var adjacent = tempPacket.adjacent(row + 3, col + 3, num);
		var color = tempColor;

		//If shape is obstruction then only need to check collisions (with blocks and not forcefields)
		if (color == "black" && collidingBlocks){
			color = "red";
		} else if (color != "black" && (colliding || 
			!adjacent )) {
			//Otherwise it's a player's piece so also need to check collision with forcefields and adjacency
			color = "red";
		} 
		//Bomb
		if (tempColor == "white"){
			//check range
			if (dist(r, co, row, col) <= range){
				color = "white";
			} else {
				color = "red";
			}
		}
		//Add-on
		if (tempColor == "orange"){
			//Must collide with itself (Equiv to being on an own tile)
			if (addOns[row * (length) + col] == 0 && tempPacket.collideWith(row + 3, col + 3, num)){
				if (improv == 2 + num){
					//good to go only if above mineral patch
					if (effects[(row + 3) * (length + 6) + col + 3].includes(4)){
						color = "white";
					} else {
						color = "red";
					}
				} else {
					color = "white";
				}
			} else {
				color = "red";
			}
		}
		if (resolving == 1){
			tempPacket.drawShape(ctx, col * blockLength, row * blockLength, blockLength, color, 0.3);
		}
	} 
	

}

//Draw packet onto the field: t = 1 means actually draw, t = 0 means erase
function drawPacket(t){
	var canvas = document.getElementById("field");
	var ctx = canvas.getContext("2d");
		
	//Draw shape
	x = cursorX - coord.left;
	y = cursorY - coord.top;
	row = Math.floor(y / blockLength);
	col = Math.floor(x / blockLength);
	if (t == 1){
		tempPacket.drawShape(ctx, col * blockLength, row * blockLength,blockLength, tempColor, 1);
	} else {
		tempPacket.drawShape(ctx, col * blockLength, row * blockLength,blockLength, "#17dc2f", 1);
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
			var number = sel.draw(1, hand.length);
			if (event.button == 0){		
				if (turn == 1){		
					selectCard(hand, number, 0);	
				}			
			} else if (event.button == 2){	
				//selectCard(hand, number, 0);
				selectedDiscard(turn - 1, number);
			}
		}
	, false);
}

function selectCard(arr, number, p){
	if (number != -1 && number < arr.length){
		//If player has enough resources
		var card = arr[number];
		var cost = card.cost;
		if (budget.subtract(cost).affordable() && actions > 0){
			//updateDiscard(hand.splice(number, 1)[0]);
			drawHand();
			//Finished resolving or if it's picking a polyomino
			if (resolving == 0 || p == 1){
				if (card.ind == 33){
					//Can't play trojan horse card
					alert("You cannot play this card!");
				} else if (imps.includes(card.ind) && !contains(field, num)){
					//This is if there are no tiles on which to put improvements
					alert("You have no tiles on which to place improvements!");
				} else {
					execute(arr, number, p);
				}
			} else {
				alert("Please finish resolving your current card!");
			}

			//drawDiscard(discard[discard.length - 1]);
			//actions -= 1;
			//budget = budget.subtract(cost);
			//showStatus();
			//sendStatus();
			//var text ="<strong> Player " + num + "</strong> plays <strong>" + card.name + "<strong>. <br>";
			
		} 
	}
}

//Display the card the mouse is hovering over
function showCard(event, arr){
	var canvas = document.getElementById("card_display");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var x = event.pageX;
	var y = event.pageY;
	var w = Math.min((900 / arr.length), 150);
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
	//Only splice if arr = hand
	if (poly == 0){
		temp = arr.splice(number, 1)[0];				
	}
	//If card is ok to resolve
	if (obj.resolve(free + 1) == 1){
		//Remove card from hand
		
		//When card is finished resolving
		if (resolving == 0){
			//discard the resolved card
			if (poly == 0){
				//Update transcript
				var text ="<strong> Player " + num + "</strong> plays <strong>" + obj.name + "<strong>. <br>";
				updateScroll(text);
				
				//Trash instead of discard if the card is Trojan
				if (obj.ind != 32){
					updateDiscard(obj);
					drawDiscard(discard[discard.length - 1]);
				}

				showStatus();
				sendStatus();
			}
		} else {
			//In middle of resolution 
			//Only reset tempcard if it's not a poly choice (i.e. an actual card)
			if (poly != 1) {
				tempCard = obj;
			}
			
		}
		//Redraw Hand
		drawHand();
		
	} else {
		//Put temp card back in hand
		hand.push(temp);
	}
		 
	
	free = 0;
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
	obj.drawImg(ctx, 0, 0, 150, 200);
}

//Draw deck (has a number on it indicating number of cards left)
function drawDeck(){
	var canvas = document.getElementById("deck_display");
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "brown";
	ctx.fillRect(0, 0, 150, 200);
	ctx.font = "48px serif";
  	ctx.strokeText(deck.length, 10, 50);
}

//Draw field
function drawField(){
	var c = document.getElementById("field");
	var ctx = c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);
	for (i = 3; i < 3 + length; i++){
		for (j = 3; j < 3 + length; j++){

			//Draw each tile
			var tile = field[i * (length + 6) + j];
			ctx.fillStyle = colors[tile];
			ctx.fillRect((j - 3) * blockLength, (i - 3) * blockLength, blockLength, blockLength);
			//Draw effects
			var effects_tile = effects[i * (length + 6) + j];
 			//Draw forcefield markers
 			if (effects_tile.includes(1)){ 				
 				
 				ctx.beginPath();
 				ctx.fillStyle = colors[1];
 				//Draw square
 				ctx.rect((j - 3) * blockLength + 5, (i - 3) * blockLength + 5, blockLength - 10, blockLength - 10);
				
				ctx.lineWidth = 5;
				ctx.strokeStyle = colors[1];
				ctx.stroke();
				
	
 			}
 			if (effects_tile.includes(2)){
 				ctx.beginPath();
 				ctx.fillStyle = colors[2];
 				//Draw ssquare
				ctx.rect((j - 3) * blockLength + 10, (i - 3) * blockLength + 10, blockLength - 20, blockLength - 20);
				
				ctx.lineWidth = 5;
				ctx.strokeStyle = colors[2];
				ctx.stroke();
				
 			}
 			//Minerals
 			if (effects_tile.includes(4)){
 				var image = images[images.length - 2];
 				ctx.drawImage(image, (j - 3) * blockLength, (i - 3) * blockLength, blockLength, blockLength);
				
 			}
 			//Big minerals
 			if (effects_tile.includes(5)){
 				var image = images[images.length - 1];
 				ctx.drawImage(image, (j - 3) * blockLength, (i - 3) * blockLength, blockLength, blockLength);
				
 			}
		}
	}

	//Draw grid
	for (i = 0; i < length; i++){
		ctx.beginPath();
		ctx.moveTo(i * blockLength,0);
		ctx.lineTo(i * blockLength,800);
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.moveTo(0,i * blockLength);
		ctx.lineTo(800,i * blockLength);
		ctx.strokeStyle = 'black';
		ctx.stroke();

	}

	//Draw central square (superweapon)
	var pivot = (length / 2 - 1);
	ctx.beginPath();
	ctx.moveTo(pivot * blockLength, 
		pivot * blockLength);
	ctx.lineTo(pivot * blockLength, (pivot - 1) * blockLength);
	ctx.lineTo((pivot + 2) * blockLength, (pivot - 1) * blockLength);
	ctx.lineTo((pivot + 2) * blockLength, pivot * blockLength);
	ctx.lineTo((pivot + 3) * blockLength, pivot * blockLength);
	ctx.lineTo((pivot + 3) * blockLength, (pivot + 2) * blockLength);
	ctx.lineTo((pivot + 2) * blockLength, (pivot + 2) * blockLength);
	ctx.lineTo((pivot + 2) * blockLength, (pivot + 3) * blockLength);
	ctx.lineTo((pivot) * blockLength, (pivot + 3) * blockLength);
	ctx.lineTo((pivot) * blockLength, (pivot + 2) * blockLength);
	ctx.lineTo((pivot - 1) * blockLength, (pivot + 2) * blockLength);
	ctx.lineTo((pivot - 1) * blockLength, (pivot) * blockLength);
	ctx.lineTo((pivot) * blockLength, (pivot) * blockLength);
	ctx.lineWidth = 5;
	ctx.strokeStyle = 'red';
	ctx.stroke();

	//Draw addons
	for (i = 0; i < length; i++){
		for (j = 0; j < length; j++){
			var centerX = j * blockLength + 0.5 * blockLength;
			var centerY = i * blockLength + 0.5 * blockLength;
			//Draw each tile
			var tile = addOns[i * length + j];
			

 			//Draw artillery
 			if (tile == 1 || tile == 2){
				//Draw a circle for the artillery
		        var radius = blockLength / 3;

		        ctx.beginPath();
		        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		        ctx.fillStyle = 'gray';
		        ctx.fill();
		        ctx.lineWidth = 2;
		        ctx.strokeStyle = '#003300';
		        ctx.stroke();
		        ctx.fillStyle = 'black';
		        ctx.font = 'bold 25px arial';
  				ctx.fillText('A', centerX, centerY + 10);
 			} else if (tile == -1 || tile == -2){
 				//Draw a circle for the artillery
		        var radius = blockLength / 3;

		        ctx.beginPath();
		        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		        ctx.fillStyle = 'gray';
		        ctx.fill();
		        ctx.lineWidth = 2;
		        ctx.strokeStyle = '#003300';
		        ctx.stroke();
		        ctx.fillStyle = 'black';
		        ctx.font = 'bold 25px arial';
  				ctx.fillText('F', centerX, centerY + 10);
 			} else if (tile == 3 || tile == 4){
 				//Draw a circle for the artillery
		        var radius = blockLength / 3;

		        ctx.beginPath();
		        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		        ctx.fillStyle = 'gray';
		        ctx.fill();
		        ctx.lineWidth = 2;
		        ctx.strokeStyle = '#003300';
		        ctx.stroke();
		        ctx.fillStyle = 'black';
		        ctx.font = 'bold 25px arial';
		        ctx.textAlign = "center";
  				ctx.fillText('R', centerX, centerY + 10);
 			}
		}
	}
	
}

function drawHand(){
	var canvas = document.getElementById("hand");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (index = 0; index < hand.length; index++){
		var posX = Math.min((900 / hand.length) * index, 150 * index);
		
		hand[index].drawImg(ctx, posX, 0, 150, 200);
	    
	}
}


//Send public info to opponent
function sendStatus(){
	socket.emit("status", {room: currentRoom, actions: actions, placements: placements, budget: budget, handsize: hand.length});
}

//Update opponent's status
socket.on("status", function(data){
	console.log(data.handsize);
	document.getElementById("opp").innerHTML = 
	"Opponent's actions: " + data.actions + "<br>" + 
	"Opponent's placements: " + data.placements + "<br>" + 
	"Opponent's credits: " + data.budget.credits + "<br>" +
	"Opponent's minerals: " + data.budget.minerals + "<br>" +
	"Opponent's hand size: " + data.handsize;
});

socket.on("improvement", function(data){
	var packet = new Packet("'" + data.sh + "'", 0);
	packet.placeImp(data.ycoord, data.xcoord, parseInt(data.n));
	drawField();
});

socket.on("addon", function(data){
	addOns[data.ycoord * (length) + data.xcoord] = data.type;
	
	drawField();
});

socket.on("addForcefield", function(data){
	addForcefield(data.ycoord, data.xcoord, 2, data.player);
	
	drawField();
});

socket.on("clearForcefield", function(data){
	clearForcefield(data.ycoord, data.xcoord, 2, data.player);
	
	drawField();
});

socket.on("boardwipe", function(data){
	wipeBoard();
});

//Functions upon receiving messages from server
socket.on("placement", function(data){
	var canvas = document.getElementById("field");
	var ctx = canvas.getContext("2d");
	
	var packet = new Packet("'" + data.sh + "'", 0);

	//Modify entries in field
	var n = 3 - num;
	if (data.color == "black"){
		n = 3;
	} else if (data.color == "white"){
		n = 0;
		addOns[data.ycoord * length + data.xcoord] = 0;
	}
	packet.place(data.ycoord + 3, data.xcoord + 3, n);
	//Reset improvements on the tile
	
	drawField();
});

//Discard a card upon receiving 
socket.on("randomDiscard", function(){
	randomDiscard(0);
});

//Add a trojan horse card into the deck
socket.on("trojan", function(){
	deck.push(cards[33]);

	deck = shuffle(deck);
	drawDeck();

});

socket.on("horse", function(){
	horses += 1;

});

//Write to transcript
socket.on("event", function(data){
	var element = document.getElementById("transcript");
	element.innerHTML += data;
    element.scrollTop = element.scrollHeight;
});

//Open up dialog box to choose to discard
socket.on("hand", function(data){		
	$( function() {
			var canvas = document.getElementById("o_hand");
			var overlay = document.getElementById("o_hand_overlay");
			var sel = new Selection(event, overlay);
			$( "#opp_hand" ).dialog({
			  dialogClass: "no-close",
			  modal: true,
			  width: 1100,
			  height: 350
			});
			//Create canvas for display

			var w = 150;
			var offset = $('#opp_hand').offset();
			var card;
			$('#opp_hand').append(canvas);
			$('#opp_hand').append(overlay);
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			//Draw the cards
			for (index = 0; index < data.length; index++){
				var posX = 1050 / 7 * index;				
				cards[data[index].ind].drawImg(ctx, posX, 0, 150, 200);
			}
			//add mouse listeners
			overlay.addEventListener("mousedown", 
				function(event){
					var number = sel.draw(1, data);
					if (number != -1 && number < data.length){
						socket.emit("targetDiscard", {room: currentRoom, ind: number});
						$( '#opp_hand').dialog( "close" );
					}					
				}, 
			false);
	  } );
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
    element.scrollTop = element.scrollHeight;
});

socket.on("discard", function(data){
	opp_discard = data;
	var canvas = document.getElementById("opp_discard");
	var ctx = canvas.getContext("2d");
	if (data.length > 0){
		cards[data[data.length - 1].ind].drawImg(ctx, 0, 0, 150, 200);
	} else {
		//Reset opp_discard
	  	ctx.fillStyle = "gray";
		ctx.fillRect(0, 0, 150, 200);
		ctx.font = "30px serif";
	  	ctx.strokeText("Opponent's", 10, 50);
	  	ctx.strokeText("discard", 10, 100);
	}
});


function updateDiscard(obj){
	discard.push(obj);
	socket.emit("discard", {room: currentRoom, discard: discard});
}

function updateScroll(text){
    var element = document.getElementById("transcript");
	element.innerHTML += text;
    element.scrollTop = element.scrollHeight;
    socket.emit("event", {room: currentRoom, text: text});
}

function drawMarket(){
	var canvas = document.getElementById("staples");
	var ctx = canvas.getContext("2d");
	var w = 150;
	var h = 200;
	//Draw staples
	for (i = 0; i < staples.length; i++){
		var row = Math.floor(i / 4);
		var col = i % 4;
		if (quantity[i] > 0){
			cards[staples[i]].drawImg(ctx, col * w, row * h, 150, 200);
			//Draw number of copies
			ctx.beginPath();
			ctx.arc(col * w + 20, row * h + 20, 20, 0, 2 * Math.PI, false);
	        ctx.fillStyle = 'white';
	        ctx.fill();
	        ctx.lineWidth = 2;
	        ctx.strokeStyle = '#003300';
	        ctx.stroke();
	        ctx.fillStyle = 'black';
	        ctx.font = 'bold 25px arial';
			ctx.fillText(quantity[i], col * w + 5, row * h + 30);
		}
	}
	
	//Draw other cards from a shuffled market pile
	canvas = document.getElementById("random");
	ctx = canvas.getContext("2d");
	for (i = 0; i < 8; i++){
		var row = Math.floor(i / 4);
		var col = i % 4;
		cards[market[i]].drawImg(ctx, col * w, row * h, 150, 200);
	}
}
//]]>