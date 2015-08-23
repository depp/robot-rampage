/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');

var buildingMaterial = new THREE.MeshLambertMaterial({color: 0xcccccc});

// List of building geometries, organized by size.
// Each entry has sizeX, sizeY, and geoms (array of BuildingGeometry).
var buildings = null;

// Class for a building geometry.
function BuildingGeometry(name) {
	this.geometry = [load.getModel(name, false), load.getModel(name, true)];
	var bb = this.geometry[0].boundingBox;
	var x0 = Math.floor(bb.min.x);
	var y0 = Math.floor(bb.min.y);
	var x1 = Math.ceil(bb.max.x);
	var y1 = Math.ceil(bb.max.y);
	this.sizeX = x1 - x0;
	this.sizeY = y1 - y0;
	this.offX = x0;
	this.offY = y0;
}

// Initialize list of building geometries.
function initBuildings() {
	buildings = [];
	var sizes = {};
	load.forModels(function(model, name) {
		if (!/^bld_[0-9]+$/.test(name)) {
			return;
		}
		var b = new BuildingGeometry(name);
		var sname = b.sizeX + ',' + b.sizeY;
		var size = sizes[sname];
		if (!size) {
			size = [];
			sizes[sname] = size;
			buildings.push({sizeX: b.sizeX, sizeY: b.sizeY, geoms: size});
		}
		size.push(b);
	});
}

// Iterate over points on a single line starting from a random point.
function perimeter1(sz, func, thisArg) {
	if (sz <= 0) {
		return;
	}
	var x0, x1, i;
	x1 = Math.floor(Math.random() * (sz + 1));
	x0 = x1 - 1;
	for (i = 0; i < sz; i++) {
		var dir;
		if (x0 >= 0 && x1 < sz) {
			dir = Math.random() < 0.5;
		} else {
			dir = x1 < sz;
		}
		if (dir) {
			func.call(thisArg, x1);
			x1++;
		} else {
			func.call(thisArg, x0);
			x0--;
		}
	}
}

// Iterate over points on two lines starting from a single point.
function perimeter2(sz, func, thisArg) {
	if (sz <= 0) {
		return;
	}
	var x0, x1, x2, x3, i;
	x1 = Math.floor(Math.random() * (sz + 1));
	x0 = x1 - 1;
	x3 = Math.floor(Math.random() * (sz + 1));
	x2 = x3 - 1;
	for (i = 0; i < sz * 2; i++) {
		var s = false;
		while (!s) {
			switch (Math.floor(Math.random() * 4)) {
			case 0:
				if (x0 >= 0) {
					s = true;
					func.call(thisArg, x0, 0);
					x0--;
				}
				break;
			case 1:
				if (x1 < sz) {
					s = true;
					func.call(thisArg, x1, 0);
					x1++;
				}
				break;
			case 2:
				if (x2 >= 0) {
					s = true;
					func.call(thisArg, x2, 1);
					x2--;
				}
				break;
			case 3:
				if (x3 < sz) {
					s = true;
					func.call(thisArg, x3, 1);
					x3++;
				}
				break;
			}
		}
	}
}

// Iterate over points on the perimeter of a rectangle.
// The order is randomized in a specific way.
// Function should take x, y, dir.
// dir = 0 for +x side, 1 for +y side, 2 for -x side, 3 for -y side.
function perimeter(w, h, func, thisArg) {
	if (w > 1 && h > 1) {
		var xAxisFirst;
		if (w > h) {
			xAxisFirst = true;
		} else if (w < h) {
			xAxisFirst = false;
		} else {
			xAxisFirst = Math.random() < 0.5;
		}
		if (xAxisFirst) {
			perimeter2(w, function(x, y) {
				func.call(thisArg, x, y * (h - 1), y ? 1 : 3);
			});
			perimeter2(h - 2, function(y, x) {
				func.call(thisArg, x * (w - 1), y + 1, x ? 0 : 2);
			});
		} else {
			perimeter2(h, function(y, x) {
				func.call(thisArg, x * (w - 1), y, x ? 0 : 2);
			});
			perimeter2(w - 2, function(x, y) {
				func.call(thisArg, x + 1, y * (h - 1), y ? 1 : 3);
			});
		}
		return;
	}

	if (w === 1 && h === 1) {
		func.call(thisArg, 0, 0, Math.floor(Math.random() * 4));
		return;
	}

	if (w === 1) {
		perimeter1(h, function(y) {
			func.call(thisArg, 0, y, Math.random() < 0.5 ? 0 : 2);
		});
		return;
	}

	if (h === 1) {
		perimeter1(w, function(x) {
			func.call(thisArg, x, 0, Math.random() < 0.5 ? 1 : 3);
		});
		return;
	}
}

