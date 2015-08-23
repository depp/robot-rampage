/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var input = require('./input');
var param = require('./param');
var robot = require('./robot');
var building = require('./building');

// The requestAnimationFrame handle.
var handle = null;
// The three.js renderer.
var renderer;
// The three.js scene.
var scene;
// The three.js camera.
var camera;
// The three.js controls.
var controls;
// Timestamp of the last physics update.
var updateTime;

// The robot, a robot.Robot.
var robotObj;

function init(path_map, container) {
	load.init(path_map, function() { init2(container); });
}

function init2(container) {
	var WIDTH = 800, HEIGHT = 450;

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(WIDTH, HEIGHT);
	container.appendChild(renderer.domElement);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
	camera.setLens(45);
	camera.position.set(8, 8, 8);
	camera.up.set(0, 0, 1);
	camera.lookAt(new THREE.Vector3(0, 0, 2.5));

	var light = new THREE.PointLight(0xafafff);
	light.position.set(0, 10, 10);
	scene.add(light);
	light = new THREE.PointLight(0xffafaf);
	light.position.set(10, 0, 10);
	scene.add(light);

	var loader = new THREE.JSONLoader();
	robotObj = new robot.Robot();
	scene.add(robotObj.obj);

	input.init();
	start();
}

function start() {
	if (handle) {
		return;
	}
	updateTime = -1;
	handle = window.requestAnimationFrame(render);
}

function stop() {
	if (!handle) {
		return;
	}
	window.cancelAnimationFrame(handle);
	handle = null;
}

function render(time) {
	var dt = param.DT * 1e3, rate = param.RATE * 1e-3;
	handle = window.requestAnimationFrame(render);
	var updateCount = 0, i;
	if (updateTime < 0) {
		updateTime = time;
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
		robotObj.update();
	}
	var frac = (time - updateTime) * rate;
	robotObj.draw(frac);
	renderer.render(scene, camera);
}

window.Game = {
	init: init,
	start: start,
	stop: stop,
};
