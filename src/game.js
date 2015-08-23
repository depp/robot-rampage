/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var robot = require('./robot');
var city = require('./city');
var particles = require('./particles');
var camera = require('./camera');

// Game state class.
function Game(width, height) {
	this.scene = new THREE.Scene();

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

	var citySeg = new city.CitySegment(null, 32, 32);
	citySeg.obj.position.set(-16, -16, 0);
	this.scene.add(citySeg.obj);

	this.particles = new particles.ParticleSystem();
	this.scene.add(this.particles.obj);

	this.camera = new camera.Camera(this.robot, width, height);
}

// Advance world by one frame.
Game.prototype.update = function() {
	this.robot.update(this);
	this.particles.update();
	this.camera.update();
};

// Update graphics.
Game.prototype.draw = function(renderer, frac) {
	this.robot.draw(frac);
	this.particles.draw(frac);
	this.camera.draw(frac);
	renderer.render(this.scene, this.camera.camera);
};

module.exports = {
	Game: Game,
};
