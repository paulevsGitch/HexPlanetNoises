const SQRT_3 = Math.sqrt(3.0);
const SQRT_3_DIV_2 = Math.sqrt(3.0) / 2.0;
const SQRT_3_DIV_3 = Math.sqrt(3.0) / 3.0;
const ONE_DIV_THREE = 1.0 / 3.0;
const TWO_DIV_THREE = 2.0 / 3.0;
const THREE_DIV_TWO = 3.0 / 2.0;
const TAU = Math.PI * 2.0;

function pixelToCubeF(x, y, size) {
	var q = (SQRT_3_DIV_3 * x - ONE_DIV_THREE * y) / size;
	var r = (TWO_DIV_THREE * y) / size;
	return axialToCube(q, r);
}

function axialToPixel(pos, size) {
	var x = size * (SQRT_3 * pos.q + SQRT_3_DIV_2 * pos.r);
	var y = size * (THREE_DIV_TWO * pos.r);
	return {x: x, y: y};
}

function axialToPixelS(pos, size, out) {
	out.x = size * (SQRT_3 * pos.q + SQRT_3_DIV_2 * pos.r);
	out.y = size * (THREE_DIV_TWO * pos.r);
}

function axialToCube(q, r) {
	var s = -q - r;
	return {q: q, r: r, s: s};
}

function cubeSub(a, b) {
	return {
		q: a.q - b.q,
		r: a.r - b.r,
		s: a.s - b.s
	}
}

function cubeAdd(a, b) {
	return {
		q: a.q + b.q,
		r: a.r + b.r,
		s: a.s + b.s
	}
}

function fract(value) {
	return value - Math.floor(value);
}

function random1(x, y) {
	return fract(2097152.0 * Math.sin(x * 17.0 + y * 59.4));
}

function random3(x, y) {
	var rnd = 4096.0 * Math.sin(x * 17.0 + y * 59.4);
	var result = {x: 0.0, y: 0.0, z: 0.0};
	result.x = fract(512.0 * rnd);
	rnd *= 0.125;
	result.y = fract(512.0 * rnd);
	rnd *= 0.125;
	result.z = fract(512.0 * rnd);
	return result;
}

function clamp(value, min, max) {
	return value < min ? min : value > max ? max : value;
}

function cubeToBarycentric(pos, bottomTriangle) {
	return bottomTriangle ? [
		1.0 + pos.s,
		pos.q,
		pos.r
	] : [
		1.0 - pos.q,
		- pos.r,
		-pos.s
	];
}

function smoothMin(a, b, k) {
	k *= 4.0;
	var h = Math.max(k - Math.abs(a - b), 0.0) / k;
	return Math.min(a,b) - h * h * k * (1.0 / 4.0);
}

// Increases the steepness of Alpha while preserving 0-1 range and 1 sum
// See: https://www.desmos.com/calculator/hs1nsjb32q
// https://www.shadertoy.com/view/XXjGDD
function smoothContrast(value, contrast) {
	var powAlpha = Math.pow(value, contrast);
	var powInfAlpha = Math.pow(1.0 - value, contrast);
	return powAlpha / (powAlpha + powInfAlpha);
}

function normalize(vector) {
	var l = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
	if (l > 0.0) {
		l = Math.sqrt(l);
		vector.x /= l;
		vector.y /= l;
		vector.z /= l;
	}
	return vector;
}

function crossProduct(a, b) {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	};
}

function cubeRotateCW(pos) {
	return {q: -pos.r, r: -pos.s, s: -pos.q};
}

function cubeRotateCCW(pos) {
	return {q: -pos.s, r: -pos.q, s: -pos.r};
}

function cubeRotateCWCenter(pos, center) {
	var vec = cubeSub(pos, center);
	vec = cubeRotateCW(vec);
	return cubeAdd(vec, center);
}

function getTriangleCoords(pos, voxelsSide) {
	var offset = pos.r == -pos.s ? 0.00001 : 0.0;
	var q = Math.floor(pos.q / voxelsSide);
	var r = Math.floor(pos.r / voxelsSide + offset);
	var s = Math.floor(pos.s / voxelsSide - offset);

	var t = (s + q - r) & 1;

	var y = ((r << 1) - t);
	var x = ((-(s << 1) + t - r - 2 - (y >> 1)) >> 1);
	
	return {x: x, y: y};
}

function getTriangleY(pos, voxelsSide) {
	var q = Math.floor(pos.q / voxelsSide);
	var r = Math.floor(pos.r / voxelsSide);
	var s = Math.floor(pos.s / voxelsSide);
	var t = (s + q - r) & 1;
	return ((r << 1) - t);
}

// Math for grid wrapping is experimental
function wrapGrid(pos, triangleSide) {
	var voxelsSide = triangleSide;// + 1;
	var t = getTriangleCoords(pos, voxelsSide);

	// Up triangles
	if (pos.r < voxelsSide) {
		var rotation = Math.floor(-t.y);
		var index = t.x - (t.y < 0 ? 1 : 0);
		pos = cubeSub(pos, axialToCube(index * voxelsSide, 0.0));
		for (var i = 0; i < rotation; i++) {
			pos = cubeRotateCW(pos);
		}
		pos = cubeAdd(pos, axialToCube((index + rotation + 15) % 5 * voxelsSide, 0.0));
		if (getTriangleY(pos, voxelsSide) < 0) pos = cubeAdd(pos, axialToCube(0.00001, 0.0));
	}
	// Down triangles
	else if (pos.r > voxelsSide * 2) {
		var rotation = Math.floor(t.y - 3);
		var index = t.x - 1 + (t.y > 5 ? 1 : 0);
		pos = cubeSub(pos, axialToCube(index * voxelsSide, voxelsSide * 3));
		for (var i = 0; i < rotation; i++) {
			pos = cubeRotateCCW(pos);
		}
		pos = cubeAdd(pos, axialToCube((((index + rotation + 16) % 5) - 1) * voxelsSide, voxelsSide * 3));
		if (getTriangleY(pos, voxelsSide) > 3) pos = cubeSub(pos, axialToCube(0.00001, 0.0));
	}
	else {
		if (pos.q < -voxelsSide) pos = cubeAdd(pos, axialToCube(voxelsSide * 5, 0.0));
		else if (pos.q >= voxelsSide * 4) pos = cubeSub(pos, axialToCube(voxelsSide * 5, 0.0));
	}

	return pos;
}