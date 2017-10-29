//Hexagon object
function Hex(a, b, size) {  
  this.a = a;
  this.b = b;
  this.size = size;
  this.intAngle = Math.PI / 3.0;
  this.blockDist = this.size * Math.sqrt(3);
  this.addOn = 0;
  this.num = 0; //Neutral or belonging to one of the players
  this.effects = [];
  //+a means angle of 0, +b means angle of -pi/3;
}

//Add improvement
Hex.prototype.add = function(n) { 
	this.addOn = n;
}

//Destroy improvement
Hex.prototype.clear = function(n) { 
	this.addOn = 0;
}

Hex.prototype.getX = function(centerX, centerY) { 
	return (this.a + (this.b / 2)) * blockDist + centerX;
}

Hex.prototype.getY = function(centerX, centerY) { 
	return (this.b * 1.5 * hexLength) + centerY;
}

Hex.prototype.draw = function(centerX, centerY, color, strokeWidth, alpha, ctx) {  
	var x = this.getX(centerX, centerY);
	var y = this.getY(centerX, centerY);

	var tempX = x + (this.blockDist / 2);
	var tempY = y + (this.size / 2);
	ctx.globalAlpha = alpha;
  	ctx.beginPath();
	ctx.moveTo(tempX, tempY);
	/*Idea is to first draw the shape at (0, 0),
	rotate it by theta, and then translate it
	back to (x, y) */
	for(i = 0; i < 6; i++){
		var dx = this.size * Math.cos(Math.PI / 2 + (i * this.intAngle));
		var dy = -this.size * Math.sin(Math.PI / 2 + (i * this.intAngle));
		tempX += dx;
		tempY += dy;
		ctx.lineTo(tempX, tempY);
			
	}	
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
	ctx.strokeStyle = 'black';
	ctx.lineWidth = strokeWidth;
    ctx.stroke();
	/*
    ctx.fillStyle = "black";
	ctx.font = "bold 16px Arial";
	var string = this.a + ", " + this.b;
	ctx.fillText(string, x, y); //Coord
	*/

};

Hex.prototype.drawThick = function(centerX, centerY, ctx) {  
	var x = this.getX(centerX, centerY);
	var y = this.getY(centerX, centerY);

	var tempX = x + (this.blockDist / 2);
	var tempY = y + (this.size / 2);
  	ctx.beginPath();
	ctx.moveTo(tempX, tempY);
	/*Idea is to first draw the shape at (0, 0),
	rotate it by theta, and then translate it
	back to (x, y) */
	for(i = 0; i < 6; i++){
		var dx = this.size * Math.cos(Math.PI / 2 + (i * this.intAngle));
		var dy = -this.size * Math.sin(Math.PI / 2 + (i * this.intAngle));
		tempX += dx;
		tempY += dy;
		ctx.lineTo(tempX, tempY);			
	}	
	ctx.closePath();
	ctx.fillStyle = "#FFA07A";
	ctx.fill();
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 3;
    ctx.stroke();
};

Hex.prototype.drawEffects = function(centerX, centerY, ctx, colors) {  
	var x = this.getX(centerX, centerY);
	var y = this.getY(centerX, centerY);

	var tempX = x + (this.blockDist / 2);
	var tempY = y + (this.size / 2);
  	
	/*Idea is to first draw the shape at (0, 0),
	rotate it by theta, and then translate it
	back to (x, y) */
	for(i = 0; i < 6; i++){
		ctx.beginPath();
		ctx.moveTo(tempX, tempY);
		var dx = this.size * Math.cos(Math.PI / 2 + (i * this.intAngle));
		var dy = -this.size * Math.sin(Math.PI / 2 + (i * this.intAngle));
		tempX += dx;
		tempY += dy;
		ctx.lineTo(tempX, tempY);	
		ctx.closePath();
		ctx.strokeStyle = colors[i % colors.length];
		ctx.lineWidth = 3;
	    ctx.stroke();		
	}	
	
};