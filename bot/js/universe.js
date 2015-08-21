
var games = {};

function generateCoder() {
	var nameparts = ["mi", "ka", "ur", "te", "la", "sa", "ju", "ho", "ro", "se", "ba", "ti", "an", "dor", "mir", "ith", "eth", "yun"];
	var name = "";
	for(var i=0; i<5; ++i) {
		name += nameparts[Math.floor(Math.random() * nameparts.length)];
	}
	
	var coder = {};
	coder["name"] = name;
	coder["skill"] = Math.random();
	coder["speed"] = Math.random();
	return coder;
}

function initGame(player) {
	games[player] = {};
	games[player]["time"] = 0;
	games[player]["money"] = 0;
	games[player]["coders"] = {};
	games[player]["bugs"] = 0;
	games[player]["code"] = 0;
	
	var coder = generateCoder();
	games[player]["coders"][coder["name"]] = coder;
}

function displayCoders(socket, replyto, player) {
	for(var coder in games[player]["coders"]) {
		var msg = '<h3>' + coder + '</h3>';
		msg += '<p>Skill: ' + Math.floor(100 * games[player]["coders"][coder].skill) + '</p>';
		msg += '<p>Speed: ' + Math.floor(100 * games[player]["coders"][coder].speed) + '</p>';
		socket.emit('chat message', replyto + '|/html ' + msg);
	}
}

handlers.push(
  function (sock, time, channel, replyto, who, what) {
	var cmd = what.split(" ")[0];
	if(cmd == "#start") {
		if(who in games) {
			delete games[who];
		}
		
		initGame(who);
		sock.emit('chat message', replyto + '|' + 'Welcome to universe project simulator! You currently have no code. Try to get your game finished before your studio gets canceled! Good luck!');
		displayCoders(sock, replyto, who);
		return true;
	}
	else {
		
	}
	return false;
  }
);