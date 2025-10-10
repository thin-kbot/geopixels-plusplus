// ==UserScript==
// @name         GeoPixels++
// @description  QOL features for https://geopixels.net/ with color palette management
// @author       thin-kbot, Observable, h65e3j
// @version      0.5.1
// @match        https://*.geopixels.net/*
// @namespace    https://github.com/thin-kbot
// @homepage     https://github.com/thin-kbot/geopixels-plusplus
// @updateURL    https://github.com/thin-kbot/geopixels-plusplus/raw/refs/heads/main/geopixels++.user.js
// @downloadURL  https://github.com/thin-kbot/geopixels-plusplus/raw/refs/heads/main/geopixels++.user.js
// @icon         https://raw.githubusercontent.com/thin-kbot/geopixels-plusplus/refs/heads/main/img/icon.png
// @license      GPL-3.0
// @grant        unsafeWindow
// ==/UserScript==

//#region Global variables
const LOG_LEVELS = {
	error: { label: "ERR", color: "red" },
	info: { label: "INF", color: "lime" },
	warn: { label: "WRN", color: "yellow" },
	debug: { label: "DBG", color: "cyan" },
};

const STORAGE_KEYS = {
	censor: "geo++_censorRects",
	keybinds: "geo++_keybinds",
};

const SOUNDS = [
	{
		name: "Pixel placement sound",
		variable: "soundBufferPop",
	},
	{
		name: '"Paint" sound',
		variable: "soundBufferThump",
	},
];
let soundToChangeIdx = 0;

let censorRects;
let censorMode = false;
let isDraggingCensor = false;
let censorStartPoint = null;
let tempCensorRect = null;

const KEY_BINDINGS = {
	toggleGhost: {
		text: "Toggle ghost image",
		keydown: () => document.getElementById("ghost-canvas").toggleAttribute("hidden"),
	},
	placeGhost: {
		text: "Set ghost image's top left",
		keydown: () => {
			const pos = screenPointToGrid(document.getElementById("pixel-canvas"), mouseX, mouseY);
			ghostImageTopLeft = pos;
			localStorage.setItem("ghostImageCoords", JSON.stringify(pos));
			log(LOG_LEVELS.info, "Ghost image position set.");
			drawGhostImageOnCanvas();
		},
	},
};
const DEFAULT_KEY_BINDINGS = { t: "toggleGhost", e: "placeGhost" };
let mouseX, mouseY;
//#endregion Global variables

//#region Utils
function log(lvl, ...args) {
	console.log(
		`%c[GeoPixels++] %c[${lvl.label}]`,
		"color: mediumvioletred;",
		`color:${lvl.color};`,
		...args
	);
}

function isJsonString(str) {
	try {
		JSON.parse(str);
	} catch {
		return false;
	}
	return true;
}

function screenPointToGrid(canvas, mX, mY) {
	const rect = canvas.getBoundingClientRect();

	// Convert screen coordinates to map coordinates
	const lngLat = map.unproject([mX - rect.left, mY - rect.top]);
	const merc = turf.toMercator([lngLat.lng, lngLat.lat]);

	return {
		gridX: Math.round(merc[0] / gridSize),
		gridY: Math.round(merc[1] / gridSize),
	};
}
//#endregion Utils

//#region Color Utils
const cToHex = (c) => (+c).toString(16).padStart(2, "0");
const hexToC = (h) => parseInt(h, 16);
function toFullHex(hex) {
	hex = hex.toLowerCase();
	if (hex.length === 4 || hex.length === 5)
		hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
	if (hex.length === 7) hex += "ff";
	return hex;
}
const toOutputHex = (hex) => toFullHex(hex).slice(0, 7);
const rgbaToHex = (r, g, b, a = 255) => "#" + cToHex(r) + cToHex(g) + cToHex(b) + cToHex(a);
const rgbToRgbaString = ({ r, g, b }) => `rgba(${r},${g},${b},1)`;
function hexToRgba(hex) {
	const h = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	return { r: hexToC(h[1]), g: hexToC(h[2]), b: hexToC(h[3]), a: h[4] ? hexToC(h[4]) : 255 };
}
function parseColor(colorStr) {
	const h = /^#?([a-f\d]{6}(?:[a-f\d]{2})?|[a-f\d]{3,4})/i.exec(colorStr);
	if (h) return toFullHex(`#${h[1]}`);
	log(LOG_LEVELS.error, "Invalid color format:", colorStr);
	return null;
}
Array.prototype.toOutputString = function () {
	return this.map((c) => toOutputHex(c)).join("\n");
};
function colorsStringToHexArray(colorsString) {
	return colorsString
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((c) => parseColor(c))
		.filter(Boolean);
}
//#endregion Color Utils

