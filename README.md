# GeoPixels++
A bunch of QOL features for [GeoPixels](https://geopixels.net/) :
- Add buttons to the ghost's UI :
  - "Enable Only Owned Ghost Colors" : activates only ghost colors you own
  - "Get Ghost Colors" : copies all ghost colors to clipboard
  - "Get Enabled Ghost Colors" : copies currently enabled ghost colors to clipboard
  - "Set Enabled Ghost Colors" : set enabled ghost colors from clipboard or manual input
- Add buttons to the shop/profile UI :
  - "Get User Colors" : copies all user colors to clipboard
  - "Get Enabled Colors" : copies currently enabled user colors to clipboard
  - "Set Enabled Colors" : set enabled user colors from clipboard or manual input
- Add a main menu item `GeoPxels++` with the these buttons :
  - `🎯` "Go to Coordinates" : moves to given coordinates (accepts coordinates or GeoPixels URLs)
  - `🧪` "Set Both Palettes" : sets user and ghost palettes simultaneously
  - `🎵` "Change Sound" : change the sounds of the website
  - `🚫` "Censor" : ability to censor part of the canvas
    - "add a new censor manually" : input manually the parameters of your censor
    - "Toggle censor mode" : enter "censor mode" => draw censor rectangles directly on the canvas
    - "clear censors" : delete all you censor rectangles
    - "import censors (replace)" : replace your current censor configuration with the one you input
    - "import censors (add)" : add all censors inputed to your config
- Add new keybinds in the website's keybind menu : 
  - "Toggle ghost image" : self explaining
  - "Set ghost image's top left" : self explaining

## installation
1. install [Violentmonkey](https://violentmonkey.github.io/) ([![Firefox Addons](https://www.readmecodegen.com/api/social-icon?name=firefoxbrowser&size=16)](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)/[![Chrome webstore](https://www.readmecodegen.com/api/social-icon?name=chromewebstore&size=16)](https://chromewebstore.google.com/detail/jinjaccalgkegednnccohejagnlnfdag)) or [Tampermonkey](https://www.tampermonkey.net/) ([![Firefox Addons](https://www.readmecodegen.com/api/social-icon?name=firefoxbrowser&size=16)](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)/[![Chrome webstore](https://www.readmecodegen.com/api/social-icon?name=chromewebstore&size=16)](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [click here](https://github.com/thin-kbot/geopixels-plusplus/raw/refs/heads/main/geopixels++.user.js)

## Contributing
Feel free to fork the repository and submit pull requests.\
If you find any issues or have suggestions for new features, please open an issue on GitHub.\
If you want to contribute but aren't sure what to do, check the [todo list](CHANGELOG.md#unreleased-todo).

## Versioning
This project uses **ZeroVer (0-based Versioning)** as described at [0ver.org](https://0ver.org/).

**What this means:**
- All releases maintain major version 0 (e.g., 0.5.0, 0.12.3)
- Minor version increments indicate feature additions
- Patch version increments indicate bug fixes

## Change log
See [CHANGELOG.md](CHANGELOG.md)

## License
This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE.md) file for details.