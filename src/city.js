/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');
var load = require('./load');
var building = require('./building');
var particles = require('./particles');
var light = require('./light');
var util = require('./util');

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

// City class.
function City() {
	var w = param.CITY.width, h = param.CITY.height;
	this.x0 = Math.floor(-w/2);
	this.y0 = Math.floor(-h/2);
	this.x1 = this.x0 + w;
	this.y1 = this.y0 + h;
	this.intersections = [];
	this.blocks = [];
	var block = new Block(this.x0, this.y0, w + this.x0, h + this.y0);
	this._subdivide(param.CITY, block, param.CITY.subdivide.length - 1);
	this.material = new THREE.MeshLambertMaterial({
		map: load.getTexture('tiles'),
	});
	this.geometry = [];
	this.obj = new THREE.Group();
	this.blockGroup = new THREE.Group();
	this.groundGroup = new THREE.Group();
	this.spawnGroup = new THREE.Group();
	this.obj.add(this.blockGroup, this.groundGroup, this.spawnGroup);
	this._createGeometry();
	this.bldBlocks = _.collect(this.blocks, function(block) {
		var grp = new building.BuildingGroup(
			block.x0, block.y0, block.x1, block.y1);
		this.blockGroup.add(grp.obj);
		return grp;
	}, this);
	// List of pending explosions.
	this.pendingExplosions = [];
	this.explosionLight = new light.Light();
	this.obj.add(this.explosionLight.obj);
	this.propertyDamage = 0;

	this.genSpawns();
}

City.prototype.getBigIntersections = function() {
	var points = [];
	_.forEach(this.intersections, function(nn) {
		var sy = Math.max(nn.size0, nn.size2);
		var sx = Math.max(nn.size1, nn.size3);
		if (sy >= 2 && sx >= 2 && sx + sy >= 5) {
			points.push({x:nn.x, y:nn.y});
		}
	});
	return points;
};

City.prototype.genSpawns = function() {
	var points = this.getBigIntersections();
	var spawns = [];
	var best = {x:0, y:0}, bestD = Infinity;
	_.forEach(points, function(p) {
		var d = p.x * p.x + p.y * p.y;
		if (d < bestD) {
			best = p;
			bestD = d;
		}
	});
	this.playerStart = best;
	spawns.push(best);
	var n = param.CITY.numSpawn;
	for (var i = 0; i < n; i++) {
		bestD = 0;
		best = {x:0, y:0};
		for (var j = 0; j < points.length; j++) {
			var p = points[j];
			var minD = Infinity;
			for (var k = 0; k < spawns.length; k++) {
				var q = spawns[k];
				var dx = q.x - p.x, dy = q.y - p.y;
				var d2 = dx * dx + dy * dy;
				if (d2 < minD) {
					minD = d2;
					if (minD < bestD) {
						break;
					}
				}
			}
			if (minD > bestD) {
				best = p;
				bestD = minD;
			}
		}
		spawns.push(best);
	}
	spawns.splice(0, 1);
	var geom = new THREE.BoxGeometry(1, 1, 1);
	var weapons = param.CITY.weapons;
	var wstats = param.WEAPON;
	var mats = _.collect(weapons, function(weap) {
		var wstat = wstats[weap];
		return new THREE.MeshPhongMaterial({
			color: 0xffffff,
			emissive: (new THREE.Color()).setHex(wstat.icolor).multiplyScalar(0.8),
		});
	});
	_.forEach(spawns, function(p) {
		var i = Math.floor(Math.random() * weapons.length);
		var mesh = new THREE.Mesh(geom, mats[i]);
		mesh.position.set(p.x * 0.04, p.y * 0.04, 1.5);
		this.spawnGroup.add(mesh);
	}, this);
};

var GROUND = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

// Test intersection with the city geometry.
// Returns structure with 'end' and 'hit' parameters.
// The 'hit' parameter is null, "ground", or "building".
// The 'end' parameter is the end of the ray.
City.prototype.raycast = function(ray) {
	var point, dist;
	var hit = new THREE.Vector3();
	var origin = ray.origin;
	var terminus = (new THREE.Vector3()).copy(ray.direction)
			.multiplyScalar(15).add(origin);
	var bbox = (new THREE.Box3()).setFromPoints([origin, terminus]);
	var blocks = [];
	_.forEach(this.bldBlocks, function(block) {
		if (!bbox.isIntersectionBox(block.bbox)) {
			return;
		}
		var point = ray.intersectBox(block.bbox, hit);
		if (!point) {
			return;
		}
		blocks.push({
			block: block,
			point: point,
			dist: point.dot(ray.direction),
		});
	});
	var bestDistance = terminus.dot(ray.direction);
	var hitType = null;
	if (blocks.length) {
		blocks.sort(function(a, b) { return a.dist - b.dist; });
		var i;
		for (i = 0; i < blocks.length && hitType != 'building'; i++) {
			var binfos = blocks[i].block.binfos, j;
			for (j = 0; j < binfos.length; j++) {
				var binfo = binfos[j];
				point = ray.intersectBox(binfo.bbox, hit);
				if (!point) {
					continue;
				}
				dist = point.dot(ray.direction);
				if (dist < bestDistance) {
					terminus.copy(point);
					bestDistance = dist;
					hitType = 'building';
				}
			}
		}
	}
	if (!hitType) {
		point = ray.intersectPlane(GROUND, hit);
		if (point) {
			dist = point.dot(ray.direction);
			if (dist < bestDistance) {
				terminus.copy(point);
				bestDistance = dist;
				hitType = 'ground';
			}
		}
	}
	return {hit: hitType, end: terminus};
};

