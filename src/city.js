/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var building = require('./building');
var road = require('./road');
var param = require('./param');

// Tile types: unset, barrier (indestructible building), road,
// open lot, building.
var T_OPEN = 0, T_BARRIER = 1, T_ROAD = 2, T_LOT = 3, T_BUILDING = 4;

// A segment of the city.
// Pass in the previous segment.
function CitySegment(prev, w, h) {
	this.obj = new THREE.Group();
	this.bldgGroups = [];
	var roads = new road.RoadNetwork(w, h);
	_.forEach(roads.blocks, function(block) {
		var grp = new building.BuildingGroup(
			block.x0, block.y0, block.x1, block.y1);
		this.obj.add(grp.obj);
		this.bldgGroups.push(grp);
	}, this);
	var material = new THREE.MeshBasicMaterial({
		map: load.getTexture('tiles'),
	});
	this.roadGeom = roads.createGeometry();
	this.roadMesh = new THREE.Mesh(this.roadGeom, material);
	this.obj.add(this.roadMesh);
}

module.exports = {
	CitySegment: CitySegment,
};
