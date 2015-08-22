/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

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

function init(path_map, container) {
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
	var robot = new THREE.Group();
	_.forEach(
		['robot-leg', 'robot-arm', 'robot-torso', 'robot-head'],
		function(name) {
			loader.load(
				'assets/models/' + path_map.models[name] + '.json',
				function(geometry, materials) {
					var material = new THREE.MeshPhongMaterial({color: 0x667788});
					var mesh = new THREE.Mesh(geometry, material);
					robot.add(mesh);
				});
		});
	scene.add(robot);
	robot.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

	start();
	return;
}

function start() {
	if (handle) {
		return;
	}
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
	handle = window.requestAnimationFrame(render);
	renderer.render(scene, camera);
}

window.Game = {
	init: init,
	start: start,
	stop: stop
};
