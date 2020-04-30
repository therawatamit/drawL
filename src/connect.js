const socket = io.connect('192.168.2.10:8080', {
	'force new connection': true,
	reconnectionAttempts: 'Infinity',
	timeout: 10000,
	transports: ['websocket'],
});
