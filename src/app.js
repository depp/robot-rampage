/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var input = require('./input');
var param = require('./param');
var game = require('./game');
var hud = require('./hud');

// The requestAnimationFrame handle.
var handle;
// The three.js renderer.
var renderer;
// Timestamp of the last physics update.
var updateTime;
// The state of the current game.
var gameState;
// The HUD object.
var hudObj;

function init(path_map, container) {
	load.init(path_map, function() {
		var WIDTH = 800, HEIGHT = 450;

		hudObj = new hud.HUD(WIDTH, HEIGHT);
		hudObj.canvas.className = 'layer2';
		container.appendChild(hudObj.canvas);
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(WIDTH, HEIGHT);
		renderer.domElement.className = 'layer1';
		container.appendChild(renderer.domElement);
		gameState = new game.Game(WIDTH, HEIGHT);
		input.init();
		start();
	});
}

// Start the main game loop.
function start() {
	if (handle) {
		return;
	}
	updateTime = -1;
	handle = window.requestAnimationFrame(render);
}

// Stop the main game loop.
function stop() {
	if (!handle) {
		return;
	}
	window.cancelAnimationFrame(handle);
	handle = null;
}

// Draw the game state, updating it if necessary.
function render(time) {
	hudObj.clear();
	var cxt = hudObj.cxt;
	cxt.font = 'bold 24px sans';
	cxt.fillStyle = 'white';
	cxt.fillText('Hello, world', 10, 30);
	var dt = param.DT * 1e3, rate = param.RATE * 1e-3;
	handle = window.requestAnimationFrame(render);
	var updateCount = 0, i;
	if (updateTime < 0) {
		updateTime = time;
		updateCount = 1;
	} else if (time >= updateTime + dt) {
		if (time > updateTime + param.MAX_UPDATE_INTERVAL * 1e3) {
			console.warn('Lag');
			updateCount = 1;
			updateTime = time;
		} else {
			updateCount = Math.floor((time - updateTime) * rate);
			updateTime += dt * updateCount;
		}
	}
	for (i = 0; i < updateCount; i++) {
		gameState.update();
	}
	var frac = (time - updateTime) * rate;
	gameState.draw(renderer, frac);
}

window.Game = {
	init: init,
	start: start,
	stop: stop,
};
