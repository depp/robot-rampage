/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// Compute the angle a - b, in the range [-pi, +pi].
function angleSub(a, b) {
	var c = a - b;
	if (c > Math.PI) {
		c -= 2 * Math.PI;
	} else if (c < -Math.PI) {
		c += 2 * Math.PI;
	}
	return c;
}

// Compute the angle a + b
function angleAdd(a, b) {
	var c = a + b;
	if (c > Math.PI) {
		c -= 2 * Math.PI;
	} else if (c < -Math.PI) {
		c += 2 * Math.PI;
	}
	return c;
}

// Compute the angle |a - b|, in the range [0, pi].
function angleDiff(a, b) {
	var c = Math.abs(a - b);
	if (c > Math.PI) {
		c = 2 * Math.PI - c;
	}
	return c;
}

module.exports = {
	angleSub: angleSub,
	angleAdd: angleAdd,
	angleDiff: angleDiff,
};
