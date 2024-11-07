const sqrt3 = Math.sqrt(3.0);
const sqrt3DivTwo = Math.sqrt(3.0) / 2.0;
const sqrt3DivThree = Math.sqrt(3.0) / 3.0;
const oneDivThree = 1.0 / 3.0;
const twoDivThree = 2.0 / 3.0;
const threeDivTwo = 3.0 / 2.0;

function pixelToCubeF(x, y, size) {
	var q = (sqrt3DivThree * x - oneDivThree * y) / size;
	var r = (twoDivThree * y) / size;
	return axialToCube(q, r);
}

function axialToPixel(pos, size) {
	var x = size * (sqrt3 * pos.q + sqrt3DivTwo * pos.r);
	var y = size * (threeDivTwo * pos.r);
	return {x: x, y: y};
}

function axialToPixelS(pos, size, out) {
	out.x = size * (sqrt3 * pos.q + sqrt3DivTwo * pos.r);
	out.y = size * (threeDivTwo * pos.r);
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