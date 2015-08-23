/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

function HUD(width, height) {
	this.canvas = document.createElement('canvas');
	this.canvas.width = width;
	this.canvas.height = height;
	this.cxt = this.canvas.getContext('2d');
}

HUD.prototype.clear = function() {
	this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

module.exports = {
	HUD: HUD,
};
