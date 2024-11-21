const VERTICAL = {q: 1, r: -2, s: 1};

class VoronoiF1Noise extends Noise {
	center = {};
	cells = [];
	outrange;

	constructor(seed, triangleSide) {
		super(seed, triangleSide);
		this.outrange = axialToCube(triangleSide * 10, triangleSide * 10);
	}

	get(pos) {
		this.updateNeighbours(pos);
		
		var dist = 100.0;
		for (var i = 0; i < this.cells.length; i++) {
			var dist2 = cubeLinearDist(pos, this.cells[i]);
			dist = Math.min(dist, dist2);
		}

		return dist;
	}

	updateNeighbours(pos) {
		var center = cubeRound(pos);

		if (center.q === this.center.q && center.r === this.center.r) return;
		this.center = center;

		this.cells[0] = this.randomOffset(center);
		for (var i = 0; i < HEX_NEIGHBOURS.length; i++) {
			var side = cubeRound(cubeAdd(center, HEX_NEIGHBOURS[i]));
			side = this.randomOffset(side);
			this.cells[i + 1] = side;
		}
	}

	randomVert(q, r, scale) {
		var rnd = random1(q, r);
		return {
			q: VERTICAL.q * rnd * scale,
			r: VERTICAL.r * rnd * scale,
			s: VERTICAL.s * rnd * scale
		}
	}

	randomOffset(pos) {
		if ((pos.r == 0) || pos.r == this.triangleSide * 3) { // Top and bottom tip
			var scale = pos.r === 0 ? -0.3 : 0.3;
			return cubeAdd(pos, this.randomVert(pos.r + this.seed, pos.r - this.seed, scale));
		}
		else if (((pos.r < this.triangleSide) || (pos.r > this.triangleSide * 2)) && (pos.q % this.triangleSide === 0 || pos.s % this.triangleSide === 0)) { // Top and bottom side connections
			var rnd = random2(this.seed, pos.r - this.seed);
			var offset = axialToCube((rnd.x - 0.5) * 0.7, (rnd.y - 0.5) * 0.7);
			if (pos.q % this.triangleSide === 0) offset = cubeRotateCCW(offset);
			return cubeAdd(pos, offset);
		}
		else if ((pos.r === this.triangleSide || pos.r === this.triangleSide * 2) && pos.q % this.triangleSide === 0) { // Top and bottom connection pentagons
			var scale = pos.r === this.triangleSide ? -0.3 : 0.3;
			return cubeAdd(pos, this.randomVert(pos.r + this.seed, pos.r - this.seed, scale));
		}

		// Wrap
		var q = pos.q;
		if (q === this.triangleSide * 4) q = -this.triangleSide;

		// Otside of bounds
		if (q !== -this.triangleSide && !isInside(pos, this.triangleSide)) return this.outrange;

		var rnd = random2(q, pos.r);
		return cubeAdd(pos, {q: (rnd.x - 0.5) * 0.7, r: (rnd.y - 0.5) * 0.7});
	}
}

class VoronoiF1F2Noise extends VoronoiF1Noise {
	distances = [];

	get(pos) {
		this.updateNeighbours(pos);
		
		for (var i = 0; i < this.cells.length; i++) {
			this.distances[i] = cubeLinearDist(pos, this.cells[i]);
		}

		this.distances.sort();

		return this.distances[0] / this.distances[1];
	}
}

class VoronoiSmoothNoise extends VoronoiF1Noise {
	get(pos) {
		this.updateNeighbours(pos);
		
		var dist = 100.0;
		for (var i = 0; i < this.cells.length; i++) {
			var dist2 = cubeLinearDist(pos, this.cells[i]);
			dist = smoothMin(dist, dist2, 0.11);
		}

		return dist;
	}
}

class VoronoiIDNoise extends VoronoiF1Noise {
	values = [];

	get(pos) {
		this.updateNeighbours(pos);
		
		var dist = 100.0;
		var index = 0;
		for (var i = 0; i < this.cells.length; i++) {
			var dist2 = cubeLinearDist(pos, this.cells[i]);
			if (dist2 < dist) {
				dist = dist2;
				index = i;
			}
		}

		return this.values[index];
	}

	updateNeighbours(pos) {
		var center = cubeRound(pos);

		if (center.q === this.center.q && center.r === this.center.r) return;
		this.center = center;

		this.cells[0] = this.randomOffset(center);
		this.values[0] = _valueGetRandomVal(center, this.triangleSide, this.seed);

		for (var i = 0; i < HEX_NEIGHBOURS.length; i++) {
			var side = cubeRound(cubeAdd(center, HEX_NEIGHBOURS[i]));
			this.values[i + 1] = _valueGetRandomVal(side, this.triangleSide, this.seed);
			var side2 = this.randomOffset(side);
			this.cells[i + 1] = side2;
		}
	}
}