const NORMAL_OFFSETS_Q = axialToCube(0.5, 0.0);
const NORMAL_OFFSETS_R = axialToCube(0.0, 0.5);

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

	getNormal(pos) {
		var vnq = this.get(cubeSub(pos, NORMAL_OFFSETS_Q));
		var vpq = this.get(cubeAdd(pos, NORMAL_OFFSETS_Q));
		var vnr = this.get(cubeSub(pos, NORMAL_OFFSETS_R));
		var vpr = this.get(cubeAdd(pos, NORMAL_OFFSETS_R));

		var dq = normalize({ x: 1.0, y: vpq - vnq, z: 0.0 });
		var dr = normalize({ x: 0.0, y: vpr - vnr, z: 1.0 });
		
		return crossProduct(dq, dr);
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
			const side = triangleSide * (1 << i);
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

class GradientErosionFractalNoise extends FractalNoise {
	gradient = {x: 0.0, y: 0.0};
	erosionStrength = 0.0;

	constructor (seed, triangleSide, noiseConstructor, iterations, erosionStrength) {
		super(seed, triangleSide, noiseConstructor, iterations);
		this.erosionStrength = erosionStrength;
	}

	get(pos) {
		var value = 0.0;
		gradient.x = 0.0;
		gradient.y = 0.0;
		for (var i = 0; i < this.iterations; i++) {
			this.sample.q = pos.q * this.scales[i];
			this.sample.r = pos.r * this.scales[i];
			this.sample.s = -this.sample.q - this.sample.r;
			var noise = this.noises[i].get(this.sample) * this.coeff[i];
			var normal = this.noises[i].getNormal(this.sample);
			gradient.x += normal.x;
			gradient.y += normal.z;
			value += noise / (1.0 + this.erosionStrength * Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y));
		}
		return value;
	}
}