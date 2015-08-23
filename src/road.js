/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';
var param = require('./param');

// Class for a city block.
function Block(x0, y0, x1, y1, n0, n1, n2, n3) {
	// Bounds
	this.x0 = x0;
	this.y0 = y0;
	this.x1 = x1;
	this.y1 = y1;
	// An intersection on each edge of the block, or null.
	this.n0 = n0 || null;
	this.n1 = n1 || null;
	this.n2 = n2 || null;
	this.n3 = n3 || null;
}

// Class for a road intersection.
function Intersection(x, y) {
	// Directional links to other intersections, with the road size of each.
	this.link0 = null; this.size0 = 0;
	this.link1 = null; this.size1 = 0;
	this.link2 = null; this.size2 = 0;
	this.link3 = null; this.size3 = 0;
	// Center of the intersection.
	this.x = x;
	this.y = y;
	// Whether this is owned by a road network.
	this.isOwned = false;
}

// Split a road at the given position, returning the intersection.
function splitX(node, x, y) {
	if (!node) {
		return new Intersection(x, y);
	}
	while (node.x < x && node.link0) {
		node = node.link0;
	}
	while (node.x > x && node.link2) {
		node = node.link2;
	}
	if (node.x == x) {
		return node;
	}
	var n1, n2;
	if (node.x < x) {
		n1 = node;
		n2 = node.link0;
	} else {
		n1 = node.link2;
		n2 = node;
	}
	node = new Intersection(x, y);
	if (n1 && n2) {
		var size = n1.size0;
		node.y = n1.y;
		n1.link0 = node;
		node.link2 = n1;
		node.size2 = size;
		node.link0 = n2;
		node.size0 = size;
		n2.link2 = node;
	}
	return node;
}

// Split a road at the given position, returning the intersection.
function splitY(node, x, y) {
	if (!node) {
		return new Intersection(x, y);
	}
	while (node.y < y && node.link1) {
		node = node.link1;
	}
	while (node.y > y && node.link1) {
		node = node.link3;
	}
	if (node.y == y) {
		return node;
	}
	var n1, n2;
	if (node.y < y) {
		n1 = node;
		n2 = node.link1;
	} else {
		n1 = node.link3;
		n2 = node;
	}
	node = new Intersection(x, y);
	if (n1 && n2) {
		var size = n1.size1;
		node.x = n1.x;
		n1.link1 = node;
		node.link3 = n1;
		node.size3 = size;
		node.link1 = n2;
		node.size1 = size;
		n2.link3 = node;
	}
	return node;
}

// Class for a network of roads.
function RoadNetwork(w, h) {
	this.w = w;
	this.h = h;
	this.intersections = [];
	this.blocks = [];
	var block = new Block(0, 0, w, h);
	this._subdivide(param.CITY, block, param.CITY.subdivide.length - 1);
}

