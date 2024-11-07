// Gavoronoise
// Based on https://www.shadertoy.com/view/7ljcRW

function _gavoronoiseHash(pos) {
	var q = pos.q * 0.3183099 + 0.3678794;
	var r = pos.r * 0.3678794 + 0.3183099;
	var f = fract(q * r * (q + r));
	return {
		q: 2.0 * fract(16.0 * 0.3183099 * f) - 1.0,
		r: 2.0 * fract(16.0 * 0.3678794 * f) - 1.0,
	}
}

function _gavoronoiseErosion(pos, dir) {
	var ip = {
		q: Math.floor(pos.q),
		r: Math.floor(pos.r)
	};
	var fp = {
		q: pos.q - ip.q,
		r: pos.r - ip.r
	};
	var va = { q: 0.0, r: 0.0 };
	var wt = 0.0;

	for (var q =- 2; q <= 1; q++) {
		for (var r = -2; r <= 1; r++) {
			var o = { q: q, r: r };
			var h = _gavoronoiseHash({ q: ip.q - o.q, r: ip.r - o.r });
			h.q *= 0.5;
			h.r *= 0.5;
			var pp = { q: fp.q + o.q - h.q, r: fp.r + o.r - h.r };
			var d = pp.q * pp.q + pp.r * pp.r;
			var w = Math.exp(-d * 2.0);
			wt += w;
			var mag = pp.q * dir.x + dir.z * pp.r;
			va.q += (Math.cos(mag * TAU), -Math.sin(mag * TAU) * (pp.q * 0.0 + dir.x)) * w;
			va.r += (Math.cos(mag * TAU), -Math.sin(mag * TAU) * (pp.r * 0.0 + dir.z)) * w;
		}
	}

	va.q /= wt;
	va.r /= wt;
	va.s = -va.q - va.r;

	return va;
}