//Partile effects, from https://github.com/hunterloftis/playfuljs-demos/blob/gh-pages/particles/index.html
var DAMPING = 0.75;
var particles = [];
var impParticles = [];

function Particle(x, y, vx, vy, theta) {
    this.x = this.oldX = x;
    this.y = this.oldY = y;
    //Velocities
    this.vx = vx;
    this.vy = vy;
    this.theta = theta;
}

//Goes out in direction of theta and fades
Particle.prototype.disperse = function() {
    this.vx *= DAMPING;
    this.vy *= DAMPING;
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += this.vx * Math.cos(this.theta);
    this.y += this.vy * Math.sin(this.theta);
};

Particle.prototype.draw = function(ctx, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(this.oldX, this.oldY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
};


//Placing encampment tiles 
function drawPlacement(shape, a, b, color, timestamp, duration){
	var timestamp = timestamp || new Date().getTime();
    var runtime = timestamp - starttime;
    var progress = runtime / duration;
    progress = Math.min(progress, 1);
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");


	for (var i = 0; i < shape.length; i++){
		var hex = new Hex(a + shape[i][0], b + shape[i][1], hexLength * progress);
		hex.draw(centerX, centerY, color, 3, 1.0, ctx);
	}
	
	if (runtime < duration){ // if duration not met yet
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            drawPlacement(shape, a, b, color, timestamp, duration);
        });
    } else {
    	drawField();
    }
}

//Placing improvements
function drawImp(shape, a, b, imp, timestamp, duration){
	var timestamp = timestamp || new Date().getTime();
    var runtime = timestamp - starttime;
    var progress = runtime / duration;
    progress = Math.min(progress, 1);
	var canvas = document.getElementById("field_overlay");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var letters = ['A', 'F', 'C', 'P'];
	var radius = blockLength / 4;

	for (var i = 0; i < shape.length; i++){
		var hex = new Hex(a + shape[i][0], b + shape[i][1], hexLength);
		var x = hex.getX(centerX, centerY);
    	var y = hex.getY(centerX, centerY) - (2 * hexLength * (1 - progress));		
		
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "gray";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
        ctx.fillStyle = "black";
        
        ctx.font = 'bold 18px arial';
		ctx.fillText(letters[imp - 1], x - 6, y + 7);
	}
	
	if (runtime < duration){ // if duration not met yet
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            drawImp(shape, a, b, imp, timestamp, duration);
        });
    } else {
    	drawField();
    }
}

//Destructin of tile
function destruction(shape, a, b, arr){
    particles = [];
    for (var i = 0; i < shape.length; i++) {    
        var x = a + shape[i][0];
        var y = b + shape[i][1];
        if (field.hasOwnProperty([[x, y]])){
            var hex = new Hex(x, y, hexLength);
            var px = hex.getX(centerX, centerY);
            var py = hex.getY(centerX, centerY);
            if (arr[i] != 0){
                for (var i = 0; i < 100; i++) {
                    particles.push(new Particle(px, py, Math.random() * 20 + 30, Math.random() * 20 + 30, Math.random() * 2 * Math.PI));
                }
            }
        }       
    }
    if (particles.length > 0){
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            starttime = timestamp || new Date().getTime(); 
            for (var i = 0; i < arr.length; i++){
                destructionAnim(a, b, colors[arr[i]], timestamp, 800); //Draw animation over 800 millisecs
            }
            
        });
    }    
}

//Destruction of improvement
function destructionImp(shape, a, b, arr){
    impParticles = [];
    for (var i = 0; i < shape.length; i++) {    
        var x = a + shape[i][0];
        var y = b + shape[i][1];
        if (field.hasOwnProperty([[x, y]])){
            var hex = new Hex(x, y, hexLength);
            var px = hex.getX(centerX, centerY);
            var py = hex.getY(centerX, centerY);
            if (arr[i] != 0){
                for (var i = 0; i < 100; i++) {
                    impParticles.push(new Particle(px, py, Math.random() * 10 + 10, Math.random() * 10 + 10, Math.random() * 2 * Math.PI));
                }
            }
        }       
    }
    if (impParticles.length > 0){
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            starttime = timestamp || new Date().getTime(); 
            for (var i = 0; i < arr.length; i++){
                if (arr[i] > 0){
                    destructionImpAnim(a, b, "#FF4500", timestamp, 1500); //Draw animation over 800 millisecs 
                } 
            }        
            
        });
    }    
}

