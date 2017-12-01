//Game parameters
var length = 16;
var width = 16;
var hexLength = 20;
var blockDist = hexLength * Math.sqrt(3);
var boardsize = 7;
var blockLength = 40;
var cardWidth = 100;
var cardHeight = 150;

var centerX = 560;
var centerY = 300;

var lastAction = null; 

//Animation
var starttime;
var colors = ["#C0C0C0", "yellow", "blue", "black", "#FF69B4"];

//Image array
var images = [];

//Address array for images
var arr = ["images/1p.png", "images/2p.png", "images/3p.png", "images/4p.png",
"images/1c.png", "images/2c.png", "images/3c.png", 
 
"images/airdrop.png", 
"images/airstrike.png",
"images/artillery.png",
"images/blitz.png", 
"images/disposal.png",
"images/early_access.png", 
"images/forcefield.png",
"images/fundraiser.png",
"images/hack.png",  
"images/obstruction.png", 
 
"images/trojan.png", 
"images/offensive.png",
"images/deflector.png",
"images/napalm.png",

"images/horse.png",

"images/hand.png"
];

//Preload Images
function ImageLoader(sources, callback) 
{
    var loadedImages = 0;
    var numImages = sources.length;
    
    for (i = 0; i < numImages; i++) {
        images[i] = new Image();
        images[i].onload = function() {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[i].src = sources[i];
    }
}


var loader = ImageLoader(arr, function() {

    // Draw all of the loaded images
    for (var i = 0; i < images.length; i++) {
        console.log("Image " + (i + 1) + " is loaded!");
    }


});
//Action cards which put improvements on tiles
var imps = [17, 18];
var aggro, midrange, combo, dup, hacker;

//Cards that are in every draft
var staples = [0, 1, 2, 3, 4, 5, 6, 18];
var quantity = [18, 18, 18, 18, 30, 24, 16, 8];

//Card list

function TriggerCard(index, triggerword, arr, t_arr, name, ac, cost, price, discard){
	
	Card.call(this, index, arr, name, ac, cost, price);
	this.t_arr = t_arr;
	this.triggerword = triggerword;
	this.discard = discard;
}

//Inherit prototypes
TriggerCard.prototype = Object.create(Card.prototype);
TriggerCard.prototype.constructor = TriggerCard;

TriggerCard.prototype.trigger = function(n){
	if (this.discard){
		var card = hand.splice(n, 1)[0];
		var text ="<strong> Player " + num + "</strong> triggers and discards <strong>" + card.name + "</strong> off of keyword <strong>" + card.triggerword + "</strong>. <br>";
		update(text);
		updateDiscard(card);
	} else {
		var text ="<strong> Player " + num + "</strong> triggers and reveals <strong>" + hand[n].name + "</strong> off of keyword <strong>" + hand[n].triggerword + "</strong>. <br>";
		update(text);
	}
	for (var i = 0; i < this.t_arr.length; i++) {
		this.t_arr[i].call(); //Apply the functions
	}
}

var cards = [
	new Card(0, ["playPoly(1)"], "1-Hex", 1, 0, 0),
	new Card(1, ["playPoly(2)"], "2-Hex", 1, 2, 2),
	new Card(2, ["playPoly(3)"], "3-Hex", 1, 4, 4),
	new Card(3, ["playPoly(4)"], "4-Hex", 1, 6, 6),
	new Card(4, ["gain(1)"], "1 credit", 0, 0, 0),
	new Card(5, ["gain(2)"], "2 credits", 0, 0, 2),
	new Card(6, ["gain(3)"], "3 credits", 0, 0, 5),	
	
	new Card(7, ["airdrop()"], "Airdrop", 1, 1, 2),
	new Card(8, ["destroy(9, 9, 200, 0)"], "Airstrike", 1, 3, 3),
	new Card(9, ["artillery()"], "Artillery", 1, 4, 6),
	new Card(10, ["addActions(3)"], "Blitz", 1, 1, 3),
	new Card(11, ["disposal()"], "Disposal", 1, 0, 2),
	new Card(12, ["tutor()"], "Early Access", 1, 1, 3),	
	new Card(13, ["force()"], "Forcefield", 1, 2, 3),	
	new Card(14, ["fundraiser()"], "Fundraiser", 1, 0, 3),
	new Card(15, ["targetDiscard(1)"], "Hack", 1, 2, 3),	
	new Card(16, ["obstruct()"], "Obstruction", 1, 3, 3),	
	//new Card(17, ["draw(3, 0)"], "Restock", 1, 1, 3),
	new Card(17, ["trojan()"], "Trojan", 1, 1, 4),
	new Card(18, ["offensive()"], "Tactical Offensive", 1, 2, 2),
	new TriggerCard(19, "Destroy", ["draw(2, 0)"], [function(){draw(1, 0); socket.emit("placement", {room: currentRoom, xcoord: 0, ycoord: 0, sh: [], num: -1, imp: -1});}], "Deflector Shield", 1, 1, 1, 1),	
	new Card(20, ["napalm()"], "Napalm", 1, 2, 4),
	new Card(21, [""], "Horse", 0, 0, 0)
];

// 6 1C's and 4 1P's is the starting deck for all players
var starter = [cards[4], cards[4], cards[4], cards[4], cards[4], 
				cards[4],
				cards[0], cards[0], cards[0],
				 cards[0]];

//Classes for cards and packets

//Non polyomino card
function Card(index, arr, name, ac, cost, price){
	this.effect = arr.slice(0);
	this.name = name;
	this.ac = ac;
	this.cost = cost;
	this.img = images[index];
	this.ind = index;
	this.price = price; //Price to buy from market
}

Card.prototype.getIndex = function(){
	return this.ind;
}

Card.prototype.drawImg = function(ctx, x, y, w, h){
	var image = this.img;
	if (image.complete){
		ctx.drawImage(image, x, y, w, h);
	} else {
		image.onLoad = function () {			
			//Turn off anti-aliasing
		    ctx.webkitImageSmoothingEnabled = false;
			ctx.mozImageSmoothingEnabled = false;
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(image, x, y, w, h);
		}
	}
	
}

Card.prototype.resolve = function(p){
	if (p == 1){ //Card is played normally
		/*Can't play a card if you don't have enough actions 
			except resource cards (which take 0 actions)*/
		if (actions - this.ac < 0 && this.ac != 0){
			alert("You do not have enough actions to play this card!");
			return 0;
		}
		if (budget < this.cost && this.cost != 0){
			/*Can't play a card if you don't have enough budget 
			except resource cards (which have 0 cost)*/
			alert("You do not have enough credits to play this card!");
			return 0;
		}
	}
	if (p == 2){ //Card is played off of Duplicate
		if (actions - this.ac < 0 && this.ac != 0){
			alert("You do not have enough actions to play this card!");
			return 0;
		}

	}
	//Good to play card
	if (((actions - this.ac >= 0 || this.ac == 0) &&
	 (budget >= this.cost || this.cost == 0)) ||
		p == 0){
		for (i = 0; i < this.effect.length; i++){
			s = this.effect[i];
			leftbr = s.indexOf("(");
			rightbr = s.indexOf(")");
			func = s.substring(0, leftbr);
			args = s.substring(leftbr + 1, rightbr).split(", ");
			
			

			//Convert arg to integer if it can be converted
			for (i = 0; i < args.length; i++) {
				if (args[i] == parseInt(args[i])){
					args[i] = parseInt(args[i]);
				}
			}
			//Execute the function
			(window[func]).apply(this, args);

		}
		if (resolving == 0){
			actions -= this.ac;
			if (p == 1){
				budget -= this.cost;
			}
			if (this.ac > 0){
				lastAction = s;
			}
		}
		return 1;
	} 
}





//A "virtual" polyomino card, purely for the GUI
function PolyCard(shape){
	var coords = "";
	for (i = 0; i < shape.length; i++){
		coords += shape[i][0] + "" + shape[i][1];
	}
	Card.call(this, -1, ["createPacket(" + coords + "), 1)"], "", 0, 0, 0);
	this.shape = shape;
}

PolyCard.prototype.drawImg = function(ctx, x, y, w, h){
	ctx.rect(x, y, cardWidth, cardHeight);
	ctx.stroke();
	for (var i = 0; i < this.shape.length; i++) {    
    	var a = this.shape[i][0];
    	var b = this.shape[i][1];
		var h = new Hex(a, b, 10);
		h.draw(x + cardWidth / 2, y + cardHeight / 2, "green", 3, 1.0, ctx);
	}	
}

//Inherit prototypes
PolyCard.prototype = Object.create(Card.prototype);

//Hexagonal polyomino
function Poly(shape){	
	this.shape = shape;
};

Poly.prototype.getShape = function(){
	return this.shape;
}

//Rotate by pi/3 (counterclockwise)
Poly.prototype.rotate = function(){
	for (i = 0; i < this.shape.length; i++){
		var a = this.shape[i][0];
		var b = this.shape[i][1];
		this.shape[i] = [-1 * b, a + b];
	}
};

//Put packet onto field
Poly.prototype.place = function(a, b, n){	
	var oldnums = [];
	for (k = 0; k < this.shape.length; k++) {
		var x = a + this.shape[k][0];
		var y = b + this.shape[k][1];
		if (field.hasOwnProperty([x, y]) && n >= 0){
			//Sace the old tiles for animating
			if (n == 0){
				oldnums.push(field[[x, y]].num);
			}	
			field[[x, y]].num = n;	
		}		
    }
    var shape = this.shape;
    if (n > 0){
	    requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
	    	starttime = timestamp || new Date().getTime(); 
	        drawPlacement(shape, a, b, colors[n], timestamp, 400); //Draw animation over 400 millisecs
	    });
	} else if (n == 0){
		drawField();
		destruction(shape, a, b, oldnums);
	}
    
};

