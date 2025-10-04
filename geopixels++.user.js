// ==UserScript==
// @name         GeoPixels++
// @description  QOL features for https://geopixels.net/ with color palette management
// @author       thin-kbot, Observable
// @version      0.1.0
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

//#region Color Format Utilities
function format_p_net_color([r, g, b]) {
	return "FF" + cToHex(r) + cToHex(g) + cToHex(b);
}
function format_simple_color([r, g, b]) {
	return cToHex(r) + cToHex(g) + cToHex(b);
}

function parse_color(colorStr) {
	let cleaned = colorStr.trim().split(/\s+/)[0];

	if (/^FF[0-9A-Fa-f]{6}$/.test(cleaned)) {
		cleaned = cleaned.substring(2);
	} else if (cleaned.startsWith("#")) {
		cleaned = cleaned.substring(1);
	}

	if (cleaned.length === 6 && /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
		return [
			parseInt(cleaned.substring(0, 2), 16),
			parseInt(cleaned.substring(2, 4), 16),
			parseInt(cleaned.substring(4, 6), 16),
		];
	}
	throw new Error("Invalid color format: " + colorStr);
}
//#endregion

//#region User Palette Commands
function get_user_palette() {
	const ownedColors = Colors.slice(0, -1);
	const output = ownedColors
		.map((hex) => {
			const rgb = [
				parseInt(hex.slice(1, 3), 16),
				parseInt(hex.slice(3, 5), 16),
				parseInt(hex.slice(5, 7), 16),
			];
			return format_simple_color(rgb);
		})
		.join("\n");

	console.log(output);
	return output;
}

function get_enabled_palette() {
	const enabledColors = activeColors
		.filter((idx) => idx < Colors.length - 1)
		.map((idx) => Colors[idx])
		.map((hex) => {
			const rgb = [
				parseInt(hex.slice(1, 3), 16),
				parseInt(hex.slice(3, 5), 16),
				parseInt(hex.slice(5, 7), 16),
			];
			return format_simple_color(rgb);
		})
		.join("\n");

	console.log(enabledColors);
	return enabledColors;
}

function set_enabled_palette(colorString) {
	const lines = colorString
		.trim()
		.split("\n")
		.filter((l) => l.trim());
	const newActiveColors = [];

	for (const line of lines) {
		try {
			const [r, g, b] = parse_color(line);
			const targetHex =
				"#" +
				r.toString(16).toUpperCase().padStart(2, "0") +
				g.toString(16).toUpperCase().padStart(2, "0") +
				b.toString(16).toUpperCase().padStart(2, "0");

			const idx = Colors.findIndex((c) => c.toUpperCase() === targetHex);
			if (idx !== -1 && idx < Colors.length - 1) {
				newActiveColors.push(idx);
			}
		} catch (e) {
			console.warn("Skipping invalid color:", line);
		}
	}

	newActiveColors.push(Colors.length - 1);

	activeColors = [...new Set(newActiveColors)];
	localStorage.setItem("activeColors", JSON.stringify(activeColors));

	SetColorsProfile();
	SetColors();
	if (activeColors.length > 0) {
		changeColor(Colors[activeColors[0]]);
	}

	console.log("Enabled palette updated with", activeColors.length - 1, "colors");
}
//#endregion

//#region Ghost Image Palette Commands
function get_ghost_palette() {
	if (!ghostImageColors || ghostImageColors.length === 0) {
		console.log("No ghost image loaded");
		return "";
	}

	const output = ghostImageColors
		.map((rgba) => {
			const parts = rgba.substring(5, rgba.length - 1).split(",");
			return format_simple_color([parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])]);
		})
		.join("\n");

	console.log(output);
	return output;
}

function get_enabled_ghost_palette() {
	if (!ghostImageActiveColors || ghostImageActiveColors.size === 0) {
		console.log("No ghost colors enabled");
		return "";
	}

	const output = Array.from(ghostImageActiveColors)
		.map((rgba) => {
			const parts = rgba.substring(5, rgba.length - 1).split(",");
			return format_simple_color([parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])]);
		})
		.join("\n");

	console.log(output);
	return output;
}

function set_enabled_ghost_palette(colorString) {
	if (!ghostImageColors || ghostImageColors.length === 0) {
		console.log("No ghost image loaded");
		return;
	}

	const lines = colorString
		.trim()
		.split("\n")
		.filter((l) => l.trim());
	const newActiveSet = new Set();

	for (const line of lines) {
		try {
			const [r, g, b] = parse_color(line);
			const targetRgba = `rgba(${r},${g},${b},1)`;

			if (ghostImageColors.includes(targetRgba)) {
				newActiveSet.add(targetRgba);
			}
		} catch (e) {
			console.warn("Skipping invalid color:", line);
		}
	}

	ghostImageActiveColors = newActiveSet;
	populateColorPaletteUI();
	regenerateGhostCanvas();
	drawGhostImageOnCanvas();

	console.log("Ghost palette updated with", newActiveSet.size, "enabled colors");
}

