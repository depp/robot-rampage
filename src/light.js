/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');

// Dynamic light class.
function Light() {
	this.obj = new THREE.PointLight(0xffffff);
	this.obj.distance = 15;
	this.obj.intensity = 0;
	this.time = 0;
	this.scale = 0;
}

Light.prototype.update = function() {
	this.time = Math.max(0, this.time - param.DT);
	this.obj.intensity = this.time * this.scale;
};

Light.prototype.draw = function(dt) {};

Light.prototype.flash = function(stat) {
	this.obj.color.setHex(stat.color);
	this.time = stat.time;
	this.scale = stat.intensity / stat.time;
	this.obj.distance = stat.distance;
};

module.exports = {
	Light: Light,
};