//Checks if current position places the packet on top of another one
Poly.prototype.collide = function(a, b, num, field){
	for (i = 0; i < this.shape.length; i++){
		var x = a + this.shape[i][0];
		var y = b + this.shape[i][1];
		if (field.hasOwnProperty([x, y])){
			if (field[[x, y]].num != 0){
				return true;
			}
			if (effects.hasOwnProperty([x, y]) && effects[[x, y]].includes(num)){
				return true;
			}
		} else {
			//This means out of bounds
			return true;
		}		
	}
    return false;
};

//Checks if current position places the packet on top of another one of the same color
Poly.prototype.collideWith = function(a, b, n, field){
	for (i = 0; i < this.shape.length; i++){
		var x = a + this.shape[i][0];
		var y = b + this.shape[i][1];
		if (field.hasOwnProperty([x, y])){
			if (field[[x, y]].num == n){
				return true;
			}
		}
	}
    return false;
};

//Checks if current position of the packet is adjacent to edge or another packet
Poly.prototype.adjacent = function(a, b, num, field){
	return this.collideWith(a - 1, b, num, field) || 
	this.collideWith(a + 1, b, num, field) || 
	this.collideWith(a, b - 1, num, field) || 
	this.collideWith(a, b + 1, num, field) ||
	this.collideWith(a + 1, b - 1, num, field) || 
	this.collideWith(a - 1, b + 1, num, field);
};

