class Noise {
	triangle = [
		{ q: 0.0, r: 0.0, s: 0.0 },
		{ q: 0.0, r: 0.0, s: 0.0 },
		{ q: 0.0, r: 0.0, s: 0.0 }
	];
	seed = 0;
	triangleSide = 0.0;
	lastTriangle = {};

	constructor(seed, triangleSide) {
		this.seed = seed;
		this.triangleSide = triangleSide;
	}

	get(pos) {
		return 0.0;
	}
}

class FractalNoise extends Noise {
	iterations = 0;
	noises = [];
	coeff = [];
	scales = [];
	sample = { q: 0.0, r: 0.0, s: 0.0 };

	constructor (seed, triangleSide, noiseConstructor, iterations) {
		super(seed, triangleSide);
		this.triangle = null;
		this.lastTriangle = null;

		this.iterations = iterations;

		var scale = 0.0;

		for (var i = 0; i < iterations; i++) {
			const side = triangleSide * (i + 1);
			this.noises[i] = noiseConstructor(seed + i, side);
			this.coeff[i] = 1.0 / (1.0 + i * 2.0);
			this.scales[i] = side / triangleSide;
			scale += this.coeff[i];
		}

		for (var i = 0; i < iterations; i++) {
			this.coeff[i] /= scale;
		}
	}

	get(pos) {
		var value = 0.0;
		for (var i = 0; i < this.iterations; i++) {
			this.sample.q = pos.q * this.scales[i];
			this.sample.r = pos.r * this.scales[i];
			this.sample.s = -this.sample.q - this.sample.r;
			value += this.noises[i].get(this.sample) * this.coeff[i];
		}
		return value;
	}
}