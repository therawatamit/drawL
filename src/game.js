const slider = document.querySelector(':root');
const colors = document.querySelectorAll('.color');
const tool = new Tool('Black', 18);
const toolSize = document.querySelector('#color-preview');
const board = document.querySelector('#canvas');
const clr = document.querySelector('#clear');
let boardsize = getComputedStyle(board).width.slice(0, -2) / 800;

console.log(toolSize);

const setBrush = function(size, color) {
	const r = +size * boardsize + 1;
	board.style.setProperty(
		'--type',
		'url("data:image/svg+xml, %3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'' +
			r * 2 +
			'px\' width=\'' +
			r * 2 +
			'px\'%3E%3Ccircle cx=\'' +
			r +
			'px\' cy=\'' +
			r +
			'px\' r=\'' +
			size * boardsize +
			'px\' stroke=\'black\' stroke-width=\'1px\' fill=\'' +
			color +
			'\' /%3E%3C/svg%3E ") ' +
			r +
			' ' +
			r +
			',auto',
	);
};

const size = function() {
	boardsize = getComputedStyle(board).width.slice(0, -2) / 800;
	setBrush(tool.size / 2, tool.color);
	slider.style.setProperty('--slider-size', tool.size * boardsize + 'px');
	document
		.querySelector('#player-list')
		.style.setProperty('max-height', getComputedStyle(board).height);
	document
		.querySelector('#chat')
		.style.setProperty('max-height', getComputedStyle(board).height);
};

colors.forEach((color) => {
	color.addEventListener('click', () => {
		console.log(color);
		tool.color = color.style.backgroundColor;
		slider.style.setProperty('--slider-color', tool.color);
		setBrush(tool.size / 2, tool.color);
	});
});

toolSize.addEventListener('input', () => {
	console.log(toolSize.value);
	tool.size = toolSize.value;
	slider.style.setProperty('--slider-size', tool.size * boardsize + 'px');
	setBrush(tool.size / 2, tool.color);
});

clr.addEventListener('click', () => {
	socket.emit('clear');
});

window.onresize = function() {
	console.log(boardsize);
	size();
};