//Destruction of a tile (and/or improvements)
function destructionAnim(a, b, color, timestamp, duration){
    var timestamp = timestamp || new Date().getTime();
    var runtime = timestamp - starttime;
    var progress = runtime / duration;
    progress = Math.min(progress, 1);
    var canvas = document.getElementById("field_overlay_2");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++){
        particles[i].disperse();
        ctx.globalAlpha = 1.0 - progress;
        particles[i].draw(ctx, color, 4);
    }

    if (runtime < duration){ // if duration not met yet
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            destructionAnim(a, b, color, timestamp, duration);
        });
    } else {
        particles = [];
    }
}

//Destruction of a tile (and/or improvements)
function destructionImpAnim(a, b, color, timestamp, duration){
    var timestamp = timestamp || new Date().getTime();
    var runtime = timestamp - starttime;
    var progress = runtime / duration;
    progress = Math.min(progress, 1);
    var canvas = document.getElementById("field_overlay");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //ctx.globalAlpha = 0.7;

    for (var i = 0; i < impParticles.length; i++){
        impParticles[i].disperse();
        ctx.globalAlpha = 1.0 - progress;
        impParticles[i].draw(ctx, color, 8);
    }

    if (runtime < duration){ // if duration not met yet
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            destructionImpAnim(a, b, color, timestamp, duration);
        });
    } else {
        impParticles = [];
    }
}

//Flying cards
function cardAnim(callback, args){
    return function flyingCard(obj, oldX, oldY, newX, newY, timestamp, duration){
        var timestamp = timestamp || new Date().getTime();
        var runtime = timestamp - starttime;
        var progress = runtime / duration;
        progress = Math.min(progress, 1);
        var canvas = document.getElementById("flying_card");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        
        obj.drawImg(ctx, (newX - oldX) * progress + oldX, (newY - oldY) * progress + oldY, cardWidth, cardHeight);
        
        if (runtime < duration){ // if duration not met yet
            requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
                flyingCard(obj, oldX, oldY, newX, newY, timestamp, duration)
            });
        } else {
            callback.apply(this, args); //Call whatever the callback function is
        }
    }
}

function toDiscard(active, discard, arr, timestamp, duration){
    var timestamp = timestamp || new Date().getTime();
    var runtime = timestamp - starttime;
    var progress = runtime / duration;
    progress = Math.min(progress, 1);
    var canvas = document.getElementById("flying_card");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    var newX = $("#discard").offset().left;
    var newY = $("#discard").offset().top;
    if (!active){
        newX = $("#opp_discard").offset().left;
        newY = $("#opp_discard").offset().top;
    }
    
    for (var i = 0; i < arr.length; i++){
        var oldX = $("#playarea").offset().left; 
        var oldY = $("#playarea").offset().top + (i * 50);
        cards[arr[i].ind].drawImg(ctx, (newX - oldX) * progress + oldX, (newY - oldY) * progress + oldY, cardWidth, cardHeight);
    }
    
    
    if (runtime < duration){ // if duration not met yet
        requestAnimationFrame(function(timestamp){ // call requestAnimationFrame again with parameters
            toDiscard(active, discard, arr, timestamp, duration);
        });
    } else {
        for(var i = arr.length - 1; i > 0; i--){
            var v = arr[i];
            if (v.name === "Trojan"){
                arr.splice(i , 1);
            }
           
        }
        discard.push.apply(discard, arr);
        if (active){
            if (arr.length > 0){
                socket.emit("toDiscard", {room: currentRoom, play: arr});
                drawDiscard(discard[discard.length - 1]); 
                //Empty playarea
                playarea = [];  
                drawPlay(playarea);
            }
            
            sendStatus();
            showStatus();
            canvas = document.getElementById("field_overlay");
            ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            //Disable buttons
            turn = 2; //Discard phase

            disableButtons();

            if (hand.length <= 5){
                //Draw back up to 5
                draw(5 - hand.length, 0);
                //Hand turn to next player
                turn = 0;
                //Empty the credits 
                budget = 0;     
                disableButtons();
                var text ="---------------------- <br>";
                updateScroll(text);
                socket.emit("upkeep", currentRoom);         
            }
        } else {
            var canvas = document.getElementById("opp_discard");
            var ctx = canvas.getContext("2d");
            if (discard.length > 0){
                cards[discard[discard.length - 1].ind].drawImg(ctx, 0, 0, cardWidth, cardHeight);
            } else {
                //Reset opp_discard
                ctx.fillStyle = "gray";
                ctx.fillRect(0, 0, cardWidth, cardHeight);
                ctx.font = "30px serif";
                ctx.strokeText("Opponent's", 10, 50);
                ctx.strokeText("discard", 10, 100);
            }
            canvas = document.getElementById("playarea");
            ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
    }
}