// ==UserScript==
// @name         GeoPixels++
// @description  QOL features for https://geopixels.net/ with color palette management
// @author       thin-kbot, Observable
// @version      0.1.1
// @match        https://*.geopixels.net/*
// @namespace    https://github.com/thin-kbot
// @homepage     https://github.com/thin-kbot/geopixels-plusplus
// @updateURL    https://github.com/thin-kbot/geopixels-plusplus/raw/refs/heads/main/geopixels++.user.js
// @downloadURL  https://github.com/thin-kbot/geopixels-plusplus/raw/refs/heads/main/geopixels++.user.js
// @icon         https://raw.githubusercontent.com/thin-kbot/geopixels-plusplus/refs/heads/main/img/icon.png
// @license      GPL-3.0
// @grant        unsafeWindow
// ==/UserScript==

//#region Utils
const LOG_LEVELS = {
	error: { label: "ERR", color: "red" },
	info: { label: "INF", color: "lime" },
	warn: { label: "WRN", color: "yellow" },
	debug: { label: "DBG", color: "orange" },
};

function log(lvl, ...args) {
	console.log(
		`%c[GeoPixels++] %c[${lvl.label}]`,
		"color: mediumvioletred;",
		`color:${lvl.color};`,
		...args
	);
}
//#endregion

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
function toOutputHex(hex) {
	return toFullHex(hex).slice(0, 7);
}
function rgbaToHex(r, g, b, a = 255) {
	return "#" + cToHex(r) + cToHex(g) + cToHex(b) + cToHex(a);
}
function hexToRgba(hex) {
	const h = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	return { r: hexToC(h[1]), g: hexToC(h[2]), b: hexToC(h[3]), a: h[4] ? hexToC(h[4]) : 255 };
}
function rgbToRgbaString({ r, g, b }) {
	return `rgba(${r},${g},${b},1)`;
}
function parseColor(colorStr) {
	const h = /^(?:#|FF)?([a-f\d]{6}(?:[a-f\d]{2})?|[a-f\d]{3,4})$/i.exec(colorStr);
	if (!h) {
		log(LOG_LEVELS.error, "Invalid color format:", colorStr);
		return null;
	}
	return toFullHex(`#${h[1]}`);
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
//#endregion

(function () {
	const usw = unsafeWindow;

	//#region User Palette Functions
	const getUserPalette = () => Colors.slice(0, -1).map(toFullHex);

	function isInUserPalette(hex) {
		const is = getUserPalette().includes(hex);
		if (!is) log(LOG_LEVELS.warn, "Color not in user palette:", hex);
		return is;
	}

	function setEnabledUserPalette(hexArray) {
		const colors = getUserPalette();
		activeColors = hexArray.map((h) => colors.indexOf(h)).filter((i) => i !== -1);

		localStorage.setItem("activeColors", JSON.stringify(activeColors));

		SetColorsProfile();
		SetColors();
		if (activeColors.length > 0) changeColor(Colors[activeColors[0]]);

		log(LOG_LEVELS.info, "Enabled palette updated with", activeColors.length, "colors");
	}
	//#endregion

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
	//#endregion

	function gotoCoords(input = "", zoom = 16) {
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

		if (isNaN(gridX) || isNaN(gridY)) {
			log(LOG_LEVELS.error, "Invalid coordinates");
			return;
		}

		const mercX = gridX * gSize;
		const mercY = gridY * gSize;
		const lngLat = turf.toWgs84([mercX, mercY]);

		map.setCenter([lngLat[0], lngLat[1]]);
		map.setZoom(zoom);

		log(LOG_LEVELS.debug, `Moved to (${gridX}, ${gridY})`);
	}

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

	function createColorInputModal(title, placeholder, onSubmit) {
		// Create modal overlay
		const modal = document.createElement("div");
		modal.className = "fixed inset-0 flex items-center justify-center bg-black/50 z-[100]";
		modal.innerHTML = `
			<div class="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
				<h2 class="mb-4 text-xl font-semibold">${title}</h2>
				<textarea
					id="colorInputTextarea"
					placeholder="${placeholder}"
					class="w-full p-3 border-2 border-gray-200 rounded-lg font-mono text-sm resize-vertical box-border"
					style="height: 200px;"
				></textarea>
				<div class="mt-4 flex gap-2 justify-end">
					<button
						id="colorInputCancel"
						class="px-4 py-2 bg-gray-600 text-white rounded-md cursor-pointer font-medium"
						style="background: #6b7280;"
					>Cancel</button>
					<button
						id="colorInputSubmit"
						class="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer font-medium"
					>Submit</button>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		const textarea = modal.querySelector("#colorInputTextarea");
		const cancelBtn = modal.querySelector("#colorInputCancel");
		const submitBtn = modal.querySelector("#colorInputSubmit");

		setTimeout(() => textarea.focus(), 100);

		const closeModal = () => {
			document.body.removeChild(modal);
			document.removeEventListener("keydown", escHandler);
		};
		cancelBtn.onclick = closeModal;

		submitBtn.onclick = () => {
			const value = textarea.value.trim();
			log(LOG_LEVELS.debug, "Submitted colors:\n", value);
			if (value) onSubmit(colorsStringToHexArray(value));
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
	}

	function promptForColors(action, title = "Enter colors") {
		createColorInputModal(
			title,
			"Enter colors (one per line)\nFormat: RRGGBB (or regex (FF|#)?RRGGBB(.+)?)\nExample:\nFF0000\n#00FF00\n0000FF00",
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
	function makeMenuButton(innerText, title, onClick) {
		const button = makeButton(innerText, onClick);
		button.className =
			"w-10 h-10 bg-white shadow rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer";
		button.title = title;
		return button;
	}
	//#endregion

	//#region UI
	// Add buttons to ghost palette container
	const paletteButtonsContainer = document.querySelector("#ghostColorPaletteContainer>div");
	if (paletteButtonsContainer) {
		paletteButtonsContainer.append(
			makeBasicButton("Only Show Owned Ghost Colors", onlyShowOwnedGhostColors),
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
	}

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

	// Add goto button to menu group dropdown
	const menuGroupDropdown = document.getElementById("menuGroupDropdown");
	if (menuGroupDropdown)
		menuGroupDropdown.appendChild(
			makeMenuButton("🎯", "Go to Coordinates", () => {
				const input = prompt("Enter coordinates (gridX,gridY) or GeoPixels URL:");
				if (input) {
					gotoCoords(input);
				}
			})
		);

	// Add set_both_palette button to tools group dropdown
	const toolsGroupDropdown = document.getElementById("toolsGroupDropdown");
	if (toolsGroupDropdown)
		toolsGroupDropdown.appendChild(
			makeMenuButton("🧪", "Set Both Palettes", () => promptForColors(setBothPalette))
		);
	//#endregion UI
})();