// Calculate the value of a building.
function buildingValue(box) {
	return Math.round(
		Math.pow(util.boxVolume(box), 1.8) *
			(0.5 + Math.random()) * 20000) * 5;
}

// Damage the city.
City.prototype.damage = function(center, size, amt) {
	var box = (new THREE.Box3()).setFromCenterAndSize(center, size);
	var vec = new THREE.Vector3();
	_.forEach(this.bldBlocks, function(block) {
		if (!box.isIntersectionBox(block.bbox)) {
			return;
		}
		var destroyed = false;
		_.forEach(block.binfos, function(binfo) {
			var dist = center.distanceTo(binfo.bbox.center(vec));
			var bsz = binfo.bbox.min.distanceTo(binfo.bbox.max) / 2;
			if (dist < size + bsz) {
				var value = buildingValue(binfo.bbox);
				this.propertyDamage += value;
				this.pendingExplosions.push(binfo.bbox);
				binfo.obj.parent.remove(binfo.obj);
				binfo.obj = null;
				destroyed = true;
			}
		}, this);
		if (destroyed) {
			var end = block.binfos.length;
			for (var i = end - 1; i >= 0; i--) {
				if (!block.binfos[i].obj) {
					end--;
					block.binfos[i] = block.binfos[end];
				}
			}
			block.binfos.splice(end, block.binfos.length - end);
		}
	}, this);
};

// Advance world by one frame.
City.prototype.update = function(game) {
	this.explosionLight.update();
	if (this.pendingExplosions.length > 0) {
		game.particles.add(new particles.Explosion(
			this.pendingExplosions, {}));
		var px = 0, py = 0, pz = 0, tw = 0, w, box, i;
		for (i = 0; i < this.pendingExplosions.length; i++) {
			box = this.pendingExplosions[i];
			w = util.boxVolume(box);
			px += w * 0.5 * (box.min.x + box.max.x);
			py += w * 0.5 * (box.min.y + box.max.y);
			pz += w * 0.5 * (box.min.z + box.max.z);
			tw += w;
		}
		var a = 1 / tw;
		this.explosionLight.obj.position.set(a*px, a*py, a*pz);
		this.explosionLight.flash(param.EXPLOSION_LIGHT);
		this.pendingExplosions = [];
	}
};

