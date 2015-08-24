/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var nextState = {name: 'intro'};

module.exports = {
	get: function() {
		var s = nextState;
		nextState = null;
		return s;
	},
	set: function(s) {
		nextState = s;
	},
};
