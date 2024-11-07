class ValueNoise extends Noise {
	get(pos) {
		_valueUpdateTriangle(pos, this.triangle, this.lastTriangle, this.hexSize, this.triangleSide, this.seed);
		var bar = cubeToBarycentric(cubeSub(pos, this.triangle[0]), this.lastTriangle.bottom);
	
		var value = 0.0;
		for (var i = 0; i < 3; i++) {
			value += this.triangle[i].v * bar[i];
		}
		
		return clamp(value, 0.0, 1.0);
	}
}

class SmoothValueNoise extends Noise {
	get(pos) {
		_valueUpdateTriangle(pos, this.triangle, this.lastTriangle, this.hexSize, this.triangleSide, this.seed);
		var bar = cubeToBarycentric(cubeSub(pos, this.triangle[0]), this.lastTriangle.bottom);

		bar = [
			smoothMin(bar[0], smoothMin(1.0 - bar[1], 1.0 - bar[2], 0.1), 0.1),
			smoothMin(bar[1], smoothMin(1.0 - bar[2], 1.0 - bar[0], 0.1), 0.1),
			smoothMin(bar[2], smoothMin(1.0 - bar[0], 1.0 - bar[1], 0.1), 0.1)
		];
	
		var value = 0.0;
		for (var i = 0; i < 3; i++) {
			value += this.triangle[i].v * smoothContrast(bar[i], 2.0);
		}
		
		return clamp(value, 0.0, 1.0);
	}
}

class RigidValueNoise extends ValueNoise {
	get(pos) {
		return 1.0 - Math.abs(super.get(pos) * 2.0 - 1.0);
	}
}

class RigidSmoothValueNoise extends SmoothValueNoise {
	get(pos) {
		return 1.0 - Math.abs(super.get(pos) * 2.0 - 1.0);
	}
}

function _valueUpdateTriangle(pos, triangle, lastTriangle, hexSize, triangleSide, seed) {
	var q = Math.floor(pos.q);
	var r = Math.floor(pos.r);
	var bottomTriangle = (Math.floor(pos.s) + Math.floor(pos.q) - Math.floor(pos.r)) & 1;

	if (q === lastTriangle.q && r === lastTriangle.r && bottomTriangle === lastTriangle.bottom) return;
	lastTriangle.q = q;
	lastTriangle.r = r;
	lastTriangle.bottom = bottomTriangle;

	if (bottomTriangle == 1) {
		triangle[0].q = q;
		triangle[0].r = r;
		triangle[1].q = q + 1;
		triangle[1].r = r;
		triangle[2].q = q;
		triangle[2].r = r + 1;
	}
	else {
		triangle[0].q = q;
		triangle[0].r = r + 1;
		triangle[1].q = q + 1;
		triangle[1].r = r;
		triangle[2].q = q + 1;
		triangle[2].r = r + 1;
	}

	for (var i = 0; i < 3; i++) {
		triangle[i].s = -triangle[i].q - triangle[i].r;
		triangle[i].v = _valueGetRandomVal(triangle[i], triangleSide, seed);
	}

	return bottomTriangle;
}

function _valueGetRandomVal(point, triangleSide, seed) {
	var value = 0.0;
	if ((point.r == 0) || point.r == triangleSide * 3) { // Top and bottom tip
		value = random1(seed, -seed);
	}
	else if ((point.r < triangleSide) || (point.r > triangleSide * 2)) { // Top and bottom side connections
		var pq = point.q % triangleSide == 0;
		if (pq || point.s % triangleSide == 0) {
			value = random1(seed, point.r - seed);
		}
		else value = random1(point.q + seed, point.r - seed);
	}
	else if ((point.r == triangleSide || point.r == triangleSide * 2) && point.q % triangleSide == 0) { // Top and bottom connection pentagons
		value = random1(seed, point.r - seed);
	}
	else { // Normal points + wrapping around
		var q = point.q;
		if (q == triangleSide * 4) q = -triangleSide;
		value = random1(q + seed, point.r - seed);
	}
	return value;
}