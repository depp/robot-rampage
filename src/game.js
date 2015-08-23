/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var robot = require('./robot');

// Game state class.
function Game(width, height) {
	this.scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
	camera.setLens(45);
	camera.position.set(0, -16, 16);
	camera.up.set(0, 0, 1);
	camera.lookAt(new THREE.Vector3(0, 0, 2.5));
	this.camera = camera;

	var light = new THREE.PointLight(0xafafff);
	light.position.set(0, 10, 10);
	this.scene.add(light);
	light = new THREE.PointLight(0xffafaf);
	light.position.set(10, 0, 10);
	this.scene.add(light);
	light = new THREE.PointLight(0x3fff3f);
	light.position.set(-10, -10, 10);
	this.scene.add(light);

	this.robot = new robot.Robot();
	this.scene.add(this.robot.obj);
}

// Advance world by one frame.
Game.prototype.update = function() {
	this.robot.update(this);
};

// Update graphics.
Game.prototype.draw = function(renderer, frac) {
	this.robot.draw(frac);
	renderer.render(this.scene, this.camera);
};

module.exports = {
	Game: Game,
};