(function () {
	const usw = unsafeWindow;

	//#region User Palette Functions
	const getUserPalette = () => Colors.slice(0, -1).map(toFullHex);

	function isInUserPalette(hex) {
		const is = getUserPalette().includes(hex);
		if (!is) log(LOG_LEVELS.warn, "Color not in user palette:", toOutputHex(hex));
		return is;
	}

	function setEnabledUserPalette(hexArray) {
		const colors = getUserPalette();
		activeColors = hexArray.map((h) => colors.indexOf(h)).filter((i) => i !== -1);
		activeColors.push(Colors.length - 1);

		localStorage.setItem("activeColors", JSON.stringify(activeColors));

		SetColorsProfile();
		SetColors();
		if (activeColors.length > 0 && (!pixelColor || !colors.includes(toFullHex(pixelColor))))
			changeColor(Colors[activeColors[0]]);

		log(LOG_LEVELS.info, "Enabled palette updated with", activeColors.length, "colors");
	}
	//#endregion User Palette Functions

	//#region Ghost Image Palette Functions
	function getGhostImageHexColors() {
		return ghostImageColors.map((rgba) => {
			const c = rgba.substring(5, rgba.length - 1).split(",");
			return rgbaToHex(c[0], c[1], c[2]);
		});
	}

	function getAvailableGhostColors() {
		const colors = getUserPalette();
		return getGhostImageHexColors().filter((c) => colors.includes(c));
	}

	function getEnabledGhostPalette() {
		if (ghostImageActiveColors && ghostImageActiveColors.size > 0)
			return Array.from(ghostImageActiveColors).map((rgba) => rgbaToHex(...rgba.match(/\d+/g)));

		log(LOG_LEVELS.info, "No ghost colors enabled");
		return "";
	}

	function isInGhostPalette(hex) {
		const is = ghostImageColors.includes(rgbToRgbaString(hexToRgba(hex)));
		if (!is) log(LOG_LEVELS.warn, "Color not in ghost palette:", hex);
		return is;
	}

	function setEnabledGhostPalette(hexArray) {
		if (!ghostImageColors || ghostImageColors.length === 0) {
			log(LOG_LEVELS.warn, "No ghost image loaded");
			return;
		}

		ghostImageActiveColors = new Set(hexArray.map((h) => rgbToRgbaString(hexToRgba(h))));
		populateColorPaletteUI();
		regenerateGhostCanvas();
		drawGhostImageOnCanvas();

		log(LOG_LEVELS.info, "Ghost palette updated with", hexArray.length, "enabled colors");
	}

	function onlyShowOwnedGhostColors() {
		setEnabledGhostPalette(getAvailableGhostColors());
	}

	function setBothPalette(s) {
		setEnabledUserPalette(s.filter(isInUserPalette));
		setEnabledGhostPalette(s.filter(isInGhostPalette));
	}
	//#endregion Ghost Image Palette Functions

	//#region Navigation
	function gotoCoords({ x, y }) {
		const gSize = usw.gridSize || gridSize || 25;

		if (isNaN(x) || isNaN(y)) {
			log(LOG_LEVELS.error, "Invalid coordinates");
			return;
		}

		const mercX = x * gSize;
		const mercY = y * gSize;
		const lngLat = turf.toWgs84([mercX, mercY]);

		map.setCenter([lngLat[0], lngLat[1]]);
		map.setZoom(zoom);

		log(LOG_LEVELS.debug, `Moved to (${x}, ${y})`);
	}

	function gotoFromInput(input = "", zoom = 16) {
		const gSize = usw.gridSize || gridSize || 25;
		let coordString;

		if (!input.length) {
			const urlParams = new URLSearchParams(window.location.search);
			coordString = urlParams.get("coords") || urlParams.get("key");
			if (!coordString) {
				log(LOG_LEVELS.error, "No coordinates provided and none found in URL");
				return;
			}
			log(LOG_LEVELS.debug, `Using coords from page URL: ${coordString}`);
		} else if (input.includes("http") || input.includes("?coords=") || input.includes("?key=")) {
			try {
				const url = new URL(input.includes("http") ? input : "https://www.geopixels.net/" + input);
				coordString = url.searchParams.get("coords") || url.searchParams.get("key");
				if (coordString) {
					log(LOG_LEVELS.error, "No coords parameter found in URL");
					return;
				}
				log(LOG_LEVELS.debug, `Extracted coords from URL: ${coordString}`);
			} catch (e) {
				log(LOG_LEVELS.log, "Invalid URL format");
				return;
			}
		} else {
			coordString = input;
		}

		const parts = coordString.trim().split(",");
		if (parts.length !== 2) {
			log(LOG_LEVELS.error, 'Invalid format. Use: "gridX,gridY"');
			return;
		}

		const gridX = +parts[0];
		const gridY = +parts[1];

		gotoCoords({ x: gridX, y: gridY });
	}
	//#endregion Navigation

	//#region Sound
	function bto64(blob) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.readAsDataURL(blob);
		});
	}

	function setBlobAsSound(s, blob) {
		blob
			.arrayBuffer()
			.then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
			.then((decodedAudio) => {
				eval(`${s.variable} = decodedAudio`);
			})
			.catch((err) => (LOG_LEVELS.error, "Error loading audio:", err));
	}

	function saveBlobSound(s, blob) {
		setBlobAsSound(s, blob);
		bto64(blob).then((b64s) => localStorage.setItem(`geo++_${s.variable}`, b64s));
	}

	function loadBlobSounds() {
		for (const s of SOUNDS) {
			let storageItem = localStorage.getItem(`geo++_${s.variable}`);
			if (storageItem) {
				fetch(storageItem)
					.then((res) => res.blob())
					.then((blob) => setBlobAsSound(s, blob));
			}
		}
	}
	loadBlobSounds();
	//#endregion Sound

	//#region Censor
	function isValidCensorConfig(json) {
		return (
			Array.isArray(json) &&
			json.every(
				(obj) =>
					typeof obj === "object" &&
					obj !== null &&
					["gridX", "gridY", "width", "height"].every((key) => Number.isInteger(obj[key]))
			)
		);
	}

	//#region Drawing censor
	function enableCensorMode() {
		censorMode = true;
		const censorCanvas = document.getElementById("censor-canvas");
		if (censorCanvas) {
			censorCanvas.style.pointerEvents = "auto";
			censorCanvas.style.cursor = "crosshair";
		}

		log(LOG_LEVELS.debug, "Censor mode enabled");
	}

	function disableCensorMode() {
		censorMode = false;
		isDraggingCensor = false;
		censorStartPoint = null;
		tempCensorRect = null;

		const censorCanvas = document.getElementById("censor-canvas");
		if (censorCanvas) {
			censorCanvas.style.pointerEvents = "none";
			censorCanvas.style.cursor = "auto";
		}

		drawCensorRects();
		log(LOG_LEVELS.debug, "Censor mode disabled");
	}

	function toggleCensorMode() {
		if (censorMode) disableCensorMode();
		else enableCensorMode();
	}

	function setupCensorCanvasEvents(canvas) {
		canvas.addEventListener("mousedown", (e) => {
			if (!censorMode || e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			isDraggingCensor = true;
			const point = screenPointToGrid(canvas, e.clientX, e.clientY);
			censorStartPoint = point;
			tempCensorRect = {
				gridX: point.gridX,
				gridY: point.gridY,
				width: 0,
				height: 0,
			};
		});

		canvas.addEventListener("mousemove", (e) => {
			if (!censorMode || !isDraggingCensor || !censorStartPoint) return;

			e.preventDefault();
			e.stopPropagation();

			const point = screenPointToGrid(canvas, e.clientX, e.clientY);

			const minX = Math.min(censorStartPoint.gridX, point.gridX);
			const maxX = Math.max(censorStartPoint.gridX, point.gridX);
			const minY = Math.min(censorStartPoint.gridY, point.gridY);
			const maxY = Math.max(censorStartPoint.gridY, point.gridY);

			tempCensorRect = {
				gridX: minX,
				gridY: minY,
				width: maxX - minX + 1,
				height: maxY - minY + 1,
			};

			drawCensorRects();
		});

		canvas.addEventListener("mouseup", (e) => {
			if (!censorMode || !isDraggingCensor || e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			if (tempCensorRect && (tempCensorRect.width > 0 || tempCensorRect.height > 0)) {
				addCensorRect(tempCensorRect);

				log(
					LOG_LEVELS.debug,
					`Created censor rect: ${tempCensorRect.gridX},${tempCensorRect.gridY} ${tempCensorRect.width}x${tempCensorRect.height}`
				);
			}

			isDraggingCensor = false;
			censorStartPoint = null;
			tempCensorRect = null;

			drawCensorRects();
		});

		canvas.addEventListener("mouseleave", () => {
			if (isDraggingCensor) {
				isDraggingCensor = false;
				censorStartPoint = null;
				tempCensorRect = null;
				drawCensorRects();
			}
		});
	}

	function drawCensorRect(ctx, rect, gSize, color) {
		const topLeftMerc = [rect.gridX * gSize, (rect.gridY + rect.height) * gSize];
		const bottomRightMerc = [(rect.gridX + rect.width) * gSize, rect.gridY * gSize];

		const topLeftScreen = map.project(turf.toWgs84(topLeftMerc));
		const bottomRightScreen = map.project(turf.toWgs84(bottomRightMerc));

		const screenWidth = Math.abs(bottomRightScreen.x - topLeftScreen.x);
		const screenHeight = Math.abs(bottomRightScreen.y - topLeftScreen.y);

		if (
			topLeftScreen.x + screenWidth < 0 ||
			topLeftScreen.x > ctx.canvas.width ||
			topLeftScreen.y + screenHeight < 0 ||
			topLeftScreen.y > ctx.canvas.height
		)
			return;

		ctx.fillStyle = color;
		ctx.fillRect(topLeftScreen.x, topLeftScreen.y, screenWidth, screenHeight);
	}
	//#endregion Drawing censor

	function ensureCensorCanvas() {
		let canvas = document.getElementById("censor-canvas");
		if (!canvas) {
			canvas = document.createElement("canvas");
			canvas.id = "censor-canvas";
			canvas.style.position = "absolute";
			canvas.style.top = "0";
			canvas.style.left = "0";
			canvas.style.pointerEvents = "none";
			document.body.appendChild(canvas);
			setupCensorCanvasEvents(canvas);
		}
		return canvas;
	}

	function getCensorRects() {
		if (!Array.isArray(censorRects)) {
			const c = localStorage.getItem(STORAGE_KEYS.censor);
			censorRects = c && isJsonString(c) ? JSON.parse(c) : [];
		}
		return censorRects;
	}
	function saveCensorRects(r) {
		censorRects = r;
		localStorage.setItem(STORAGE_KEYS.censor, JSON.stringify(r));
		drawCensorRects();
	}
	const addCensorRect = (rect) => saveCensorRects([...getCensorRects(), rect]);

	function drawCensorRects() {
		const canvas = ensureCensorCanvas();
		const pixelCanvas = document.getElementById("pixel-canvas");
		if (!pixelCanvas) return;

		canvas.width = pixelCanvas.width;
		canvas.height = pixelCanvas.height;
		const ctx = canvas.getContext("2d");

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const gSize = usw.gridSize || gridSize || 25;

		if (censorMode && isDraggingCensor && tempCensorRect) {
			drawCensorRect(ctx, tempCensorRect, gSize, "#0007");
		}

		const rects = getCensorRects();
		if (!rects.length) return;
		rects.forEach((rect) => {
			drawCensorRect(ctx, rect, gSize, "#000");
		});
	}

	function waitForMap(callback) {
		let tries = 0;
		function check() {
			if (map && map.on && map.getContainer) callback();
			else if (tries++ < 100) setTimeout(check, 100);
		}
		check();
	}

	waitForMap(() => {
		["move", "rotate", "zoom"].forEach((ev) => map.on(ev, drawCensorRects));
		new ResizeObserver(drawCensorRects).observe(map.getContainer());
	});
	//#endregion Censor

	//#region keybind
	document.addEventListener("mousemove", (e) => {
		mouseX = e.clientX;
		mouseY = e.clientY;
	});

	let keybinds = JSON.parse(localStorage.getItem(STORAGE_KEYS.keybinds)) || {};

	function saveKeybinds(kb) {
		keybinds = kb;
		localStorage.setItem(STORAGE_KEYS.keybinds, JSON.stringify(kb));
	}

	if (!localStorage.getItem(STORAGE_KEYS.keybinds)) saveKeybinds(DEFAULT_KEY_BINDINGS);

	document.getElementById("toggleKeybinds").addEventListener("click", () => {
		for (const key in keybinds) {
			const element = document.getElementById(`gpp_keybind-${keybinds[key]}`);
			if (element) element.value = key;
		}
	});

	function handleKeyBindPress(e) {
		// Ignore shortcuts if typing in an input field.
		const aElm = document.activeElement;
		if (aElm && (aElm.tagName === "INPUT" || aElm.tagName === "TEXTAREA" || aElm.isContentEditable))
			return;

		const id = keybinds[e.key.toLowerCase()];
		if (id && KEY_BINDINGS[id][e.type]) {
			KEY_BINDINGS[id][e.type](e);
			e.preventDefault();
		}
	}

	document.addEventListener("keydown", handleKeyBindPress);
	document.addEventListener("keyup", handleKeyBindPress);

	document
		.querySelector("#keybindsPanel>div.flex>button.bg-blue-500")
		.addEventListener("click", () => {
			const newKeybinds = {};
			Array.from(document.querySelectorAll("[id^='gpp_keybind-']")).forEach((elm) => {
				newKeybinds[elm.value.trim().toLowerCase()] = elm.id.replace("gpp_keybind-", "");
			});
			saveKeybinds(newKeybinds);
		});
	//#endregion keybind

	//#region UI Helpers
	function copyToClipboard(text) {
		log(LOG_LEVELS.info, "Copied text to clipboard:\n", text);
		navigator.clipboard
			.writeText(text)
			.then(() => {
				alert("Copied to clipboard!");
			})
			.catch((err) => {
				log(LOG_LEVELS.error, "Failed to copy:", err);
				alert("Failed to copy to clipboard");
			});
	}

	function createModal(title, innerHTML, onSubmit, submitBtTxt = "Submit") {
		const modal = document.createElement("div");
		modal.className = "fixed inset-0 flex items-center justify-center bg-black/50 z-[100]";
		modal.innerHTML = `
			<div class="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
				<h2 class="mb-4 text-xl font-semibold">${title}</h2>
				${innerHTML}
				<div class="mt-4 flex gap-2 justify-end">
					<button
						id="colorInputCancel"
						class="px-4 py-2 bg-gray-600 text-white rounded-md cursor-pointer font-medium"
						style="background: #6b7280;"
					>Cancel</button>
					<button
						id="colorInputSubmit"
						class="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer font-medium"
					>${submitBtTxt}</button>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		const cancelBtn = modal.querySelector("#colorInputCancel");
		const submitBtn = modal.querySelector("#colorInputSubmit");

		const closeModal = () => {
			document.body.removeChild(modal);
			document.removeEventListener("keydown", escHandler);
		};
		cancelBtn.onclick = closeModal;

		submitBtn.onclick = () => {
			onSubmit();
			closeModal();
		};

		// Click outside to close
		modal.onclick = (e) => {
			if (e.target === modal) closeModal();
		};

		// ESC to close
		const escHandler = (e) => {
			if (e.key === "Escape") closeModal();
		};
		document.addEventListener("keydown", escHandler);

		return modal;
	}

	function createColorInputModal(title, placeholder, onSubmit) {
		const modal = createModal(
			title,
			`<textarea
					id="colorInputTextarea"
					placeholder="${placeholder}"
					class="w-full p-3 border-2 border-gray-200 rounded-lg font-mono text-sm resize-vertical box-border"
					style="height: 200px;"
				></textarea>`,
			() => {
				const value = textarea.value.trim();
				log(LOG_LEVELS.debug, "Submitted colors:\n", value);
				if (value) onSubmit(colorsStringToHexArray(value));
			}
		);

		const textarea = modal.querySelector("#colorInputTextarea");

		setTimeout(() => textarea.focus(), 100);
	}

	function promptForColors(action, title = "Enter colors") {
		createColorInputModal(
			title,
			"Enter colors (one per line)\nFormat: '#?RRGGBB(.+)?'\nExample:\nFF0000\n#00FF00\n0000FF00",
			action
		);
	}

	function makeButton(innerText, onClick) {
		const button = document.createElement("button");
		button.innerText = innerText;
		button.onclick = onClick;
		return button;
	}
	function makeBasicButton(innerText, onClick) {
		const button = makeButton(innerText, onClick);
		button.className =
			"px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition cursor-pointer";
		return button;
	}
	function makeSelectButton(innerText, onClick) {
		const button = makeButton(innerText, onClick);
		button.className =
			"px-2 py-1 bg-white rounded-lg shadow hover:bg-gray-300 border border-gray-300 transition cursor-pointer";
		return button;
	}
	function makeMenuButton(innerText, title, onClick) {
		const button = makeButton(innerText, onClick);
		button.className =
			"w-10 h-10 bg-white shadow rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer";
		button.title = title;
		return button;
	}
	function makeSelectMenuButton(innerText, title, options, optionsTitle = "") {
		const wrapper = document.createElement("div");
		wrapper.className = "relative";
		wrapper.onclick = (e) => e.stopPropagation();

		const select = document.createElement("div");
		if (optionsTitle.length) select.innerHTML = `<h2>${optionsTitle}</h2>`;
		select.append(...options.map((opt) => makeSelectButton(opt.innerText, opt.onClick)));

		select.classList =
			"bg-white shadow rounded-xl p-2 border border-gray-300 transition transition-all absolute w-auto top-0 overflow-hidden flex flex-col gap-1";
		select.style.height = "auto";
		select.style.whiteSpace = "nowrap";
		select.close = () => {
			select.style.maxWidth = "40px";
			select.style.maxHeight = "40px";
			select.style.zIndex = "-1";
			select.style.left = "0px";
		};
		select.open = () => {
			select.style.maxWidth = "500px";
			select.style.maxHeight = (optionsTitle.length ? 25 : 0) + 16 + options.length * 40 + "px";
			select.style.zIndex = "1";
			select.style.left = "50px";
		};
		select.toggle = () => {
			if (select.style.zIndex != "-1") select.close();
			else select.open();
		};
		select.close();
		window.addEventListener("click", () => select.close());

		const menuButton = makeMenuButton(innerText, title, () => {
			select.toggle();
		});
		wrapper.append(menuButton, select);
		return wrapper;
	}
	function makeMenuGroupButton(innerText, title, id, parent) {
		const div = document.createElement("div");
		div.className = "relative";
		const button = makeMenuButton(innerText, title, (e) => {
			e.stopPropagation();
			closeAllDropdowns();
			toggleDropdown(document.getElementById(`${id}Dropdown`));
		});
		button.id = `${id}Btn`;
		const dropdown = document.createElement("div");
		dropdown.className =
			"dropdown-menu absolute left-0 mt-2 flex flex-col gap-2 transition-all duration-150 ease-out hidden";
		dropdown.id = `${id}Dropdown`;
		div.append(button, dropdown);
		parent.appendChild(div);
		return dropdown;
	}
	//#endregion UI Helpers

	//#region UI
	// Add buttons to ghost palette container
	document.querySelector("#ghostColorPaletteContainer>div").append(
		makeBasicButton("Enable Only Owned Ghost Colors", onlyShowOwnedGhostColors),
		makeBasicButton("Get Ghost Colors", () =>
			copyToClipboard(
				getGhostImageHexColors()
					.map((hex) => toOutputHex(hex))
					.join("\n")
			)
		),
		makeBasicButton("Get Enabled Ghost Colors", () =>
			copyToClipboard(getEnabledGhostPalette().toOutputString())
		),
		makeBasicButton("Set Enabled Ghost Colors", () =>
			promptForColors(
				(t) => setEnabledGhostPalette(t.filter(isInGhostPalette)),
				"Set Enabled Ghost Colors"
			)
		)
	);

	// Add buttons to shop (profile panel)
	const shopButtonsContainer = document.querySelector(
		"#profilePanel > section:nth-child(5) > div:nth-child(2) > div.mt-4"
	);
	if (shopButtonsContainer) {
		shopButtonsContainer.style.display = "flex";
		shopButtonsContainer.style.wrap = "wrap";
		shopButtonsContainer.style.gap = "8px";

		shopButtonsContainer.append(
			makeBasicButton("Get User Colors", () => copyToClipboard(getUserPalette().toOutputString())),
			makeBasicButton("Get Enabled Colors", () =>
				copyToClipboard(
					getUserPalette()
						.filter((c, idx) => activeColors.includes(idx))
						.toOutputString()
				)
			),
			makeBasicButton("Set Enabled Colors", () =>
				promptForColors(
					(t) => setEnabledUserPalette(t.filter(isInUserPalette)),
					"Set Enabled User Colors"
				)
			)
		);
	}

	//create hidden file input
	const inputSoundFile = document.createElement("input");
	inputSoundFile.type = "file";
	inputSoundFile.style.display = "none";
	inputSoundFile.accept = "audio/*";
	inputSoundFile.onchange = () => {
		let blob = new Blob([inputSoundFile.files[0]]);
		saveBlobSound(SOUNDS[soundToChangeIdx], blob);
	};
	document.body.appendChild(inputSoundFile);

	// Add GeoPixels++ menu group to main UI
	makeMenuGroupButton(
		"✚₊",
		"GeoPixels++",
		"geopixels-plusplus",
		document.getElementById("controls-left")
	).append(
		makeMenuButton("🎯", "Go to Coordinates", () => {
			const input = prompt("Enter coordinates (gridX,gridY) or GeoPixels URL:");
			if (input) gotoFromInput(input);
		}),
		makeMenuButton("🧪", "Set Both Palettes", () => promptForColors(setBothPalette)),
		makeSelectMenuButton(
			"🎵",
			"Change Sound",
			SOUNDS.map((s, i) => {
				return {
					innerText: s.name,
					onClick: () => {
						soundToChangeIdx = i;
						inputSoundFile.click();
					},
				};
			}),
			"Choose a sound to change"
		),
		makeSelectMenuButton("🚫", "Censor", [
			{
				innerText: "add a new censor manually",
				onClick: () => {
					const input = prompt("Enter coordinates and size (gridX,gridY,width,height): ");
					if (!input) return;
					const [gridX, gridY, width, height] = input.split(",").map(Number);
					if (isNaN(gridX) || isNaN(gridY) || isNaN(width) || isNaN(height)) {
						alert("Invalid format. Use: gridX,gridY,width,height");
						return;
					}
					addCensorRect({ gridX, gridY, width, height });
				},
			},
			{
				innerText: "Toggle censor mode",
				onClick: async () => {
					toggleCensorMode();
				},
			},
			{
				innerText: "clear censors",
				onClick: () => saveCensorRects(),
			},
			{
				innerText: "export censors",
				onClick: () => copyToClipboard(JSON.stringify(censorRects)),
			},
			{
				innerText: "import censors (replace)",
				onClick: () => {
					const input = prompt("Paste censor config: ");
					if (!input) return;

					if (!isJsonString(input)) {
						alert("Invalid config.");
						return;
					}
					const config = JSON.parse(input);

					if (!isValidCensorConfig(config)) {
						alert("Invalid config.");
						return;
					}

					log(LOG_LEVELS.info, "replaced Censor rects with", config);
					saveCensorRects(config);
				},
			},
			{
				innerText: "import censors (add)",
				onClick: () => {
					const input = prompt("Paste censor config: ");
					if (!input) return;

					if (!isJsonString(input)) {
						alert("Invalid config.");
						return;
					}
					const config = JSON.parse(input);

					if (!isValidCensorConfig(config)) {
						alert("Invalid config.");
						return;
					}

					log(LOG_LEVELS.info, "added Censor rects:", config);
					for (const rect of config) addCensorRect(rect);
				},
			},
		])
	);

	//Add to the keybind Panel
	const gpp_keybind_div = document.createElement("div");
	gpp_keybind_div.innerHTML = `
			<h3 class="text-lg font-semibold text-gray-700 mb-2">GeoPixels++</h3>
			<div class="space-y-2">
				${Object.keys(KEY_BINDINGS)
					.map(
						(id) => `
						<div class="flex items-center justify-between p-2">
							<label for="gpp_keybind-${id}" class="text-gray-600">${KEY_BINDINGS[id].text}</label>
							<input id="gpp_keybind-${id}" type="text" maxlength="1" class="keybind-input">
						</div>
					`
					)
					.join("")}
			</div>
	`;
	document.querySelector("#keybindsPanel>div.grid>div:nth-child(2)").appendChild(gpp_keybind_div);
	//#endregion UI

	log(LOG_LEVELS.info, "GeoPixels++ loaded");
})();
