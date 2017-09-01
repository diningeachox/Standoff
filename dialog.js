

/*Dialog box for when a player needs to select
cards out of a hand, deck, or discard pile
*/
function Box(canv, n, arr, num){
	this.canv = canv;
	this.n = n;
	this.sel = null;
	this.cardWidth = 150;
	this.cardHeight = 200;
	this.cards = [];
	this.num = num;
	//this.display = display;

	
}

Box.prototype.getCards = function(){
	return this.cards;
}

Box.prototype.createBox = function(canv, n, arr, title, display){
	var cards = [];
	
	$(canv).attr('title', title);
	var canvas = document.createElement("canvas");
	var overlay = document.createElement("canvas");
	var sel = null;
	var num = this.num;
	var offset = $(canv).offset();
	
	canvas.width = arr.length * 150;
	canvas.height = 200;
	canvas.style.left = "0px";
	 	canvas.style.top = "0px";
	canvas.style.position = "absolute";
	
	overlay.width = canvas.width;
	overlay.height = canvas.height;
	overlay.style.left = "0px";
	 	overlay.style.top = "0px";
	overlay.style.position = "absolute";

	//add mouse listeners
	overlay.addEventListener("mousedown", 
		function(event){
			
			if (sel == null){
				sel = new MultiSelection(overlay, n);
			} 
			sel.select(event, arr.length, offset.left + 450);
			$('#button_ok').button('enable');
		}, 
	false);
	
	$mydialog = $(canv).dialog({
	  dialogClass: "no-close",
	  modal: true,
	  width: 1100,
	  height: 350,
	  buttons: [
	    {
	      id: "button_ok",
	      text: "OK",
	      click: function() {
	      	if (sel != null){
	      		cards = sel.selection();
	      		//First sort the indices in descending order		
	      		cards.sort().reverse();
	      		//Then remove one by one
	      		for (var i = 0; i < cards.length; i++){
					var a = arr.splice(cards[i], 1);
					var text ="<strong> Player " + num + "</strong> trashes <strong>" + a[0].name + "<strong>. <br>";
					display(text);
				}
	      		
	      	}
	        $( this ).dialog( "close" );
	      }
	    }
	  ]
	});
	$('#button_ok').button('disable');
	//Create canvas for display
	$(canv).append(canvas);
	$(canv).append(overlay);
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	
	//draw the cards
	for (index = 0; index < arr.length; index++){
		var posX = 150 * index;
		ctx.drawImage(arr[index].img, posX, 0, 150, 200);
	}
	
}

/* Selection class used to select a single card from an array
draw(): draws a bounding box on the selected card
index(): returns the index of the card selected
*/
function Selection(event, overlay){
	this.overlay = overlay;
	this.event = event;
	this.cardWidth = 150;
	this.cardHeight = 200;
	this.selected = -1;
	this.maxCards = 6; //Width of the hand canvas

}

Selection.prototype.reset = function(){
	this.selected = -1;
}

Selection.prototype.index = function(){
	var rect = this.overlay.getBoundingClientRect();
	var ctx = this.overlay.getContext("2d");

	//Get relative position of cursor
	var x = event.pageX - rect.left;
	var y = event.pageY - rect.top;
	var col = Math.floor(x / cardWidth);	
	var row = Math.floor(y / cardHeight);

	var num = row * 4 + col;
	return num;
}

Selection.prototype.draw = function(t, length){
	//Set max cards in a row
	if (t == 2){
		this.maxCards = 4;
	} 
	var rect = this.overlay.getBoundingClientRect();
	var ctx = this.overlay.getContext("2d");

	ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
	//Get relative position of cursor
	var x = event.pageX + (window.pageXOffset || document.body.scrollLeft) - rect.left;
	var y = event.pageY + document.body.scrollTop - rect.top;
	var width = Math.min(this.cardWidth, this.maxCards  * this.cardWidth / (length / 2));
	var col = Math.floor(x / width);	
	var row = Math.floor(y / cardHeight);

	var num;
	if (t == 2){
	    num = row * 4 + col;
	} else {
		num = col;
	}
	if (num < length){

		//If no card is yet selected, select that
		if (this.selected == -1){
			this.selected = num;
			
			ctx.strokeStyle = "rgb(255, 255, 130)";
			ctx.lineWidth = 8;
			ctx.beginPath();
			ctx.moveTo((col + 1) * width, row * this.cardHeight);
			ctx.lineTo(col * width, row * this.cardHeight);
			ctx.lineTo(col * width, row * this.cardHeight + 200);
			ctx.lineTo((col + 1) * width, row * this.cardHeight + 200);
			ctx.lineTo((col + 1) * width, row * this.cardHeight);
			ctx.closePath();
			ctx.stroke();
		} else {
			if (num == this.selected){
				this.selected = -1;
				return num;
			} else {
				this.selected = num;
				ctx.strokeStyle = "rgb(255, 255, 130)";
				ctx.lineWidth = 8;
				ctx.beginPath();
				ctx.moveTo((col + 1) * width, row * this.cardHeight);
				ctx.lineTo(col * width, row * this.cardHeight);
				ctx.lineTo(col * width, row * this.cardHeight + 200);
				ctx.lineTo((col + 1) * width, row * this.cardHeight + 200);
				ctx.lineTo((col + 1) * width, row * this.cardHeight);
				ctx.closePath();
				ctx.stroke();
			}
		}
		
	}	
	return -1;
}

/*Multiple card selection class: 
Allows user to select up to n cards
from dialog boxes
*/

function MultiSelection(overlay, n){
	this.overlay = overlay;
	this.event = event;
	this.cardWidth = 150;
	this.cardHeight = 200;
	this.selected = [];
	this.n = n; //Number of cards able to be selected
}

MultiSelection.prototype.selection = function(){
	return this.selected;
}

MultiSelection.prototype.draw = function(){
	var rect = this.overlay.getBoundingClientRect();
	var ctx = this.overlay.getContext("2d");
	ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
	for (i = 0; i < this.selected.length; i++){
		var num = this.selected[i]; //Index/position of card
		ctx.strokeStyle = "rgb(255, 255, 130)";
		ctx.lineWidth = 8;
		ctx.beginPath();
		ctx.moveTo((num + 1) * this.cardWidth, 0);
		ctx.lineTo(num * this.cardWidth, 0);
		ctx.lineTo(num * this.cardWidth, this.cardHeight);
		ctx.lineTo((num + 1) * this.cardWidth, this.cardHeight);
		ctx.lineTo((num + 1) * this.cardWidth, 0);
		ctx.closePath();
		ctx.stroke();
	}
}

MultiSelection.prototype.select = function(event, length, offsetLeft){
	//Get relative position of cursor
	var x = event.pageX - offsetLeft;
	var col = Math.floor(x / cardWidth);
	
	if (col < length){
		//If number of cards selected is less than maximum, select the card
		if (this.selected.length <= this.n){
			//If card is already selected, unselect it 
			var ind = this.selected.indexOf(col);
			if (ind != -1){
				//Delete the card from selection
				this.selected.splice(ind, 1);
				
			} else {
				//Delete previous selection if this.n == 1
				if (this.n == 1){
					this.selected = [];
				}
				//Add card to selection
				if (this.selected.length < this.n){
					this.selected.push(col);
				}
				
			}
		} 
		
	}	

	this.draw();
} 

