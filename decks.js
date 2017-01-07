//Game parameters
var length = 14;
var width = 14;

//Image array
var images = [];



//Address array for images
var arr = ["images/1.png", "images/2.png", "images/3.png", "images/4.png", 
"images/1c.png", "images/2c.png", "images/3c.png", 
"images/3f.png", "images/4f.png", "images/5f.png",
"images/restock.png", "images/blitz.png", "images/hack.png", "images/obstruction.png", 
"images/mirv.png", "images/tax.png", "images/drop.png", "images/artillery.png",
"images/deflector.png", "images/armageddon.png",
"images/L.png", "images/T.png", "images/gamma.png", "images/square.png",
"images/S.png", "images/Z.png", "images/I.png"
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



var aggro, midrange, combo, control, a_aggro;
//Card list
var cards = [
	new Card(0, ["createPacket('1', 1)"], "", 0, 0),
	new Card(1, ["createPacket('1010', 1)"], "", 0, 2),
	new Card(2, ["createPacket('100100100', 1)"], "", 0, 4),
	new Card(3, ["createPacket('1101', 1)"], "", 0, 4),
	new Card(4, ["gain(1)"], "Add 1 credits to budget.", 0, 0),
	new Card(5, ["gain(2)"], "Add 2 credits to budget.", 0, 0),
	new Card(6, ["gain(3)"], "Add 3 credits to budget.", 0, 0),
	new Card(7, ["fastGain(3)"], "Add 3 credits to budget, pay 2 credits at the beginning of your next turn.", 0, 0),
	new Card(8, ["fastGain(4)"], "Add 4 credits to budget, pay 2 credits at the beginning of your next turn.", 0, 0),
	new Card(9, ["fastGain(5)"], "Add 5 credits to budget, pay 2 credits at the beginning of your next turn.", 0, 0),
	new Card(10, ["draw(3, 0)"], "Draw 3 Cards.", 1, 3),
	new Card(11, ["addActions(2)"], "Gain 2 actions.", 1, 3),
	new Card(12, ["randomDiscard(1)"], "Opponent randomly discards a card.", 1, 2),	
	new Card(13, ["obstruct('1', 0)"], "places a 1x1 black polyomino onto the field", 1, 2),
	new Card(14, ["destroy('1', 9, 9, 200)"], "", 1, 3),
	new Card(15, ["tax(2, 5)"], "+2 credit for next five turns", 1, 2),
	new Card(16, ["createPacket('1', 0)"], "", 1, 2),
	new Card(17, ["artillery()"], "", 1, 4),
	new Card(18, ["createShield()"], "creates a deflector shield", 1, 4),
	new Card(19, ["wipeBoard()"], "destroys all tiles and improvements on the field", 1, 12),
	new Card(20, ["createPacket('100100110', 1)"], "", 0, 6),
	new Card(21, ["createPacket('111010000', 1)"], "", 0, 6),
	new Card(22, ["createPacket('111100100', 1)"], "", 0, 6),
	new Card(23, ["createPacket('1111', 1)"], "", 0, 6),
	new Card(24, ["createPacket('100110010', 1)"], "", 0, 5),
	new Card(25, ["createPacket('010110100', 1)"], "", 0, 5),
	new Card(26, ["createPacket('1000100010001000', 1)"], "", 0, 8)
];


/* MIRV deck: (8 sticks)
Focused on bombing the opponent.
Then tries to get to the center as fast as possible 
with deflector protection.
4 I's, 2 T;
2 deflectors;
5 bomb;
1 restocks;
9 3-credits;
Total - 23 cards
*/

mirv = [
		cards[3], cards[3], cards[3], cards[3], cards[21], cards[21],
		cards[18], cards[18],
		cards[14], cards[14], cards[14], cards[14], cards[14],
		cards[10], 
		cards[6], cards[6], cards[6], cards[6], cards[6], 
		cards[6], cards[6], cards[6], cards[6]
		
		];

/* Aggro deck: (4-stick & Airdrop)
Goal is to get to the center as fast as possible 
using the combo 4-stick & airdrop whenever possible.
A couple of bombings in there to blow up obstructions.

7 5f-credits, 4 3-credits;
3 Z's, 3 S's, 4 3-sticks;
Total - 21 cards (very consistent!)
   */
aggro = [cards[16], cards[16], cards[16], cards[16], 
		cards[14], cards[14], 
		cards[3], cards[3], cards[3], cards[3], cards[3],
		cards[6], cards[6], cards[6], cards[6], cards[6], cards[6],
		cards[6], cards[6], cards[6], cards[6]
		];

/* Artillery aggro: 
Goal is to get to the center as fast as possible 
using the combo 4-stick & airdrop whenever possible.
Once close to the center, set up an artillery 
to wipe out opponent's tiles, then claim the center.

10 3-credits;
4 4-sticks;
 4 airdrops;
 3 artillery;
Total - 21 cards (very consistent!)
   */
a_aggro = [cards[16], cards[16], cards[16], cards[16], 
		cards[17], cards[17], cards[17],
		cards[3], cards[3], cards[3], cards[3], 
		cards[6], cards[6], cards[6], cards[6], cards[6], cards[6],
		cards[6], cards[6], cards[6], cards[6]
		];

/* Midrange deck: (Artillery Midrange)
Focuses on approaching the center and then
setting up artilleries to make sure opponent
never encroaches.
A few obstructions to buy time to set up artillery
A couple deflectors for protection

8 3-credits, 2 5f-credits;
3 artillery; (main gameplan)
5 4-sticks; (to get to the center quickly)
2 tax; (generating credits for artillery and good resource sink)
2 obstructions; (as some control)
2 deflectors; (for protection)
Total - 22 cards
*/
midrange = [cards[6], cards[6], cards[6], cards[6],
			cards[6], cards[6], cards[6], cards[6],
			cards[9], cards[9],
			cards[3], cards[3], cards[3],  
			cards[3], cards[3], 
			cards[15], cards[15],  
			cards[13], cards[13], 
			cards[17], cards[17], cards[17],
			cards[18], cards[18]
		];

/* Combo-control deck: (Tax Storm)
Focused on getting a punch of taxes to ramp up economy.
Many bombs and obstructions to stall opponent.
1 boardwipe if necessary
Uses expedience and resupply to generated enough actions 
to play enough airdrops in the same turn to OTK.

7 3-credits, 2 2-credits, 2 4f-credits; (fast money to play taxes quickly)
1 armageddon; (last resort)
4 tax; (engine)
3 restock, 3 blitz; (engine)
2 airdrops; (win-con)
Total - 24 cards
*/

combo = [cards[8], cards[8], 
			cards[6], cards[6], cards[6], cards[6],
			cards[6], cards[6], cards[6],
			cards[5], cards[5], 
			cards[19],
			cards[10], cards[10], cards[10],
			cards[11], cards[11], cards[11],
			cards[15], cards[15], cards[15], cards[15],
			cards[16], cards[16]
			];

var decks = [mirv, aggro, a_aggro, midrange];

//Classes for cards and packets

//Non polyomino card
function Card(index, arr, t, ac, cost){
	this.effect = arr.slice(0);
	this.t = t;
	this.ac = ac;
	this.cost = cost;
	this.img = images[index];
	this.ind = index;
}

Card.prototype.getIndex = function(){
	return this.ind;
}

Card.prototype.drawImg = function(ctx, x, y, w, h){

	ctx.drawImage(this.img, x, y, w, h);
	
}

Card.prototype.resolve = function(p){
	if (p == 1){ //Card is played normally
		/*Can't play a card if you don't have enough actions 
			except resource cards (which take 0 actions)*/
		if (actions - this.ac < 0 && this.ac != 0){
			alert("You do not have enough actions to play this card!");
		}
		if (budget - this.cost < 0 && this.cost != 0){
			/*Can't play a card if you don't have enough budget 
			except resource cards (which have 0 cost)*/
			alert("You do not have enough budget to play this card!");
		}
	}
	if (((actions - this.ac >= 0 || this.ac == 0) &&
	 (budget - this.cost >= 0 || this.cost == 0)) ||
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

			var card = hand.splice(cardSelected, 1)[0];

			//When card is finished resolving
			if (resolving == 0){
				actions -= this.ac;
				budget -= this.cost;
				//discard the resolved card
				
				discard.push(card);
			} else {
				tempCard = card;
			}

			
		}
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
			//Only place if it's not a bomb and the tile is not under protection
			if (!(n == 0 && addOns[(y - 3) * width + (x - 3)].includes(3))){
				field[y * (width + 6) + x] = n * parseInt(this.shape.charAt(k));
			}
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
				addOns[y * width + x].push(n * parseInt(this.shape.charAt(k)));
			} else {
				if (!addOns[y * width + x].includes(3)){
					addOns[y * width + x] = new Array();
				}

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
Packet.prototype.collide = function(row, col){

	var dim = Math.sqrt(this.shape.length);
	for (k = 0; k < dim * dim; k++) {
		var i = Math.floor(k / dim);
		var j = k % dim;
		//If packet is out of field or intersecting with another packet
		if (field[(row + i) * (width + 6) + (col + j)] != 0 && parseInt(this.shape.charAt(k)) != 0){
			return true;
		}

    }
    return false;
};

//Checks if current position places the packet on top of another one of the same color
Packet.prototype.collideWithOwn = function(row, col, n){
	var dim = Math.sqrt(this.shape.length);
	for (k = 0; k < dim * dim; k++) {
		var i = Math.floor(k / dim);
		var j = k % dim;
		//If packet is out of field or intersecting with another packet of the same colour
		if (field[(row + i) * (width + 6) + (col + j)] == n * parseInt(this.shape.charAt(k)) && parseInt(this.shape.charAt(k)) > 0){
			return true;
		}

    }
    return false;
};

//Checks if current position of the packet is adjacent to edge or another packet
Packet.prototype.adjacent = function(row, col){
	return this.collideWithOwn(row - 1, col, num) || 
	this.collideWithOwn(row + 1, col, num) || 
	this.collideWithOwn(row, col - 1, num) || 
	this.collideWithOwn(row, col + 1, num);
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