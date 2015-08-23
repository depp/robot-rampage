/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

function init() {
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);
}

// Which keys are down.
var keysDown = {};

var KEYS = {
	9: 'tab',
  13: 'enter',
  27: 'escape',
	32: 'space',
	37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
};

// Map a key code to its name.
function mapKey(code) {
	if (code >= 48 && code <= 57 || code >= 65 && code <= 90) {
		return String.fromCharCode(code);
	}
	return KEYS[code] || null;
}

// Handle the key down event.
function handleKeyDown(e) {
	var key = mapKey(e.keyCode);
	if (!key) {
		return;
	}
	e.preventDefault();
	keysDown[key] = true;
	return false;
}

// Handle the key up event.
function handleKeyUp(e) {
	var key = mapKey(e.keyCode);
	if (!key) {
		return;
	}
	e.preventDefault();
	delete keysDown[key];
	return false;
}

// Get the 2D movement direction, an [x, y] point inside the unit cirle.
function getMove() {
	var x0 = keysDown.left || keysDown.A;
	var x1 = keysDown.right || keysDown.D;
	var y0 = keysDown.down || keysDown.S;
	var y1 = keysDown.up || keysDown.W;
	var x = (x1 ? 1 : 0) + (x0 ? -1 : 0);
	var y = (y1 ? 1 : 0) + (y0 ? -1 : 0);
	var mag2 = x * x + y * y;
	if (mag2 > 1) {
		var fac = 1.0 / Math.sqrt(mag2);
		x *= fac;
		y *= fac;
	}
	console.log(x, y);
}

module.exports = {
	init: init,
	getMove: getMove,
};