function set_ghost_enabled_owned_colors() {
	if (!ghostImageColors || ghostImageColors.length === 0) {
		console.log("No ghost image loaded");
		return;
	}

	const ownedRgbaSet = new Set(
		Colors.slice(0, -1).map((hex) => {
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			return `rgba(${r},${g},${b},1)`;
		})
	);

	const ownedGhostColors = ghostImageColors.filter((rgba) => ownedRgbaSet.has(rgba));

	ghostImageActiveColors = new Set(ownedGhostColors);

	populateColorPaletteUI();
	regenerateGhostCanvas();
	drawGhostImageOnCanvas();

	console.log(
		`Enabled ${ownedGhostColors.length} owned colors out of ${ghostImageColors.length} ghost colors`
	);
}

function set_both(s) {
	set_enabled_palette(s);
	set_enabled_ghost_palette(s);
}
//#endregion

//#region Navigation
function goto_coords(input, zoom = 16) {
	const gridSize = window.gridSize || 25;
	let coordString;

	if (!input) {
		const urlParams = new URLSearchParams(window.location.search);
		coordString = urlParams.get("coords") || urlParams.get("key");
		if (!coordString) {
			console.error("No coordinates provided and none found in URL");
			return;
		}
		console.log(`Using coords from page URL: ${coordString}`);
	} else if (input.includes("http") || input.includes("?coords=") || input.includes("?key=")) {
		try {
			const url = new URL(input.includes("http") ? input : "https://www.geopixels.net/" + input);
			coordString = url.searchParams.get("coords") || url.searchParams.get("key");
			if (!coordString) {
				console.error("No coords parameter found in URL");
				return;
			}
			console.log(`Extracted coords from URL: ${coordString}`);
		} catch (e) {
			console.error("Invalid URL format");
			return;
		}
	} else {
		coordString = input;
	}

	const parts = coordString.trim().split(",");
	if (parts.length !== 2) {
		console.error('Invalid format. Use: "gridX,gridY"');
		return;
	}

	const gridX = parseInt(parts[0].trim(), 10);
	const gridY = parseInt(parts[1].trim(), 10);

	if (isNaN(gridX) || isNaN(gridY)) {
		console.error("Invalid coordinates");
		return;
	}

	const mercX = gridX * gridSize;
	const mercY = gridY * gridSize;
	const lngLat = turf.toWgs84([mercX, mercY]);

	map.setCenter([lngLat[0], lngLat[1]]);
	map.setZoom(zoom);

	console.log(`Moved to (${gridX}, ${gridY})`);
}
//#endregion

//#region UI Helpers
function copyToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			alert("Copied to clipboard!");
		})
		.catch((err) => {
			console.error("Failed to copy:", err);
			alert("Failed to copy to clipboard");
		});
}

