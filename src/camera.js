/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');

function Parameter(smoothing) {
	this.v0 = new THREE.Vector3();
	this.v1 = new THREE.Vector3();
	this.v2 = new THREE.Vector3();
	this.v3 = new THREE.Vector3();
	this.smoothing = smoothing;
	this.fresh = true;
}

Parameter.prototype.update = function() {
	if (this.fresh) {
		this.v2.copy(this.v3);
		this.v1.copy(this.v3);
		this.v0.copy(this.v3);
		this.fresh = 0;
	} else {
		this.v0.copy(this.v1);
		this.v2.lerp(this.v3, this.smoothing);
		this.v1.lerp(this.v2, this.smoothing);
	}
};

function Camera(robot, width, height) {
	var stat = param.CAMERA;
	this.robot = robot;
	this.fresh = true;
	this.temp = new THREE.Vector3();
	this.target = new Parameter(stat.targetSmooth);
	this.position = new Parameter(stat.positionSmooth);
	this.camera = new THREE.PerspectiveCamera(
		stat.focal, width / height, 0.1, 100);
	this.camera.setLens(45);
	this.camera.up.set(0, 0, 1);
	this.camera.lookAt(new THREE.Vector3(0, 0, 2.5));
}

Camera.prototype.update = function() {
	var stat = param.CAMERA;
	var r = this.robot;
	this.target.v3.set(r.x1, r.y1, 1.25)
		.add(this.temp.copy(r.velocity).multiplyScalar(stat.predictTime));
	var frac = Math.min(1, Math.abs(r.speed) / stat.topSpeed);
	var angle = stat.angle0 + (stat.angle1 - stat.angle0) * frac;
	var dist = stat.distance0 + (stat.distance1 - stat.distance0) * frac;
	this.position.v3.copy(this.target.v3)
		.add(this.temp.set(0, dist * -Math.cos(angle), dist * Math.sin(angle)));
	this.target.update();
	this.position.update();
};

Camera.prototype.draw = function(frac) {
	this.camera.position.lerpVectors(
		this.position.v0, this.position.v1, frac);
	this.camera.lookAt(
		this.temp.lerpVectors(this.target.v0, this.target.v1, frac));
};

module.exports = {
	Camera: Camera,
};