// Subdivide an area of the road network with roads.
City.prototype._subdivide = function(parm, block, roadMax) {
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
	var allowNarrow = Math.random() < parm.narrowChance;
	for (; roadSize > 0; roadSize--) {
		var dist = Math.max(subdivide[roadSize].dist, allowNarrow ? 2 : 1);
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

City.prototype._addIntersection = function(nn) {
	if (nn.isOwned) {
		return;
	}
	nn.isOwned = true;
	this.intersections.push(nn);
};

var T_LOT = 1, T_RINTER = 2, T_RVERT = 3, T_RHORI = 4, T_SIDE = 5;
var T_ASCII = ' #+|-.';
var T_UV = new Float32Array([
	1, 2, 2, 2, 1, 1, 2, 1, // 0
	0, 2, 1, 2, 0, 1, 1, 1, // T_LOT
	0, 1, 1, 1, 0, 0, 1, 0, // T_RINTER
	1, 1, 1, 0, 2, 1, 2, 0, // T_RVERT
	1, 1, 2, 1, 1, 0, 2, 0, // T_RHORI
	0, 2, 1, 2, 0, 1, 1, 1, // T_SIDE
]);
(function() {
	var i;
	for (i = 0; i < T_UV.length; i++) {
		T_UV[i] *= 0.5;
	}
})();

// Get the array of tiles for this road network.
City.prototype.getTiles = function() {
	var cx0 = this.x0, cy0 = this.y0;
	var w = this.x1 - this.x0, h = this.y1 - this.y0;
	var tiles = new Uint8Array(w * h);
	function setRect(x0, y0, x1, y1, value) {
		x0 = Math.max(x0 - cx0, 0); x1 = Math.min(x1 - cx0, w);
		y0 = Math.max(y0 - cy0, 0); y1 = Math.min(y1 - cy0, h);
		var x, y;
		for (x = x0; x < x1; x++) {
			for (y = y0; y < y1; y++) {
				tiles[x * h + y] = value;
			}
		}
	}
	function fillRoads(intersections, amt, xroad, yroad) {
		_.forEach(intersections, function(nn) {
			var n2, sz;
			// Fill horizontal road.
			n2 = nn.link0;
			sz = nn.size0 - amt;
			if (sz > 0) {
				setRect(
					nn.x, nn.y + 1 - sz,
					n2.x + 1, nn.y + sz,
					xroad);
			}
			// Fill vertical road.
			n2 = nn.link1;
			sz = nn.size1 - amt;
			if (sz > 0) {
				setRect(
					nn.x + 1 - sz, nn.y,
					nn.x + sz, n2.y + 1,
					yroad);
			}
		});
	}
	fillRoads(this.intersections, 0, T_SIDE, T_SIDE);
	fillRoads(this.intersections, 1, T_RHORI, T_RVERT);
	_.forEach(this.intersections, function(nn) {
		var sx = Math.max(nn.size1, nn.size3) - 1;
		var sy = Math.max(nn.size0, nn.size2) - 1;
		if (sx > 0 && sy > 0) {
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
City.prototype.logTiles = function() {
	console.log('Intersections', this.intersections);
	console.log('blocks', this.blocks);
	var tiles = this.getTiles();
	var lines = [], line, x, y;
	var h = this.y1 - this.y0, w = this.x1 - this.y0;
	for (y = h - 1; y >= 0; y--) {
		line = '';
		for (x = 0; x < this.w; x++) {
			line += T_ASCII[tiles[x * this.h + y]];
		}
		lines.push(line);
	}
	console.log(lines.join('\n'));
};

// Divide a line into the given number of chunks.
// Returns the chunk boundaries, including x0 and x1.
function divideLine(x0, x1, chunkMax) {
	var sz = x1 - x0;
	var nchunks = Math.ceil(sz / chunkMax);
	var i, arr = [x0];
	for (i = 1; i < nchunks; i++) {
		arr.push(x0 + Math.round(sz * i / nchunks));
	}
	arr.push(x1);
	return arr;
}

// Create geometry for the road network.
City.prototype._createGeometry = function() {
	var MAX_CHUNK = 32;
	var mh = this.y1 - this.y0, mw = this.x1 - this.y0;
	var xchunks = divideLine(this.x0, this.x1, MAX_CHUNK), xi;
	var ychunks = divideLine(this.y0, this.y1, MAX_CHUNK), yi;
	var tiles = this.getTiles();

	for (xi = 0; xi < xchunks.length; xi++) {
		var x0 = xchunks[xi], x1 = xchunks[xi+1];
		var cw = x1 - x0, mx0 = x0 - this.x0;
		for (yi = 0; yi < xchunks.length; yi++) {
			var y0 = ychunks[yi], y1 = ychunks[yi+1];
			var ch = y1 - y0, my0 = y0 - this.y0;
			var area = cw * ch, ci, mi, x, y;

			var index = new Int16Array(area * 6);
			for (ci = 0; ci < area; ci++) {
				index.set([
					ci*4+0, ci*4+1, ci*4+2,
					ci*4+2, ci*4+1, ci*4+3,
				], ci*6);
			}

			var pos = new Float32Array(area * 12);
			for (x = 0; x < cw; x++) {
				for (y = 0; y < ch; y++) {
					ci = x * ch + y;
					pos.set([
						x, y, 0,
						x + 1, y, 0,
						x, y + 1, 0,
						x + 1, y + 1, 0
					], ci * 12);
				}
			}

			var uv = new Float32Array(area * 8), j;
			for (x = 0; x < cw; x++) {
				for (y = 0; y < ch; y++) {
					mi = (x + mx0) * mw + y + my0;
					ci = x * cw + y;
					var tile = tiles[mi];
					for (j = 0; j < 8; j++) {
						uv[ci*8+j] = T_UV[tile*8+j];
					}
				}
			}

			var normal = new Float32Array(area * 12);
			for (ci = 0; ci < area * 12; ci++) {
				normal[ci*3+0] = 0;
				normal[ci*3+1] = 0;
				normal[ci*3+2] = 1;
			}

			var geometry = new THREE.BufferGeometry();
			geometry.addAttribute(
				'index', new THREE.BufferAttribute(index, 1));
			geometry.addAttribute(
				'position', new THREE.BufferAttribute(pos, 3));
			geometry.addAttribute(
				'uv', new THREE.BufferAttribute(uv, 2));
			geometry.addAttribute(
				'normal', new THREE.BufferAttribute(normal, 3));

			this.geometry.push(geometry);
			var obj = new THREE.Mesh(geometry, this.material);
			obj.position.set(x0, y0, 0);
			this.groundGroup.add(obj);
		}
	}
};

module.exports = {
	City: City,
};
