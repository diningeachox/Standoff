/*Dialog box for merging cards*/
function Merger(canv, arr, func){
	var sel = null;
	$(canv).attr('title', "Select which cards to merge:");
	$mydialog = $(canv).dialog({
		closeOnEscape: false,
	    open: function(event, ui) {
	        $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
	    },
	  dialogClass: "no-close",
	  resizable: false,
        draggable: false,
	  modal: true,
	  width: 5.5 * cardWidth,
	  height: (arr.length + 1) * cardHeight,
	  show: {
		effect: "slide",
		duration: 300
		},
	  hide: {
		effect: "fade",
		duration: 300
		},
		position: {
         my: "left",
         at: "left",
         of: $('#field')
     },
        close: function() {
        	//Delete table
        	var table = document.getElementById("pairings");
        	if (table) table.parentNode.removeChild(table);
        	$(this).dialog('destroy').remove();
	       //Readd div
	       $("#wrapper").append("<div id='dialog'></div>");
        }
	  
	});

	//Append a dynamic table with all possible mergers
    var table = document.createElement('table');
    table.setAttribute('id', 'pairings');
    for (var i = 0; i < arr.length; i++){
    	 var tr = document.createElement('tr');
    	 for (var j = 0; j < arr[i].length - 1; j++){
    	 	//var x=firstRow.insertCell(-1);
    	 	var img = hand[arr[i][j]].img;
    	 	img.width = cardWidth;
    	 	img.height = cardHeight;
    	 	var td = document.createElement('td');
    	 	$(td).width(cardWidth);
    	 	$(td).height(cardHeight);
    	 	td.appendChild(img);
    	 	tr.appendChild(td);
    	 	if (j == 0){
    	 		$(tr).append("<td>+</td>");
    	 	} else if (j == 1){
				$(tr).append("<td>=</td>");
    	 	}      	 	
    	 	
    	 }
    	 //Add the merged card
    	 var img =cards[arr[i][2]].img;
	 	img.width = cardWidth;
	 	img.height = cardHeight;
	 	var td = document.createElement('td');
	 	$(td).width(cardWidth);
	 	$(td).height(cardHeight);
	 	td.appendChild(img);
	 	tr.appendChild(td);
    	 //Add a button at the end of the row
    	 td = document.createElement('td');
    	 var button = document.createElement("button");
    	 button.innerHTML = "MERGE";
    	 button.setAttribute('id', i);
    	 button.className = "button -dark center";
    	 button.addEventListener ("click", function(){
    	 	func(button.getAttribute('id'));
    	 	$( canv ).dialog( "close" );
   			$(canv).dialog('destroy').remove();
	       //Readd div
	       $("#wrapper").append("<div id='dialog'></div>")
    	 });
    	 td.appendChild(button);
    	 tr.appendChild(td);
    	 //$(tr).append("<td><button class=\"button -dark center\" type=\"button\" onclick=\"\">OK</button> </td>");
        table.appendChild(tr);

    }
            
     $(canv).append(table);

	

	var offset = $('#field').offset().left;

}

/*Dialog box for when a player needs to select
cards out of a hand, deck, or discard pile
*/
function Box(canv, n, arr, num, title, func, dis){
	var sel = null;
	$(canv).attr('title', title);
	var canvas = document.createElement("canvas");
	var overlay = document.createElement("canvas");
	
	canvas.width = arr.length * cardWidth;
	canvas.height = cardHeight;
	canvas.style.left = "0px";
	canvas.style.top = "0px";
	canvas.style.position = "absolute";
	canvas.id = "can";
	
	overlay.width = canvas.width;
	overlay.height = canvas.height;
	overlay.style.left = "0px";
	overlay.style.top = "0px";
	overlay.style.position = "absolute";
	
	//add mouse listeners
	

	//Create canvas for display
	//$(canv).empty();
	$(canv).append(canvas);
	$(canv).append(overlay);
	
	$mydialog = $(canv).dialog({
		closeOnEscape: false,
	    open: function(event, ui) {
	        $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
	    },
	  dialogClass: "no-close",
	  resizable: false,
        draggable: false,
	  modal: true,
	  width: 500,
	  height: 300,
	  show: {
		effect: "slide",
		duration: 300
		},
	  hide: {
		effect: "fade",
		duration: 300
		},
		position: {
         my: "left",
         at: "left",
         of: $('#field')
     },
	  buttons: [
	    {
	      id: "button_ok",
	      text: "OK",
	      click: function() {
	      	if (sel != null){
	      		func(sel.selection().sort().reverse(), arr);	      		
	      	}	
	      	 //Delete canvasses
			
	        $( this ).dialog( "close" );
	       $(this).dialog('destroy').remove();
	       //Readd div
	       $("#wrapper").append("<div id='dialog'></div>")
	      }
	    }
	  ]
	});
	if (dis){
		$('#button_ok').button('disable');
	}
	if (arr.length == 0){
		$('#button_ok').button('enable');
	}

	var offset = $('#field').offset().left;
	overlay.addEventListener("mousedown", 
		function(event){
			
			if (sel == null){
				sel = new MultiSelection(overlay, n);
			} 
			sel.select(event, arr.length, offset);
			$('#button_ok').button('enable');
		}, 
	false);
	
	var ctx = canvas.getContext('2d');
	//draw the cards
	for (index = 0; index < arr.length; index++){
		var posX = cardWidth * index;
		arr[index].drawImg(ctx, posX, 0, cardWidth, cardHeight);
	}

}

/* Selection class used to select a single card from an array
draw(): draws a bounding box on the selected card
index(): returns the index of the card selected
*/
function Selection(event, overlay){
	this.overlay = overlay;
	this.event = event;
	this.cardWidth = cardWidth;
	this.cardHeight = cardHeight;
	this.selected = -1;
	this.maxCards = 5; //Width of the hand canvas

}

Selection.prototype.reset = function(){
	this.selected = -1;
}

Selection.prototype.index = function(){
	var rect = this.overlay.getBoundingClientRect();
	var ctx = this.overlay.getContext("2d");

	//Get relative position of cursor
	var x = event.pageX - rect.left - $(window).scrollLeft();
	var y = event.pageY - rect.top - $(window).scrollTop();
	var col = Math.floor(x / this.cardWidth);	
	var row = Math.floor(y / this.cardHeight);

	var num = row * 4 + col;
	return num;
}

Selection.prototype.draw = function(t, length){
	//Set max cards in a row
	if (t >= 2){
		this.maxCards = 4;
	} 
	var rect = this.overlay.getBoundingClientRect();
	var ctx = this.overlay.getContext("2d");

	ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
	//Get relative position of cursor
	var x = event.pageX - $(window).scrollLeft() - rect.left;
	var y = event.pageY - $(window).scrollTop() - rect.top;
	var width = Math.min(this.cardWidth, this.maxCards * this.cardWidth / (length / t));
	var col = Math.floor(x / width);	
	var row = Math.floor(y / cardHeight);

	var num;
	if (t >= 2){
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
			ctx.lineTo(col * width, row * this.cardHeight + this.cardHeight);
			ctx.lineTo((col + 1) * width, row * this.cardHeight + this.cardHeight);
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
				ctx.lineTo(col * width, row * this.cardHeight + this.cardHeight);
				ctx.lineTo((col + 1) * width, row * this.cardHeight + this.cardHeight);
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
	this.cardWidth = cardWidth;
	this.cardHeight = cardHeight;
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
	var x = event.pageX - offsetLeft + $("#dialog").scrollLeft();
	var col = Math.floor(x / this.cardWidth);
	console.log(event.pageX);
	console.log(offsetLeft);
	
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