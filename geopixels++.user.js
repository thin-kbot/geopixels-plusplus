// ==UserScript==
// @name         GeoPixels++
// @description  Some QOL features for the website https://geopixels.net/
// @author       thin-kbot
// @version      0.0.1
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
const cToHex = (c) => (+c).toString(16).padStart(2, "0");
function toFullHex(hex) {
	hex = hex.toLowerCase();
	if (hex.length === 4 || hex.length === 5)
		hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
	if (hex.length === 7) hex += "ff";
	return hex;
}
function rgbaToHex(r, g, b, a = 255) {
	return "#" + cToHex(r) + cToHex(g) + cToHex(b) + cToHex(a);
}
function hexToRgba(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
				a: result[4] ? parseInt(result[4], 16) : 255,
		  }
		: null;
}
function rgbToRgbaString({ r, g, b }) {
	return `rgba(${r},${g},${b},1)`;
}
//#endregion

(function () {
	const usw = unsafeWindow;

	function getGhostImageHexColors() {
		return ghostImageColors.map((rgba) => {
			const c = rgba.substring(5, rgba.length - 1).split(",");
			return rgbaToHex(c[0], c[1], c[2]);
		});
	}
	function getAvailableGhostColors() {
		const colors = Colors.map((c) => toFullHex(c));
		return getGhostImageHexColors().filter((c) => colors.includes(c));
	}

	function onlyShowOwnedGhostColors() {
		ghostImageActiveColors = new Set(
			getAvailableGhostColors().map((c) => rgbToRgbaString(hexToRgba(c)))
		);
		populateColorPaletteUI();
		regenerateGhostCanvas();
		drawGhostImageOnCanvas();
	}

	const onlyShowOwnedGhostColorsButton = document.createElement("button");
	onlyShowOwnedGhostColorsButton.className =
		"px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition cursor-pointer";
	onlyShowOwnedGhostColorsButton.innerText = "Only Show Owned Ghost Colors";
	onlyShowOwnedGhostColorsButton.onclick = onlyShowOwnedGhostColors;
	const paletteButtonsContainer = document.querySelector("#ghostColorPaletteContainer>div");
	paletteButtonsContainer.appendChild(onlyShowOwnedGhostColorsButton);
})();