// Class for a group of buildings.  Randomly generates buildings which
// fill an area with the given space.
function BuildingGroup(x0, y0, x1, y1) {
	var w = x1 - x0, h = y1 - y0;
	if (typeof w != 'number' || typeof h != 'number' || w <= 0 || h <= 0) {
		throw new Error('Invalid building group size');
	}
	if (!buildings) {
		initBuildings();
	}

	// Status of each square in the area.
	var status = new Uint8Array(w * h);

	// Test a rectangle to see if it is empty and contained within the area.
	function rectIsEmpty(rx, ry, rw, rh) {
		if (rx < 0 || ry < 0 || rw > w - rx || rh > h - ry) {
			return false;
		}
		var x, y;
		for (x = rx; x < rx + rw; x++) {
			for (y = ry; y < ry + rh; y++) {
				if (status[x * h + y] !== 0) {
					return false;
				}
			}
		}
		return true;
	}

	// Set the contents of a status subrect.
	function setRect(rx, ry, rw, rh, value) {
		var x, y;
		for (x = rx; x < rx + rw; x++) {
			for (y = ry; y < ry + rh; y++) {
				status[x * h + y] = value;
			}
		}
	}

	var group = this;
	this.obj = new THREE.Group();
	this.obj.position.set(x0, y0, 0);

	var bboxes = [];
	// Place buildings at points on the perimiter.
	perimeter(w, h, function(x, y, dir) {
		var totalWeight = 0;
		var candidates = [];
		if (!rectIsEmpty(x, y, 1, 1)) {
			return;
		}
		_.forEach(buildings, function(size) {
			var sx = size.sizeX, sy = size.sizeY;
			var x0, x1, y0, y1;
			if (dir & 1) {
				y0 = y1 = dir === 1 ? h - sx : 0;
				x0 = x + 1 - sy;
				x1 = x;
				while (x0 <= x1 && !rectIsEmpty(x0, y0, sy, sx)) {
					x0++;
				}
				while (x0 <= x1 && !rectIsEmpty(x1, y0, sy, sx)) {
					x1--;
				}
				if (x0 > x1) {
					return;
				}
			} else {
				x0 = x1 = dir === 0 ? w - sx : 0;
				y0 = y + 1 - sy;
				y1 = y;
				while (y0 <= y1 && !rectIsEmpty(x0, y0, sx, sy)) {
					y0++;
				}
				while (y0 <= y1 && !rectIsEmpty(x0, y1, sy, sx)) {
					y1--;
				}
				if (y0 > y1) {
					return;
				}
			}
			var weight = Math.sqrt(sy) * sx * size.geoms.length;
			totalWeight += weight;
			candidates.push({
				x0: x0, y0: y0, x1: x1, y1: y1,
				size: size, rval: totalWeight
			});
		});
		(function() {
			if (candidates.length === 0) {
				console.error('Could not place building');
				return;
			}
			// Choose building geometry and position from the candidates.
			// The lower-left corner of the building goes in (bx, by).
			var geom, flipY, bx, by;
			(function() {
				// Choose a random candidate from the list of sizes.
				var index = 0;
				if (candidates.length > 1) {
					var r = Math.random() * totalWeight;
					while (index < candidates.length - 1 && candidates[index].rval < r) {
						index++;
					}
				}
				var c = candidates[index];
				var size = c.size;
				// Choose a random building in that size, randomly flipping it.
				if (size.geoms.length > 1) {
					geom = size.geoms[Math.floor(Math.random() * size.geoms.length)];
				} else {
					geom = size.geoms[0];
				}
				flipY = Math.random() < 0.5;
				// Choose a random legal position.
				bx = c.x0;
				if (c.x1 != c.x0) {
					bx += Math.floor(Math.random() * (c.x1 + 1 - c.x0));
				}
				by = c.y0;
				if (c.y1 != c.y0) {
					by += Math.floor(Math.random() * (c.y1 + 1 - c.y0));
				}
			})();
			// Place the building.
			(function() {
				var ox = geom.offX, sx = geom.sizeX, oy = geom.offY, sy = geom.sizeY;
				var bsx = dir & 1 ? sy : sx, bsy = dir & 1 ? sx : sy;
				setRect(bx, by, bsx, bsy, 1);
				if (flipY) {
					ox = -ox - sx;
					dir = (dir + 2) & 3;
				}
				var mesh = new THREE.Mesh(
					geom.geometry[flipY ? 1 : 0], buildingMaterial);
				switch (dir) {
				case 0: mesh.position.set(bx - ox,      by - oy,      0); break;
				case 1: mesh.position.set(bx + oy + sy, by - ox,      0); break;
				case 2: mesh.position.set(bx + ox + sx, by + oy + sy, 0); break;
				case 3: mesh.position.set(bx - oy,      by + ox + sx, 0); break;
				}
				mesh.rotation.set(0, 0, dir * (Math.PI / 2), 'XYZ');
				group.obj.add(mesh);
				bboxes.push(new THREE.Box3(
					new THREE.Vector3(x0 + bx, y0 + by, 0),
					new THREE.Vector3(
						x0 + bx + bsx, y0 + by + bsy,
						mesh.geometry.boundingBox.max.z)));
			})();
		})();
	});
	var bbox = new THREE.Box3();
	bbox.copy(bboxes[0]);
	_.forEach(bboxes, bbox.union, bbox);
	this.bboxes = bboxes;
	this.bbox = bbox;
}

module.exports = {
	BuildingGroup: BuildingGroup
};