// Subdivide an area of the road network with roads.
RoadNetwork.prototype._subdivide = function(parm, block, roadMax) {
	var subdivide = parm.subdivide;
	var bw = block.x1 - block.x0, bh = block.y1 - block.y0;
	var area = bw * bh;

	// Calculate maximum and minimum road size.
	while (roadMax > 0 && area < subdivide[roadMax].min) {
		roadMax--;
	}
	if (!roadMax) {
		this.blocks.push(block);
		return;
	}
	var roadMin = 0;
	while (roadMin < roadMax && area > subdivide[roadMin].max) {
		roadMin++;
	}

	// Choose a road size, and attempt to subdivide.  Reduce the road
	// size if subdivision is impossible.
	var roadSize = roadMin +
			Math.floor(Math.random() * (roadMax + 1 - roadMin));
	for (; roadSize > 0; roadSize--) {
		var dist = subdivide[roadSize].dist;
		// Possible road locations on each axis.
		var roadWidth = roadSize * 2 - 1;
		var nx = Math.max(0, bw + 1 - 2 * dist - roadWidth);
		var ny = Math.max(0, bh + 1 - 2 * dist - roadWidth);
		var n = nx + ny;
		if (!n) {
			// No possible locations for this road, try a smaller one.
			continue;
		}
		var roadIndex = Math.floor(Math.random() * n);
		var b1, b2, n1, n2;
		if (roadIndex < nx) {
			// The range of tiles in the road.
			var x0 = block.x0 + dist + roadIndex, x1 = x0 + roadWidth;
			var xc = x0 + roadSize - 1;
			if (x0 - block.x0 < dist || block.x1 - x1 < dist) {
				console.warn('INVALID SUBDIVISION X', roadIndex, nx);
				continue;
			}
			// Generate new intersections.
			n1 = splitX(block.n3, xc, block.y0 - 1);
			n2 = splitX(block.n1, xc, block.y1);
			n1.link1 = n2; n1.size1 = roadSize;
			n2.link3 = n1; n2.size3 = roadSize;
			// Generate new subdivided blocks.
			b1 = new Block(
				block.x0, block.y0, x0, block.y1,
				n1, block.n1, block.n2, block.n3);
			b2 = new Block(
				x1, block.y0, block.x1, block.y1,
				block.n0, block.n1, n1, block.n3);
		} else {
			roadIndex -= nx;
			// The range of tiles in the road.
			var y0 = block.y0 + dist + roadIndex, y1 = y0 + roadWidth;
			var yc = y0 + roadSize - 1;
			if (y0 - block.y0 < dist || block.y1 - y1 < dist) {
				console.warn('INVALID SUBDIVISION Y', roadIndex, ny);
				continue;
			}
			// Generate new intersections.
			n1 = splitY(block.n2, block.x0 - 1, yc);
			n2 = splitY(block.n0, block.x1,     yc);
			n1.link0 = n2; n1.size0 = roadSize;
			n2.link2 = n1; n2.size2 = roadSize;
			// Generate new subdivided blocks.
			b1 = new Block(
				block.x0, block.y0, block.x1, y0,
				block.n0, n1, block.n2, block.n3);
			b2 = new Block(
				block.x0, y1, block.x1, block.y1,
				block.n0, block.n1, block.n2, n1);
		}
		_.forEach([n1, n2], this._addIntersection, this);
		this._subdivide(parm, b1, roadSize);
		this._subdivide(parm, b2, roadSize);
		return;
	}

	this.blocks.push(block);
};

RoadNetwork.prototype._addIntersection = function(nn) {
	if (nn.isOwned) {
		return;
	}
	nn.isOwned = true;
	this.intersections.push(nn);
};

var T_LOT = 1, T_RINTER = 2, T_RVERT = 3, T_RHORI = 4, T_SIDE = 5;
var T_ASCII = ' #+|-.';

// Get the array of tiles for this road network.
RoadNetwork.prototype.getTiles = function() {
	var w = this.w, h = this.h;
	var tiles = new Uint8Array(w * h);
	function setRect(x0, y0, x1, y1, value) {
		y0 = Math.max(y0, 0); y1 = Math.min(y1, h);
		x0 = Math.max(x0, 0); x1 = Math.min(x1, w);
		var x, y;
		for (x = x0; x < x1; x++) {
			for (y = y0; y < y1; y++) {
				tiles[x * h + y] = value;
			}
		}
	}
	_.forEach(this.intersections, function(nn) {
		var n2, sz;
		// Fill horizontal road.
		n2 = nn.link0;
		sz = nn.size0;
		if (sz > 0) {
			setRect(
				nn.x + 1, nn.y + 1 - sz,
				n2.x, nn.y + sz,
				T_RHORI);
		}
		// Fill vertical road.
		n2 = nn.link1; sz = nn.size1;
		if (sz > 0) {
			setRect(
				nn.x + 1 - sz, nn.y + 1,
				nn.x + sz, n2.y,
				T_RVERT);
		}
	});
	_.forEach(this.intersections, function(nn) {
		var sx = Math.max(nn.size1, nn.size3);
		var sy = Math.max(nn.size0, nn.size2);
		if (sx && sy) {
			setRect(
				nn.x + 1 - sx, nn.y + 1 - sy,
				nn.x + sx, nn.y + sy,
				T_RINTER);
		}
	});
	_.forEach(this.blocks, function(block) {
		setRect(block.x0, block.y0, block.x1, block.y1, T_LOT);
	});
	return tiles;
};

// Log the tile array to the console.
RoadNetwork.prototype.logTiles = function() {
	console.log('Intersections', this.intersections);
	console.log('blocks', this.blocks);
	var tiles = this.getTiles();
	var lines = [], line, x, y;
	for (y = this.h - 1; y >= 0; y--) {
		line = '';
		for (x = 0; x < this.w; x++) {
			line += T_ASCII[tiles[x * this.h + y]];
		}
		lines.push(line);
	}
	console.log(lines.join('\n'));
};
/*
function generateRoads(w, h) {
	var stat = param.CITY;
	var tile = new Uint8Array(w * h);
	var block = [];
	var road

}
*/

module.exports = {
	RoadNetwork: RoadNetwork,
};