//If packet is touching the edge but not going off the edge
Poly.prototype.touchingEdge = function(a, b){
	var phi = false;
	for (var i = 0; i < this.shape.length; i++) {    
    	var x = a + this.shape[i][0];
    	var y = b + this.shape[i][1];
    	var z = -1 * (x + y);	
    	var dist = Math.abs(x) + Math.abs(y) + Math.abs(z);
    	if (dist == 2 * boardsize){
    		//One of the hexes is touching the edge
    		phi = true;
    	} else if (dist > 2 * boardsize){
    		//Going off the edge
    		return false;
    	}
		
	}	
	return phi;
}

Poly.prototype.drawShape = function(ctx, a, b, color, alpha){
    ctx.globalAlpha = alpha;
    for (var i = 0; i < this.shape.length; i++) {    
    	var x = a + this.shape[i][0];
    	var y = b + this.shape[i][1];
    	var z = -1 * (x + y);	
    	if (field.hasOwnProperty([x, y])){
    		var h = new Hex(x, y, hexLength);
			h.draw(centerX, centerY, color, 3, alpha, ctx);
    	} 		
	}	
};

Poly.prototype.placeImp = function(a, b, n){
	var oldnums = [];
	for (var i = 0; i < this.shape.length; i++) {    
    	var x = a + this.shape[i][0];
    	var y = b + this.shape[i][1];
    	/*n = -1 means no change, 
    	n = 0 means destroy improvement,
    	n > 0 means place an improvement */
    	if (field.hasOwnProperty([[x, y]]) && n >= 0){
    		if (n == 0){
				oldnums.push(field[[x, y]].addOn);
			}	
    		field[[x, y]].addOn = n;
    	} 		
	}
	var shape = this.shape;
	if (n > 0){
		requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
			starttime = timestamp || new Date().getTime(); 
		    drawImp(shape, a, b, n, timestamp, 400); //Draw animation over 400 millisecs
		});
	} else if (n == 0){
		drawField();
		destructionImp(shape, a, b, oldnums);
	}
};



