/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var stateManager = require('./state');

function Intro(width, height) {
	var e;
	var ce = document.createElement('div');
	this.layer = ce;
	ce.className = 'videoLayer';
	e = document.createElement('video');
	this.video = e;
	e.controls = true;
	_.forEach(load.getVideo('intro'), function(src) {
		var se = document.createElement('source');
		se.type = src.type;
		se.src = src.uri;
		e.appendChild(se);
	});
	ce.appendChild(e);
	e = document.createElement('p');
	var a = document.createElement('a');
	a.className = 'button';
	a.appendChild(document.createTextNode('Play Game >>>'));
	a.onclick = function() {
		stateManager.set({name: 'game'});
		return false;
	};
	e.appendChild(a);
	ce.appendChild(e);
	document.getElementById('game').appendChild(ce);
}

Intro.prototype.update = function() {};

Intro.prototype.draw = function(dt) {};

Intro.prototype.destroy = function() {
	this.video.pause();
	this.layer.parentElement.removeChild(this.layer);
};

module.exports = {
	Intro: Intro,
};
