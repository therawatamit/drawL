const { words } = require('./config.json');
/* eslint-disable no-var */
var express = require('express'),
	app = express(),
	http = require('http'),
	socketIo = require('socket.io')(server, {
		handlePreflightRequest: (req, res) => {
			const headers = {
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Allow-Origin': req.headers.origin,
				'Access-Control-Allow-Credentials': true,
			};
			res.writeHead(200, headers);
			res.end();
		},
	});

var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);
app.use(express.static(__dirname + '/client'));
console.log('Server');

const userList = {};
let line_history = [];
let scoreList = [];
let round = 0;
let roundScore = 500;
let userCount = 0;
let turnIndex = -1;
let status = 0;
var timeTimeout = 0,
	timeTime = 0;
let currSocket = 0;
var countDownDate = new Date().getTime(),
	countDownDate1 = 0;
let chosenWord = 'dog';
let wordlist = [];
let chatEnable = true;

const timed = function() {
	var now = new Date().getTime();
	var distance = countDownDate - now;
	var seconds = Math.floor((distance % (1000 * 60)) / 1000);
	io.emit('time', seconds);
	if (distance < 1000) {
		console.log('interval');
		io.emit('time', 0);
		clearTimeout(timeTimeout);
		endRound();
	} else {
		timeTimeout = setTimeout(timed, 1000);
	}
};

const wait = function() {
	console.log('did');
	var now = new Date().getTime();
	var distance = countDownDate1 - now;
	var seconds = Math.floor((distance % (1000 * 60)) / 1000);
	console.log(seconds);
	io.emit('time', seconds);
	if (seconds <= 0) {
		console.log('interval');
		io.emit('time', 0);
		chosenWord = wordlist[Math.floor(Math.random() * wordlist.length)];
		startRound();
	} else {
		timeTime = setTimeout(wait, 1000);
	}
};

const gameStart = function() {
	turnIndex = -1;
	round = 0;
	nextRound();
};

const nextRound = function() {
	console.log('reach');
	if (turnIndex == userCount - 1) {
		if (round < 2) {
			round = round + 1;
		} else {
			round = 0;
			gameEnd(0);
			return;
		}
		turnIndex = 0;
		console.log('round update');
	} else {
		turnIndex += 1;
	}
	if (
		io.sockets &&
		io.sockets.adapter &&
		io.sockets.adapter.rooms &&
		io.sockets.adapter.rooms.room1 &&
		status == 1
	) {
		for (var sock in io.sockets.adapter.rooms.room1.sockets) {
			if (
				io.sockets.sockets[sock].username ==
				Object.entries(userList)[turnIndex][0]
			) {
				currSocket = io.sockets.sockets[sock];
			}
		}

		console.log('reach here');
		roundScore = 500;
		scoreList = [];
		line_history = [];
		io.emit('draw_line', { line: 'clear' });
		console.log(io.sockets + '\n' + currSocket);
		io.emit('round', round + 1);
		scoreList.push({ name: currSocket.username });
		wordlist = words.sort(() => 0.5 - Math.random()).slice(0, 3);
		currSocket.emit('sticky', {
			choose: { word1: wordlist[0], word2: wordlist[1], word3: wordlist[2] },
		});
		currSocket.broadcast.emit('sticky', {
			letchoose: 1,
			user: currSocket.username,
		});
		countDownDate1 = new Date().getTime() + 5000;
		chatEnable = false;
		userList[currSocket.username].current = 1;
		console.log(userList);
		io.emit('userlist', userList);
		wait();
	} else {
		gameEnd(1);
	}
};

const startRound = function() {
	currSocket.emit('sticky', { word: chosenWord });
	currSocket.broadcast.emit('sticky', {
		word: chosenWord.replace(/[a-z]/gi, '_'),
	});
	currSocket.join('room2');
	chatEnable = true;
	countDownDate = new Date().getTime() + 60000;
	timeTimeout = setTimeout(timed, 1000);
};

const scoreAdd = function() {
	scoreList.forEach((score) => {
		if (score.name == userList[currSocket.username].name) {
			userList[score.name].score -= 350;
		}
		userList[score.name].score += roundScore;
		roundScore = Math.floor(roundScore * (Math.random() * 0.1 + 0.7));
	});
	calculateRank();
};

const calculateRank = function() {
	for ([key, value] of Object.entries(userList)) {
		userList[key].rank = 0;
	}
	const arr = Object.entries(userList);
	for (let i = 0; i < arr.length; i += 1) {
		for (let j = 0; j <= i; j++) {
			if (arr[j][1].score <= arr[i][1].score) {
				userList[arr[j][1].name].rank += 1;
			} else {
				userList[arr[i][1].name].rank += 1;
			}
		}
		console.log(arr[i][1]);
	}
};

