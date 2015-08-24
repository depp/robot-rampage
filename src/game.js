/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var robot = require('./robot');
var building = require('./building');
var city = require('./city');
var particles = require('./particles');
var camera = require('./camera');
var load = require('./load');
var param = require('./param');

// Game state class.
function Game(width, height) {
	this.scene = new THREE.Scene();

	var light;
	light = new THREE.AmbientLight(0x102030);
	this.scene.add(light);
	light = new THREE.DirectionalLight(0x505060);
	light.position.set(1, 1, 1);
	this.scene.add(light);

	this.city = new city.City();
	this.scene.add(this.city.obj);

	this.robot = new robot.Robot(this.city.playerStart);
	this.scene.add(this.robot.obj);

	this.particles = new particles.ParticleSystem();
	this.scene.add(this.particles.obj);

	this.camera = new camera.Camera(this.robot, width, height);

	this.timeLeft = 120;
	this.weaponIcons = load.getHudImage('weapon-icons');
	this.music = load.getMusic('the-humans-will-burn');
	// this.music.play();
}

// Advance world by one frame.
Game.prototype.update = function() {
	this.timeLeft -= param.DT;
	this.robot.update(this, this.timeLeft > 0);
	this.city.update(this);
	this.particles.update();
	this.camera.update();
};

// http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Draw the HUD.
Game.prototype.drawHud = function(hud) {
	var text, metr;
	var cxt = hud.cxt, w = hud.canvas.width, h = hud.canvas.height;
	hud.clear();
	cxt.fillStyle = 'rgba(255, 255, 255, 0.75)';
	cxt.fillText('Objective: Destroy', 10, 30);
	cxt.fillText(
		'Property Damage: $' + numberWithCommas(this.city.propertyDamage),
		10, h - 10);

	var wstat = param.WEAPON[this.robot.weapon.weapon];
	cxt.drawImage(
		this.weaponIcons,
		wstat.ix * 32, wstat.iy * 32, 32, 32,
		w - 42, h - 42, 32, 32);
	var wtime = this.robot.weapon.time;
	if (wtime !== null) {
		text = Math.max(0, Math.floor(wtime)).toString();
		metr = cxt.measureText(text);
		cxt.fillText(text, w - metr.width - 52, h - 16);
	}

	var sec = Math.floor(Math.max(0, this.timeLeft));
	var min = Math.floor(sec / 60);
	sec -= min * 60;
	sec = '' + sec;
	min = '' + min;
	if (sec.length == 1) {
		sec = '0' + sec;
	}

	if (this.timeLeft <= 0 || this.timeLeft < 10 && (this.timeLeft % 1) > 0.5) {
		cxt.fillStyle = 'rgba(255, 0, 0, 0.75)';
	}
	text = 'Time Remaining: ' + min + ':' + sec;
	metr = cxt.measureText(text);
	cxt.fillText(text, w - metr.width - 10, 30);
};

// Update graphics.
Game.prototype.draw = function(renderer, hud, frac) {
	this.drawHud(hud);
	this.robot.draw(frac);
	this.city.draw(frac);
	this.particles.draw(frac);
	this.camera.draw(frac);
	renderer.render(this.scene, this.camera.camera);
};

module.exports = {
	Game: Game,
};
