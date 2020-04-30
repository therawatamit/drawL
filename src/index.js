/* eslint-disable no-undef */
const input = document.querySelector('#nick');
const accents = document.querySelectorAll('.accent');
const playbtn = document.querySelector('#play');
const createbtn = document.querySelector('#create-new');
const status = document.querySelector('#status');
/* eslint-enable no-undef*/
console.log(accents);
input.focus();
const user = new User('', 'white');
accents.forEach((accent) => {
	accent.addEventListener('click', () => {
		console.log(accent);
		user.accent = accent.style.backgroundColor;
		input.style.color = user.accent;
	});
});

playbtn.addEventListener('click', () => {
	user.name = input.value.trim();
	if (user.name) {
		console.log(user.name);
		socket.emit('add user', user, function(isCreated) {
			if (isCreated) {
				status.classList.remove('visible');
				document.querySelector('.login').style.setProperty('display', 'none');
				document.querySelector('.game').style.setProperty('display', 'block');
				size();
			} else {
				status.classList.add('visible');
			}
		});
	}
});

input.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		playbtn.click();
	}
});

createbtn.addEventListener('click', () => {
	user.name = input.value.trim();
	if (user.name) {
		console.log(user.name);
	}
});
