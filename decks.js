//Game parameters
var length = 16;
var width = 16;

var lastAction = null; 

//Image array
var images = [];



//Address array for images
var arr = ["images/1.png", "images/2.png", "images/3.png", "images/4.png", 
"images/1c.png", "images/2c.png", "images/3c.png", 
"images/3f.png", "images/4f.png", "images/5f.png",
"images/restock.png", "images/blitz.png", "images/hack.png", "images/obstruction.png", 
"images/airstrike.png", "images/fundraiser.png", "images/airdrop.png", "images/artillery.png",
"images/forcefield.png", "images/duplicate.png",
"images/L.png", "images/T.png", "images/gamma.png", "images/square.png",
"images/S.png", "images/Z.png", "images/I.png",
"images/1p.png", "images/2p.png", "images/3p.png", "images/4p.png", 
"images/initiative.png", "images/trojan.png", "images/horse.png", "images/emp.png",
"images/early_access.png", "images/refinery.png", "images/disposal.png",
"images/steve.png", "images/linda.png", "images/bart.png", "images/zelda.png", 
"images/mineral.gif", "images/ruby.png"
];


//Card Images



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
var staples = [27, 28, 29, 30, 4, 5, 6, 36];
var quantity = [18, 18, 18, 18, 30, 24, 16, 16];

//Card list
var cards = [
	new Card(0, ["createPacket('1', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(1, ["createPacket('1010', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(2, ["createPacket('100100100', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(3, ["createPacket('1101', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(4, ["gain(1)"], "1C", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(5, ["gain(2)"], "2C", 0, new Vector(0, 0), new Vector(2, 0)),
	new Card(6, ["gain(3)"], "3C", 0, new Vector(0, 0), new Vector(5, 0)),
	new Card(7, ["fastGain(3)"], "3 Fast C", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(8, ["fastGain(4)"], "4 Fast C", 0, new Vector(0, 0), new Vector(2, 0)),
	new Card(9, ["fastGain(5)"], "5 Fast C", 0, new Vector(0, 0), new Vector(5, 0)),
	new Card(10, ["draw(3, 0)"], "Restock", 1, new Vector(2, 0), new Vector(3, 0)),
	new Card(11, ["addActions(3)"], "Blitz", 1, new Vector(3, 0), new Vector(4, 0)),
	new Card(12, ["targetDiscard(1)"], "Hack", 1, new Vector(2, 0), new Vector(3, 0)),	
	new Card(13, ["obstruct('1', 0)"], "Obstruction", 1, new Vector(2, 0), new Vector(3, 0)),
	new Card(14, ["destroy('1', 9, 9, 200)"], "Airstrike", 1, new Vector(3, 1), new Vector(3, 2)),
	new Card(15, ["fundraiser()"], "Fundraiser", 1, new Vector(0, 0), new Vector(3, 0)),
	new Card(16, ["createPacket('1', 0)"], "Airdrop", 1, new Vector(2, 0), new Vector(03, 0)),
	new Card(17, ["artillery()"], "Artillery", 1, new Vector(4, 1), new Vector(4, 2)),
	new Card(18, ["force()"], "Forcefield", 1, new Vector(2, 0), new Vector(3, 1)),
	new Card(19, ["duplicate()"], "Duplicate", 1, new Vector(4, 1), new Vector(4, 1)),
	new Card(20, ["createPacket('100100110', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(21, ["createPacket('111010000', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(22, ["createPacket('110100100', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(23, ["createPacket('1111', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(24, ["createPacket('100110010', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(25, ["createPacket('010110100', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(26, ["createPacket('1000100010001000', 1)"], "", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(27, ["createPacket('1', 1)"], "1P", 1, new Vector(0, 0), new Vector(1, 0)),
	new Card(28, ["createPacket('1010', 1)"], "2P", 1, new Vector(2, 0), new Vector(2, 0)),
	new Card(29, ["playPoly(2)"], "3P", 1, new Vector(3, 0), new Vector(3, 1)),
	new Card(30, ["playPoly(3)"], "4P", 1, new Vector(4, 1), new Vector(4, 2)),
	new Card(31, ["extraTurn()"], "Initiative", 1, new Vector(9, 0), new Vector(5, 0)),
	new Card(32, ["trojan()"], "Trojan", 1, new Vector(1, 0), new Vector(4, 0)),
	new Card(33, [""], "Horse", 0, new Vector(0, 0), new Vector(0, 0)),
	new Card(34, ["emp()"], "EMP", 1, new Vector(2, 0), new Vector(2, 2)),
	new Card(35, ["tutor()"], "Early Access", 1, new Vector(1, 0), new Vector(3, 1)),
	new Card(36, ["refinery()"], "Refinery", 1, new Vector(2, 0), new Vector(2, 0)),
	new Card(37, ["disposal()"], "Disposal", 1, new Vector(2, 0), new Vector(2, 0))
];

// 7 1C's and 3 1P's
var starter = [cards[4], cards[4], cards[4], cards[4], cards[4], cards[4], cards[27],
				cards[27], cards[27], cards[27]];


var poly = [[cards[0]],
	[cards[1]],
	[cards[2], cards[3]],
	[cards[20], cards[21], cards[22], cards[23], cards[24], cards[25], cards[26]]
];



var decks = [dup, aggro, hacker, midrange, combo];

//Classes for cards and packets

//Satellite card
function Sat(index, arr, name, ac, cost, price){
	this.effect = arr.slice(0);
	this.name = name;
	this.ac = ac; //Number of actions costed
	this.cost = cost; //Cost to play
	this.img = images[index];
	this.ind = index;
	this.price = price; //Price to buy from market
}

Sat.prototype.getIndex = function(){
	return this.ind;
}

Sat.prototype.drawImg = function(ctx, x, y, w, h){
	var image = this.img;
	if (image.complete){
		ctx.drawImage(image, x, y, w, h);
	} else {
		image.onLoad = function () {
			ctx.drawImage(image, x, y, w, h);
		}
	}
	
}

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
		if (!budget.subtract(this.cost).affordable() && this.cost != 0){
			/*Can't play a card if you don't have enough budget 
			except resource cards (which have 0 cost)*/
			alert("You do not have enough budget to play this card!");
			return 0;
		}
	}
	if (p == 2){ //Card is played off of Duplicate
		if (actions - this.ac < 0 && this.ac != 0){
			alert("You do not have enough actions to play this card!");
			return 0;
		}

	}
	if (((actions - this.ac >= 0 || this.ac == 0) &&
	 (budget.subtract(this.cost).affordable() || this.cost.equals(new Vector(0, 0)))) ||
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
				budget = budget.subtract(this.cost);
			}
			if (this.ac > 0){
				lastAction = s;
			}
		}
		return 1;
	} 
}

//Trap cards
function Trap(trigger, effect){
	this.trigger = trigger;
	this.effect = effect;
};

Trap.prototype.activate = function(){

}

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

function Vector(a, b){
	this.credits = a;
	this.minerals = b;
}

Vector.prototype.add = function(v){
	return new Vector(this.credits + v.credits, this.minerals + v.minerals);
}

Vector.prototype.subtract = function(v){
	return new Vector(this.credits - v.credits, this.minerals - v.minerals);
}

Vector.prototype.project = function(t){
	if (t == 0){
		return new Vector(this.credits, 0);
	} 
	return new Vector(0, this.minerals);
	
}

Vector.prototype.equals= function(v){
	return this.credits == v.credits && this.minerals == v.minerals;
}

Vector.prototype.affordable = function(){
	return this.credits >= 0 && this.minerals >= 0;
}