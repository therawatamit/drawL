const playerlist = document.querySelector('#player-list');
const chatbox = document.querySelector('#chat-input');
const chatlist = document.querySelector('#chat-list');
const ctx = board.getContext('2d');
const gameSticky = document.querySelector('#game-sticky');
const gameWord = document.querySelector('#game-container-sticky');
const currentWord = document.querySelector('.current-word');

socket.on('userlist', (userList) => {
	playerlist.innerHTML = '';
	console.log(userList);
	let current = '';

	for (users in userList) {
		console.log(users);
		if (userList[users].current == 1) {
			current = 'style="--current:\'  🖊  \';"';
		}
		const elem = document.createElement('li');
		elem.innerHTML =
			'<div class=\'player-details\' ' +
			current +
			'><span class=\'player-name\' style="color:' +
			userList[users].accent +
			';">' +
			userList[users].name +
			'</span><span class=\'player-score\'>' +
			userList[users].score +
			' points</span></div><span class="player-rank" style="color: #ffd700">#' +
			userList[users].rank +
			'</span>';
		playerlist.appendChild(elem);
		current = '';
	}
});

chatbox.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		socket.emit('chat', chatbox.value);
		chatbox.value = '';
	}
});

socket.on('chat', (chat, username, color) => {
	console.log(chat);
	let b = ['', ''];
	if (username != null && color != null) {
		const elem = document.createElement('li');
		elem.innerHTML = '<font color="' + color + '">';
		if (!username.name) {
			elem.innerHTML += '<b>' + username + ': </b>';
		} else {
			b = ['<b style="color:' + color + '">', '</b>'];
		}
		elem.innerHTML += '</font><span>' + b[0] + chat + b[1] + '</span>';
		chatlist.appendChild(elem);
	}
	if (chatlist.childElementCount > 150) {
		const remch = document.querySelectorAll('#chat-list li');
		for (let i = 0; i < 50; i += 1) {
			remch[i].remove();
		}
	}
	document
		.querySelector('.chat-body')
		.scrollTo(0, document.querySelector('.chat-body').scrollHeight);
});

socket.on('time', (value) => {
	document.querySelector('#clock').innerHTML = value;
});

socket.on('round', (value) => {
	document.querySelector('#round').innerHTML = value;
});

socket.on('sticky', (obj) => {
	if (obj.word) {
		currentWord.style.setProperty('position', 'relative');
		gameWord.classList.add('word');
		gameSticky.innerHTML =
			'<font style="letter-spacing: 6px; margin-left: 5px" color="#eee">' +
			obj.word +
			'</font';
	} else {
		currentWord.style.setProperty('position', 'absolute');
		gameWord.classList.remove('word');
	}
	if (obj.wait) {
		gameSticky.innerHTML =
			'<b style="pointer-events:none" id="wait">Wait for other players</b>';
	}
	if (obj.choose) {
		gameSticky.innerHTML =
			'<b style="pointer-events: none">Choose a word to draw:</b>	<button type="button" onclick="choose(\'' +
			obj.choose.word1 +
			'\');">' +
			obj.choose.word1 +
			'</button> <button type="button" onclick="choose(\'' +
			obj.choose.word2 +
			'\');">' +
			obj.choose.word2 +
			'</button><button type="button" onclick="choose(\'' +
			obj.choose.word3 +
			'\');">' +
			obj.choose.word3 +
			'</button>';
	}
	if (obj.letchoose) {
		gameSticky.innerHTML = '<b>' + obj.user + ' is choosing a word</b>';
	}
});

socket.on('gameover', (u) => {
	currentWord.style.setProperty('position', 'absolute');
	gameWord.classList.remove('word');
	if (u.name == user.name) {
		gameSticky.innerHTML =
			'<button type="button" onclick="regame()">Start!</button>';
	} else {
		gameSticky.innerHTML =
			'<b> Waiting for ' + u.name + ' to start the game</b>';
	}
});

const regame = function() {
	socket.emit('regame');
};

const choose = function(word) {
	socket.emit('choose', word);
};

const draw = function(data) {
	const line = data.line;
	ctx.save();
	ctx.beginPath();
	ctx.lineJoin = 'round';
	ctx.strokeStyle = line[4];
	ctx.lineWidth = line[5];
	ctx.moveTo(
		(line[0] * board.width) / boardsize,
		(line[1] * board.height) / boardsize,
	);
	ctx.lineTo(
		(line[2] * board.width) / boardsize,
		(line[3] * board.height) / boardsize,
	);
	ctx.closePath();
	ctx.stroke();
	ctx.restore();
};

const init = function() {
	board.addEventListener(
		'mousemove',
		(e) => {
			findxy('move', e);
		},
		false,
	);
	board.addEventListener(
		'mousedown',
		(e) => {
			findxy('down', e);
		},
		false,
	);
	board.addEventListener(
		'mouseup',
		(e) => {
			findxy('up', e);
		},
		false,
	);
	board.addEventListener(
		'mouseout',
		(e) => {
			findxy('out', e);
		},
		false,
	);
};

findxy = function(res, e) {
	if (res == 'down') {
		tool.flag = true;
	}
	if (res == 'up' || res == 'out') {
		tool.flag = false;
	}
	if (res == 'move') {
		tool.currX = (e.clientX - board.getBoundingClientRect().left) / board.width;
		tool.currY = (e.clientY - board.getBoundingClientRect().top) / board.height;
		tool.move = true;
	}
};

init();
socket.on('draw_line', (data) => {
	if (data.line !== 'clear') draw(data);
	else ctx.clearRect(0, 0, board.width, board.height);
});

(function mainLoop() {
	if (tool.flag && tool.move && tool.prevX && tool.prevY) {
		socket.emit('draw_line', {
			line: [
				tool.prevX,
				tool.prevY,
				tool.currX,
				tool.currY,
				tool.color,
				tool.size,
			],
		});
		tool.move = false;
	}
	tool.prevX = tool.currX;
	tool.prevY = tool.currY;
	setTimeout(mainLoop, 1);
})();
