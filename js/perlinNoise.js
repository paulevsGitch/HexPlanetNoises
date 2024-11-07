class PerlinNoise extends Noise {
	get(pos) {
		_perlinUpdateTriangle(pos, this.triangle, this.lastTriangle, this.triangleSide, this.seed);
		
		var barPos = cubeSub(pos, this.triangle[0]);
		var bar = cubeToBarycentric(barPos, this.lastTriangle.bottom);
		bar = [
			smoothMin(bar[0], smoothMin(1.0 - bar[1], 1.0 - bar[2], 0.1), 0.1),
			smoothMin(bar[1], smoothMin(1.0 - bar[2], 1.0 - bar[0], 0.1), 0.1),
			smoothMin(bar[2], smoothMin(1.0 - bar[0], 1.0 - bar[1], 0.1), 0.1)
		];
	
		var value = 0.0;
		for (var i = 0; i < 3; i++) {
			var point = this.triangle[i];
			value += ((pos.q - point.q) * point.v.q + (pos.r - point.r) * point.v.r) * smoothContrast(bar[i], 2.0);
		}
		
		return clamp(value * 2.309027887320197, -1.0, 1.0);
	}
}

class RigidPerlinNoise extends PerlinNoise {
	get(pos) {
		return 1.0 - Math.abs(super.get(pos));
	}
}

function _perlinUpdateTriangle(pos, triangle, lastTriangle, triangleSide, seed) {
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
		triangle[i].v = _perlinGetRandomVec(triangle[i], triangleSide, seed);
	}
}

function _perlinGetRandomVec(point, triangleSide, seed) {
	var angle = 0.0;
	if ((point.r == 0) || point.r == triangleSide * 3) { // Top and bottom tip
		angle = (seed & 1) * Math.PI;
	}
	else if ((point.r < triangleSide) || (point.r > triangleSide * 2)) { // Top and bottom side connections
		var pq = point.q % triangleSide == 0;
		if (pq || point.s % triangleSide == 0) {
			angle = random1(seed, point.r - seed) * TAU;
			if (pq) angle += Math.PI / 3.0;
		}
		else angle = random1(point.q + seed, point.r - seed) * TAU;
	}
	else if ((point.r == triangleSide || point.r == triangleSide * 2) && point.q % triangleSide == 0) { // Top and bottom connection pentagons
		angle = (seed & 1) * Math.PI;
	}
	else { // Normal points + wrapping around
		var q = point.q;
		if (q == triangleSide * 4) q = -triangleSide;
		angle = random1(q + seed, point.r - seed) * TAU;
	}
	return { q: Math.sin(angle), r: Math.cos(angle) };
}