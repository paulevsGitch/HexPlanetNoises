var canvas;
var ctx;
var hider;

var mainTriangleSide = 4;
var mainHexSize = 32;
var mainSeed = 0;
var mainIterations = 1;
var mainRenderDebug = false;
var mainNoiseType = "perlin";
var mainGradientType = "bmo";
var mainGradientStep = false;
var mainErosionStrength = 0.0;

function onLoad() {
	const triSizeText = document.getElementById("tri_size");
	const hexSizeText = document.getElementById("hex_size");
	const seedText = document.getElementById("seed");
	const iterationsText = document.getElementById("iterations");
	const debugCheck = document.getElementById("debug");
	const gradStepCheck = document.getElementById("grad_step");
	const hider = document.getElementById("hider");
	const type = document.getElementById("type");
	const gradient = document.getElementById("gradient");
	const erosionStrengthText = document.getElementById("eros_str");

	const updateFrame = () => {
		hider.style.visibility = "visible";
		setTimeout(() => {
			render();
			hider.style.visibility = "hidden";
		}, 100);
	}

	document.getElementById("tri_size_form").onsubmit = (event) => {
		event.preventDefault();
		hider.style.visibility = "visible";
		var value = parseInt(triSizeText.value, 10);
		if (value !== NaN) mainTriangleSide = clamp(value, 1, 64);
		triSizeText.value = mainTriangleSide;
		updateFrame();
	};

	document.getElementById("hex_size_form").onsubmit = (event) => {
		event.preventDefault();
		hider.style.visibility = "visible";
		var value = parseInt(hexSizeText.value, 10);
		if (value !== NaN) mainHexSize = clamp(value, 1, 512);
		hexSizeText.value = mainHexSize;
		updateFrame();
	};

	document.getElementById("seed_form").onsubmit = (event) => {
		event.preventDefault();
		hider.style.visibility = "visible";
		var value = parseInt(seedText.value, 10);
		if (value !== NaN) mainSeed = value;
		seedText.value = mainSeed;
		updateFrame();
	};

	document.getElementById("iterations_form").onsubmit = (event) => {
		event.preventDefault();
		hider.style.visibility = "visible";
		var value = parseInt(iterationsText.value, 10);
		if (value !== NaN) mainIterations = clamp(value, 1, 20);
		iterationsText.value = mainIterations;
		updateFrame();
	};

	document.getElementById("eros_str_form").onsubmit = (event) => {
		event.preventDefault();
		hider.style.visibility = "visible";
		var value = parseFloat(erosionStrengthText.value);
		if (value !== NaN) mainErosionStrength = clamp(value, 0.0, 20.0);
		erosionStrengthText.value = mainErosionStrength;
		updateFrame();
	};

	document.getElementById("type_form").onsubmit = (event) => event.preventDefault();
	type.onchange = () => {
		hider.style.visibility = "visible";
		mainNoiseType = type.value;
		updateFrame();
	};

	document.getElementById("gradient_form").onsubmit = (event) => event.preventDefault();
	gradient.onchange = () => {
		hider.style.visibility = "visible";
		mainGradientType = gradient.value;
		updateFrame();
	};

	document.getElementById("debug_form").onsubmit = (event) => event.preventDefault();
	debugCheck.onclick = () => {
		hider.style.visibility = "visible";
		mainRenderDebug = debugCheck.checked ? true : false;
		updateFrame();
	};

	document.getElementById("grad_step_form").onsubmit = (event) => event.preventDefault();
	gradStepCheck.onclick = () => {
		hider.style.visibility = "visible";
		mainGradientStep = gradStepCheck.checked ? true : false;
		updateFrame();
	};

	document.getElementById("save_img_form").onsubmit = (event) => event.preventDefault();
	document.getElementById("save_img").onclick = () => {
		saveImage();
	};
	
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	render();
	hider.style.visibility = "hidden";
}