function createColorInputModal(title, placeholder, onSubmit) {
	// Create modal overlay
	const overlay = document.createElement("div");
	overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

	// Create modal content
	const modal = document.createElement("div");
	modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    `;

	modal.innerHTML = `
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">${title}</h2>
        <textarea
            id="colorInputTextarea"
            placeholder="${placeholder}"
            style="
                width: 100%;
                height: 200px;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-family: monospace;
                font-size: 14px;
                resize: vertical;
                box-sizing: border-box;
            "
        ></textarea>
        <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
            <button
                id="colorInputCancel"
                style="
                    padding: 8px 16px;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                "
            >Cancel</button>
            <button
                id="colorInputSubmit"
                style="
                    padding: 8px 16px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                "
            >Submit</button>
        </div>
    `;

	overlay.appendChild(modal);
	document.body.appendChild(overlay);

	const textarea = modal.querySelector("#colorInputTextarea");
	const cancelBtn = modal.querySelector("#colorInputCancel");
	const submitBtn = modal.querySelector("#colorInputSubmit");

	// Focus textarea
	setTimeout(() => textarea.focus(), 100);

	// Close modal function
	const closeModal = () => {
		document.body.removeChild(overlay);
	};

	// Cancel button
	cancelBtn.onclick = closeModal;

	// Submit button
	submitBtn.onclick = () => {
		const value = textarea.value.trim();
		if (value) {
			onSubmit(value);
		}
		closeModal();
	};

	// Click outside to close
	overlay.onclick = (e) => {
		if (e.target === overlay) {
			closeModal();
		}
	};

	// ESC to close
	const escHandler = (e) => {
		if (e.key === "Escape") {
			closeModal();
			document.removeEventListener("keydown", escHandler);
		}
	};
	document.addEventListener("keydown", escHandler);
}

function promptForColors(action, title = "Enter Colors") {
	createColorInputModal(
		title,
		"Enter colors (one per line)\nFormat: RRGGBB (or regex (FF|#)?RRGGBB( .+)?)\nExample:\nFF0000\n00FF00\n0000FF",
		action
	);
}
//#endregion

//#region Main Script
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

	// Add buttons to ghost palette container
	const paletteButtonsContainer = document.querySelector("#ghostColorPaletteContainer>div");
	if (paletteButtonsContainer) {
		const buttonClass =
			"px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition cursor-pointer";

		// Original button
		const onlyShowOwnedGhostColorsButton = document.createElement("button");
		onlyShowOwnedGhostColorsButton.className = buttonClass;
		onlyShowOwnedGhostColorsButton.innerText = "Only Show Owned Ghost Colors";
		onlyShowOwnedGhostColorsButton.onclick = onlyShowOwnedGhostColors;
		paletteButtonsContainer.appendChild(onlyShowOwnedGhostColorsButton);

		// Get Ghost Colors button
		const getGhostColorsBtn = document.createElement("button");
		getGhostColorsBtn.className = buttonClass;
		getGhostColorsBtn.innerText = "Get Ghost Colors";
		getGhostColorsBtn.onclick = () => copyToClipboard(get_ghost_palette());
		paletteButtonsContainer.appendChild(getGhostColorsBtn);

		// Get Enabled Ghost Colors button
		const getEnabledGhostBtn = document.createElement("button");
		getEnabledGhostBtn.className = buttonClass;
		getEnabledGhostBtn.innerText = "Get Enabled Ghost Colors";
		getEnabledGhostBtn.onclick = () => copyToClipboard(get_enabled_ghost_palette());
		paletteButtonsContainer.appendChild(getEnabledGhostBtn);

		// Set Enabled Ghost Colors button
		const setEnabledGhostBtn = document.createElement("button");
		setEnabledGhostBtn.className = buttonClass;
		setEnabledGhostBtn.innerText = "Set Enabled Ghost Colors";
		setEnabledGhostBtn.onclick = () =>
			promptForColors(set_enabled_ghost_palette, "Set Enabled Ghost Colors");
		paletteButtonsContainer.appendChild(setEnabledGhostBtn);
	}

	// Add buttons to shop (profile panel)
	const shopButtonsContainer = document.querySelector(
		"#profilePanel > section:nth-child(5) > div:nth-child(2) > div.mt-4"
	);
	if (shopButtonsContainer) {
		const buttonClass =
			"px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition cursor-pointer";

		// Get User Colors button
		const getUserColorsBtn = document.createElement("button");
		getUserColorsBtn.className = buttonClass;
		getUserColorsBtn.innerText = "Get User Colors";
		getUserColorsBtn.onclick = () => copyToClipboard(get_user_palette());
		shopButtonsContainer.appendChild(getUserColorsBtn);

		// Get Enabled Colors button
		const getEnabledBtn = document.createElement("button");
		getEnabledBtn.className = buttonClass;
		getEnabledBtn.innerText = "Get Enabled Colors";
		getEnabledBtn.onclick = () => copyToClipboard(get_enabled_palette());
		shopButtonsContainer.appendChild(getEnabledBtn);

		// Set Enabled Colors button
		const setEnabledBtn = document.createElement("button");
		setEnabledBtn.className = buttonClass;
		setEnabledBtn.innerText = "Set Enabled Colors";
		setEnabledBtn.onclick = () => promptForColors(set_enabled_palette, "Set Enabled User Colors");
		shopButtonsContainer.appendChild(setEnabledBtn);
	}

	// Add goto button to menu group dropdown
	const menuGroupDropdown = document.querySelector("#menuGroupDropdown");
	if (menuGroupDropdown) {
		const gotoBtn = document.createElement("button");
		gotoBtn.className =
			"w-10 h-10 bg-white shadow rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer";
		gotoBtn.title = "Go to Coordinates";
		gotoBtn.innerHTML = "🎯";
		gotoBtn.onclick = () => {
			const input = prompt("Enter coordinates (gridX,gridY) or GeoPixels URL:");
			if (input) {
				goto_coords(input);
			}
		};
		menuGroupDropdown.appendChild(gotoBtn);
	}

	// Add set_both button to tools group dropdown
	const toolsGroupDropdown = document.querySelector("#toolsGroupDropdown");
	if (toolsGroupDropdown) {
		const setBothBtn = document.createElement("button");
		setBothBtn.className =
			"w-10 h-10 bg-white shadow rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer";
		setBothBtn.title = "Set Both Palettes";
		setBothBtn.innerHTML = "🧪";
		setBothBtn.onclick = () => promptForColors(set_both);
		toolsGroupDropdown.appendChild(setBothBtn);
	}

	// Log available commands
	console.log("GeoPixels++ Enhanced loaded!");
	console.log("Available commands:");
	console.log("- goto_coords(coords/url)");
	console.log("- get_user_palette()");
	console.log("- get_enabled_palette()");
	console.log("- set_enabled_palette(colors)");
	console.log("- get_ghost_palette()");
	console.log("- get_enabled_ghost_palette()");
	console.log("- set_enabled_ghost_palette(colors)");
	console.log("- set_ghost_enabled_owned_colors()");
	console.log("- set_both(colors)");
})();
//#endregion
