/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var building = require('./building');
var road = require('./road');
var param = require('./param');

// Tile types: unset, barrier (indestructible building), road,
// open lot, building.
var T_OPEN = 0, T_BARRIER = 1, T_ROAD = 2, T_LOT = 3, T_BUILDING = 4;

// A segment of the city.
// Pass in the previous segment.
function CitySegment(prev, w, h) {
	var roads = new road.RoadNetwork(w, h);
	roads.logTiles();
}

module.exports = {
	CitySegment: CitySegment,
};