function saveImage() {
	var name = document.getElementById("save_name").value;
	if (!name.endsWith(".png")) name += ".png";

	const downloadImage = document.createElement("a");
	downloadImage.setAttribute("download", "image");
	downloadImage.href = canvas.toDataURL("image/png");
	downloadImage.download = name;
	downloadImage.click();
	downloadImage.remove();
}

function debugDraw(minX, minY) {
	for (var i = 0; i < 5; i++) {
		topTriangle(i * mainTriangleSide, 0, minX, minY, mainTriangleSide, mainHexSize);
		bottomTriangle((i - 1) * mainTriangleSide, mainTriangleSide, minX, minY, mainTriangleSide, mainHexSize);
		topTriangle(i * mainTriangleSide, mainTriangleSide, minX, minY, mainTriangleSide, mainHexSize);
		bottomTriangle((i - 1) * mainTriangleSide, mainTriangleSide * 2, minX, minY, mainTriangleSide, mainHexSize);
	}
}

function drawCircle(x, y, r) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, TAU, false);
	ctx.fill();
}

const gradientTM = [
	{ stop: 0 / 4.0, color: [0, 130, 255] },
	{ stop: 1 / 4.0, color: [0, 255, 0] },
	{ stop: 2 / 4.0, color: [255, 255, 0] },
	{ stop: 3 / 4.0, color: [225, 162, 0] },
	{ stop: 4 / 4.0, color: [255, 90, 0] }
];

function gradientTerrain(value) {
	value = Math.max(0, Math.min(1, value));

	for (let i = 0; i < gradientTM.length - 1; i++) {
		const start = gradientTM[i];
		const end = gradientTM[i + 1];

		if (value >= start.stop && value <= end.stop) {
			const t = (value - start.stop) / (end.stop - start.stop);
			const r = Math.round(start.color[0] + t * (end.color[0] - start.color[0]));
			const g = Math.round(start.color[1] + t * (end.color[1] - start.color[1]));
			const b = Math.round(start.color[2] + t * (end.color[2] - start.color[2]));
			return `rgb(${r}, ${g}, ${b})`;
		}
	}
	return "white";
}

function gradientGrayscale(value) {
	value = clamp(value * 256.0, 0.0, 255.0);
	return "rgb(" + value + "," + value + "," + value + ")";
}

function gradientBMO(value) {
	var r = clamp(value * 256.0, 0.0, 255.0);
	var g = clamp(Math.abs(0.5 - value) * 256.0, 0.0, 255.0);
	var b = clamp((1.0 - value) * 256.0, 0.0, 255.0);
	return "rgb(" + r + "," + g + "," + b + ")";
}

function getNoise(seed, side) {
	if(mainNoiseType === "value") return new ValueNoise(seed, side);
	if(mainNoiseType === "smooth_value") return new SmoothValueNoise(seed, side);
	if(mainNoiseType === "rigid_perlin") return new RigidPerlinNoise(seed, side);
	if(mainNoiseType === "rigid_value") return new RigidValueNoise(seed, side);
	if(mainNoiseType === "rigid_smooth_value") return new RigidSmoothValueNoise(seed, side);
	if(mainNoiseType === "voronoi_f1") return new VoronoiF1Noise(seed, side);
	if(mainNoiseType === "voronoi_f1/f2") return new VoronoiF1F2Noise(seed, side);
	if(mainNoiseType === "voronoi_smooth") return new VoronoiSmoothNoise(seed, side);
	if(mainNoiseType === "voronoi_id") return new VoronoiIDNoise(seed, side);
	return new PerlinNoise(seed, side);
}

