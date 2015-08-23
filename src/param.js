/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// Physics update rate, in Hz.
var RATE = 30;

module.exports = {
	// Physics update rate, in Hz.
	RATE: RATE,
	// Physics update interval, in s.
	DT: 1 / RATE,
	// Maximum update interval, in s.
	MAX_UPDATE_INTERVAL: 0.5,

	// Robot stats.
	ROBOT: {
		speed: 5,
	},
};