/*
//Rectangular polyomino
function Packet(str, placement){
	this.shape = str.substring(1, str.length - 1);
	this.placement = placement;
};

Packet.prototype.getShape = function(){
	return this.shape;
}

Packet.prototype.getPlacement = function(){
	return this.placement;
}


Packet.prototype.drawImg = function(ctx, x, y, w, h){
	ctx.drawImage(this.img, x, y, w, h);
}

//Put packet onto field
Packet.prototype.place = function(row, col, n){
	var dim = Math.sqrt(this.shape.length);
	for (k = 0; k < dim * dim; k++) {
		var i = Math.floor(k / dim);
		var j = k % dim;
		if (parseInt(this.shape.charAt(k)) > 0){
			var x = col + j;
			var y = row + i;
			field[y * (width + 6) + x] = n * parseInt(this.shape.charAt(k));
			
		}
    }
};

//Put packet onto field as an improvement
Packet.prototype.placeImp = function(row, col, n){
	var dim = Math.sqrt(this.shape.length);
	for (k = 0; k < dim * dim; k++) {
		var i = Math.floor(k / dim);
		var j = k % dim;
		if (parseInt(this.shape.charAt(k)) > 0){
			var x = Math.min(col + j, width);
			var y = Math.min(row + i, length);
			if (n != 0){
				addOns[y * width + x] = n * parseInt(this.shape.charAt(k));
			} else {
				addOns[y * width + x] = 0;
			}
		}
    }
};

//Rotate clockwise
Packet.prototype.rotate = function(){
	var dim = Math.sqrt(this.shape.length);
	var newShape = "";
	for (i = 0; i < dim * dim; i++) {
		var row = Math.floor(i / dim);
		var col = i % dim;
		var oldRow = dim - col - 1;
		var oldCol = row;
		newShape = newShape + this.shape.charAt(oldRow * dim + oldCol);
    }
    this.shape = newShape;
};

//Checks if current position places the packet on top of another one
Packet.prototype.collide = function(row, col, num){

	var dim = Math.sqrt(this.shape.length);
	for (k = 0; k < dim * dim; k++) {
		var i = Math.floor(k / dim);
		var j = k % dim;
		//If packet is out of field or intersecting with another packet
		if (field[(row + i) * (width + 6) + (col + j)] != 0 && parseInt(this.shape.charAt(k)) != 0){
			return true;
		}
		//If packet collides with a forcefield of opposing colour
		if ((effects[(row + i) * (width + 6) + (col + j)]).includes(num) && parseInt(this.shape.charAt(k)) != 0){
			return true;
		}
		

    }
    return false;
};

//Checks if current position places the packet on top of another one of the same color
Packet.prototype.collideWith = function(row, col, n){
	var dim = Math.sqrt(this.shape.length);
	for (k = 0; k < dim * dim; k++) {
		var i = Math.floor(k / dim);
		var j = k % dim;
		//If packet is out of field or intersecting with another packet of the same colour
		if (field[(row + i) * (length + 6) + (col + j)] == n * parseInt(this.shape.charAt(k)) && parseInt(this.shape.charAt(k)) > 0){
			
			return true;
		}

    }
    return false;
};

//Checks if current position of the packet is adjacent to edge or another packet
Packet.prototype.adjacent = function(row, col, num){
	return this.collideWith(row - 1, col, num) || 
	this.collideWith(row + 1, col, num) || 
	this.collideWith(row, col - 1, num) || 
	this.collideWith(row, col + 1, num);
};

Packet.prototype.drawShape = function(ctx, x, y, size, color, alpha){
	var dim = Math.sqrt(this.shape.length);
    var squareLength = size;
    ctx.globalAlpha = alpha;
    for (i = 0; i < dim; i++) {
		for (j = 0; j < dim; j++){
			if (this.shape.charAt(i* dim + j) == "1"){
				ctx.beginPath();
				ctx.rect(x + j * squareLength, y + i * squareLength, squareLength, squareLength);
				ctx.fillStyle = color;
				ctx.fill();
				ctx.strokeRect(x + j * squareLength, y + i * squareLength, squareLength, squareLength);
				ctx.closePath();
			}
		}
	}	
};

*/