const endRound = function() {
	io.in('room2').clients((error, sockeIds) => {
		if (error) throw error;
		sockeIds.forEach((sockeId) => {
			if (io.sockets.sockets[sockeId]) {
				return io.sockets.sockets[sockeId].leave('room2');
			}
		});
	});
	scoreAdd();
	io.emit('userlist', userList);
	delete userList[currSocket.username].current;
	nextRound();
};

const gameEnd = function(i) {
	scoreList.forEach((score) => {
		if (userList[score.name]) userList[score.name].score = 0;
	});
	round = 0;
	turnIndex = -1;
	status = 0;
	roundScore = 500;
	scoreList = [];
	line_history = [];
	io.emit('draw_line', { line: 'clear' });
	io.emit('userlist', userList);
	clearTimeout(timeTimeout);
	clearTimeout(timeTime);
	io.emit('time', 0);
	io.emit('round', round + 1);
	if (i == 0) {
		io.emit('gameover', { name: Object.entries(userList)[0][1].name });
	} else {
		io.emit('sticky', { wait: 1 });
	}
	console.log('end');
};

const checkMsg = function(chat, user) {
	if (
		chat
			.toLowerCase()
			.replace(/[\s.\\/,+\-'";:><|=\][{}()*&^%$#@!~`1234567890?]+/g, '') ==
		chosenWord.replace(/[\s.\\/,+\-'";:><|=\][{}()*&^%$#@!~`1234567890?]+/g, '')
	) {
		scoreList.push({ name: user.name });
		return {
			chat: user.name + ' guessed the word!',
			user: {
				name: 'Admin',
			},
			accent: 'green',
		};
	} else {
		return {
			chat: chat,
			user: user.name,
			accent: user.accent,
		};
	}
};

io.on('connection', function(socket) {
	// console.log(Object.keys(io.sockets.sockets));
	let useradd = false;
	socket.on('add user', (user, created) => {
		if (useradd) return;
		if (!(user.name in userList)) {
			userList[user.name] = user;
			userCount += 1;
			console.log(userList);
			socket.username = user.name;
			useradd = true;
			created(true);
			io.emit('userlist', userList);
			io.emit(
				'chat',
				user.name + ' has joined the room!',
				{ name: 'Admin' },
				user.accent,
			);
			socket.join('room1');
			line_history.forEach((line) => {
				socket.emit('draw_line', { line: line });
			});
			if (!status && userCount > 1) {
				status = 1;
				gameStart();
			} else if (userCount < 2) {
				io.emit('sticky', { wait: 1 });
			}
		} else {
			created(false);
		}
	});

	socket.on('chat', (chat) => {
		if (chatEnable) {
			console.log(socket.rooms);
			console.log(io.sockets.adapter.rooms['room2'] + '\n' + userCount);
			if (socket.rooms.room2) {
				const msgComp = checkMsg('👻' + chat, userList[socket.username]);
				io.to('room2').emit('chat', msgComp.chat, msgComp.user, msgComp.accent);
			} else {
				const msgComp = checkMsg(chat, userList[socket.username]);
				io.to('room1').emit('chat', msgComp.chat, msgComp.user, msgComp.accent);
				if (msgComp.user.name) {
					socket.join('room2');
				}
				if (
					io.sockets.adapter.rooms['room2'] &&
					io.sockets.adapter.rooms['room2'].length == userCount
				) {
					endRound();
					clearTimeout(timeTimeout);
					io.emit('time', 0);
				}
			}
		}
	});

	socket.on('choose', (word) => {
		if (socket.username == Object.entries(userList)[turnIndex][0]) {
			chosenWord = word;
			clearTimeout(timeTime);
			startRound();
		}
	});

	socket.on('regame', () => {
		if (socket.username == Object.entries(userList)[0][1].name) {
			if (userCount > 1 && !status) {
				status = 1;
				gameStart();
			}
		}
	});

	socket.on('draw_line', function(data) {
		if (
			!(turnIndex < 0) &&
			Object.entries(userList)[turnIndex][0] == socket.username
		) {
			line_history.push(data.line);
			io.emit('draw_line', { line: data.line });
		}
	});

	socket.on('clear', () => {
		line_history = [];
		io.emit('draw_line', { line: 'clear' });
	});

	socket.on('disconnect', () => {
		delete userList[socket.username];
		socket.leave('room1');
		io.emit('userlist', userList);
		userCount = Object.keys(userList).length;
		console.log(userCount);
		if (userCount < 2) {
			gameEnd(1);
		}
		console.log(userList);
	});
});

/*
var countDownDate = new Date().getTime()+52000;
var x = setTimeout(function() {
  var now = new Date().getTime();
  var distance = countDownDate - now;
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);
  if (distance < 0) {
    clearTimeout(x);
  }
}, 1000);

*/
