/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// The requestAnimationFrame handle.
var handle = null;
// The current canvas height.
var canvasHeight = 0;
// The last size of the canvas.
var lastWidth = 0, lastHeight = 0;
// The delay in millis before automatically resizing.
var RESIZE_DELAY = 500;
// The timestamp of the last resize.
var lastResize = -1;
// The three.js renderer.
var renderer;
// The three.js scene.
var scene;
// The three.js camera.
var camera;
// The three.js controls.
var controls;

function init(container) {
	// window.addEventListener('resize', resize, false);
	var WIDTH = 800, HEIGHT = 450;

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(WIDTH, HEIGHT);
	container.appendChild(renderer.domElement);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
	camera.position.set(4, 4, 4);
	camera.up.set(0, 0, 1);
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	var light = new THREE.PointLight(0xffffff);
	light.position.set(-10, 10, 10);
	scene.add(light);

	var material, geometry, mesh;

	material = new THREE.MeshLambertMaterial({color: 0x55B663});
	geometry = new THREE.BoxGeometry(1, 1, 1);
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	material = new THREE.MeshLambertMaterial({color: 0xB66355});
	geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(0, 0, 1);

	scene.add(mesh);

	start();
	return;
}

function start() {
	if (handle) {
		return;
	}
	handle = window.requestAnimationFrame(render);
}
/*
function resize() {
	var w = canvas.clientWidth;
	var h = Math.max(1, Math.round(w * 9 / 16));
	if (h != canvasHeight) {
		canvas.style.height = h + 'px';
		canvasHeight = h;
	}
}
*/
function render(time) {
	handle = window.requestAnimationFrame(render);
	renderer.render(scene, camera);
}

window.Game = {
	init: init,
	start: start
};