function render() {
	const minX = Math.floor(axialToPixel(axialToCube(-mainTriangleSide, mainTriangleSide), mainHexSize).x);
	const maxX = Math.floor(axialToPixel(axialToCube(mainTriangleSide * 4.5, mainTriangleSide), mainHexSize).x);
	const minY = Math.floor(axialToPixel(axialToCube(0, 0), mainHexSize).y);
	const maxY = Math.floor(axialToPixel(axialToCube(0, mainTriangleSide * 3), mainHexSize).y);

	canvas.width = maxX - minX;
	canvas.height = maxY - minY;
	// mainErosionStrength
	const noise = mainErosionStrength < 0.001 ? new FractalNoise(mainSeed, mainTriangleSide, getNoise, mainIterations) : new GradientErosionFractalNoise(mainSeed, mainTriangleSide, getNoise, mainIterations, mainErosionStrength);

	var normalize = mainNoiseType === "perlin";

	var gradient = gradientBMO;
	if (mainGradientType === "gs") gradient = gradientGrayscale;
	if (mainGradientType === "tm") gradient = gradientTerrain;

	for (var x = minX; x < maxX; x++) {
		for (var y = minY; y < maxY; y++) {
			var pos = pixelToCubeF(x, y, mainHexSize);
			if (!isInside(pos, mainTriangleSide)) continue;
			var value = noise.get(pos);
			if (normalize) value = clamp(value * 0.5 + 0.5, 0.0, 1.0);
			if (mainGradientStep) value = Math.round(value * 10.0) * 0.1;
			ctx.fillStyle = gradient(value);
			ctx.fillRect(x - minX, y - minY, 1, 1);
		}
	}

	if (mainRenderDebug) debugDraw(-minX, -minY);
}

function topTriangle(q, r, minX, minY, triangleSide, hexSize) {
	ctx.strokeStyle = "#cc0000";

	var pix = axialToPixel(axialToCube(q, r), hexSize);
	ctx.beginPath();
	ctx.moveTo(pix.x + minX, pix.y + minY);
	pix = axialToPixel(axialToCube(q - triangleSide, r + triangleSide), hexSize);
	ctx.lineTo(pix.x + minX, pix.y + minY);
	pix = axialToPixel(axialToCube(q, r + triangleSide), hexSize);
	ctx.lineTo(pix.x + minX, pix.y + minY);
	pix = axialToPixel(axialToCube(q, r), hexSize);
	ctx.lineTo(pix.x + minX, pix.y + minY);
	ctx.stroke();

	ctx.strokeStyle = "white";

	for (var dr = 0; dr <= triangleSide; dr++) {
		for (var dq = -dr; dq <= 0; dq++) {
			var cube = axialToCube(q + dq, r + dr);
			pix = axialToPixel(cube, hexSize);
			renderHexagon(pix.x + minX, pix.y + minY, hexSize);
		}
	}
}

function bottomTriangle(q, r, minX, minY, triangleSide, hexSize) {
	ctx.strokeStyle = "#cc0000";

	var pix = axialToPixel(axialToCube(q, r), hexSize);
	ctx.beginPath();
	ctx.moveTo(pix.x + minX, pix.y + minY);
	pix = axialToPixel(axialToCube(q, r + triangleSide), hexSize);
	ctx.lineTo(pix.x + minX, pix.y + minY);
	pix = axialToPixel(axialToCube(q + triangleSide, r), hexSize);
	ctx.lineTo(pix.x + minX, pix.y + minY);
	pix = axialToPixel(axialToCube(q, r), hexSize);
	ctx.lineTo(pix.x + minX, pix.y + minY);
	ctx.stroke();

	ctx.strokeStyle = "white";
	
	for (var dq = 0; dq <= triangleSide; dq++) {
		var width = triangleSide + 1 - dq;
		for (var dr = 0; dr < width; dr++) {
			var cube = axialToCube(q + dq, r + dr);
			pix = axialToPixel(cube, hexSize);
			renderHexagon(pix.x + minX, pix.y + minY, hexSize);
		}
	}
}

function renderHexagon(x, y, radius) {
	ctx.beginPath();
	var px = x;
	var py = y + radius;
	for (var i = 0; i <= 6; i++) {
		ctx.moveTo(px, py);
		var angle = i * Math.PI / 3.0;
		px = x + radius * Math.sin(angle);
		py = y + radius * Math.cos(angle);
		ctx.lineTo(px, py);
	}
	ctx.stroke();
}