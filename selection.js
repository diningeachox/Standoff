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
	var rect = this.overlay.getBoundingClientRect();
	var ctx = this.overlay.getContext("2d");

	ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
	//Get relative position of cursor
	var x = event.pageX + (window.pageXOffset || document.body.scrollLeft) - rect.left;
	var y = event.pageY + document.body.scrollTop - rect.top;
	var col = Math.floor(x / cardWidth);	
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
			
			ctx.strokeStyle = "rgb(100, 255, 100)";
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.moveTo((col + 1) * this.cardWidth, row * this.cardHeight);
			ctx.lineTo(col * this.cardWidth, row * this.cardHeight);
			ctx.lineTo(col * this.cardWidth, row * this.cardHeight + 200);
			ctx.lineTo((col + 1) * this.cardWidth, row * this.cardHeight + 200);
			ctx.lineTo((col + 1) * this.cardWidth, row * this.cardHeight);
			ctx.closePath();
			ctx.stroke();
		} else {
			if (num == this.selected){
				this.selected = -1;
				return num;
			} else {
				this.selected = num;
				ctx.strokeStyle = "rgb(100, 255, 100)";
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo((col + 1) * this.cardWidth, row * this.cardHeight);
				ctx.lineTo(col * this.cardWidth, row * this.cardHeight);
				ctx.lineTo(col * this.cardWidth, row * this.cardHeight + 200);
				ctx.lineTo((col + 1) * this.cardWidth, row * this.cardHeight + 200);
				ctx.lineTo((col + 1) * this.cardWidth, row * this.cardHeight);
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
		ctx.strokeStyle = "rgb(100, 255, 100)";
		ctx.lineWidth = 5;
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

MultiSelection.prototype.select = function(length, offsetLeft, offsetTop){
	//Get relative position of cursor
	var x = event.pageX - offsetLeft;
	var y = event.pageY - offsetTop;
	var col = Math.floor(x / cardWidth);	
	var row = Math.floor(y / cardHeight);

	var num;
	num = col;
	
	if (num < length){
		//If number of cards selected is less than maximum, select the card
		if (this.selected.length < this.n){
			//If card is already selected, unselect it 
			var ind = this.selected.indexOf(num);
			if (ind != 1){
				//Delete the card from selection
				this.selected.splice(ind, 1);
			} else {
				  
				
				//Delete previous selection if this.n == 1
				if (this.n == 1){
					this.selected = [];
				}
				//Add card to selection
				this.selected.push(num);
			}
		} 
		
	}	

	this.draw();
} 
