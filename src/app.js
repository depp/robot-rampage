/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// The canvas DOM element.
var canvas = null;
// The requestAnimationFrame handle.
var handle = null;
// The WebGL rendering context.
var gl = null;
// The current canvas height.
var canvasHeight = 0;
// The last size of the canvas.
var lastWidth = 0, lastHeight = 0;
// The delay in millis before automatically resizing.
var RESIZE_DELAY = 500;
// The timestamp of the last resize.
var lastResize = -1;

function init(c, g) {
	if (canvas && gl) {
		return;
	}
	canvas = c;
	gl = g;
	window.addEventListener('resize', resize, false);
	resize();
	start();
	return;
}

function start() {
	if (handle) {
		return;
	}
	handle = window.requestAnimationFrame(render);
}

function resize() {
	var w = canvas.clientWidth;
	var h = Math.max(1, Math.round(w * 9 / 16));
	if (h != canvasHeight) {
		canvas.style.height = h + 'px';
		canvasHeight = h;
	}
}

function render(time) {
	var w = canvas.clientWidth, h = canvas.clientHeight;
	var needsResize = lastResize < 0 ||
			(time > lastResize + RESIZE_DELAY &&
			 (w != lastWidth || h != lastHeight));
	if (needsResize) {
		canvas.width = lastWidth = w;
		canvas.height = lastHeight = h;
		lastResize = time;
	}
	handle = window.requestAnimationFrame(render);

	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	gl.clearColor(1.0, 0.8, 0.4, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
}

window.Game = {
	init: init,
	start: start,
	resize: resize
};
