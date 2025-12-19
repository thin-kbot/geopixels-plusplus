# GeoPixels++
A bunch of QOL features for [GeoPixels](https://geopixels.net/) :
- Add buttons to the ghost's UI ("Enable Only Owned Ghost Colors", "Get Ghost Colors", "Get Enabled Ghost Colors", "Set Enabled Ghost Colors")
- Add buttons to the shop/profile UI ("Get User Colors", "Get Enabled Colors", "Set Enabled Colors")
- Add a main menu item `GeoPxels++` with the these buttons :
  - `🎯` "Go to Coordinates" : moves to given coordinates (accepts coordinates or GeoPixels URLs)
  - `🧪` "Set Both Palettes" : sets user and ghost palettes simultaneously
  - `🎵` "Change Sound" : change the sounds of the website
  - `🚫` "Censor" : ability to censor part of the canvas
    - "Toggle censor mode" : enter "censor mode" => draw censor rectangles directly on the canvas
  - `⚙️` "Settings"
- Add new keybinds in the website's keybind menu (see/change them in the settings or in geopixels' "Keyboard Shortcut" menu)

## installation
1. install [Violentmonkey](https://violentmonkey.github.io/) ([![Firefox Addons](https://www.readmecodegen.com/api/social-icon?name=firefoxbrowser&size=16)](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)/[![Chrome webstore](https://www.readmecodegen.com/api/social-icon?name=chromewebstore&size=16)](https://chromewebstore.google.com/detail/jinjaccalgkegednnccohejagnlnfdag)) or [Tampermonkey](https://www.tampermonkey.net/) ([![Firefox Addons](https://www.readmecodegen.com/api/social-icon?name=firefoxbrowser&size=16)](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)/[![Chrome webstore](https://www.readmecodegen.com/api/social-icon?name=chromewebstore&size=16)](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [click here](https://github.com/thin-kbot/geopixels-plusplus/raw/refs/heads/main/geopixels++.user.js)

## Contributing
Feel free to fork the repository and submit pull requests.\
If you find any issues or have suggestions for new features, please open an issue on GitHub.\
If you want to contribute but aren't sure what to do, check the [todo list](CHANGELOG.md#unreleased-todo).

Or here's a list of easy things to do :
- **Adding Keyboard shortcuts** => add a key/value to the `KEY_BINDINGS` global const :
  - key must be camelCase, not starting with a number
  - value object :
    - `text` : String that will be shown on editing modals
    - `defaultKey` *(optional)* : single lowerCase char to be used as the default keybind
    - `keydown` *(optional)* : function to trigger on "keydown" event (will be given the event as an argument)
    - `keyup` *(optional)* : same as above for "keyup" event

- **Adding Themes** => Add a key/value to the `THEMES` global const :
  - key must be camelCase, not starting with a number
  - value object : 
    - `name` : String that will be shown on editing modals
    - `style` : String or function returning a string to put into a `<style></style>` element on the page (the css)

- **Adding Settings** => Add a key/value to the `SETTINGS` global const :
  - key must be camelCase, not starting with a number
  - value object : 
    - `name` : String that will be shown on editing modals
    - `element` : HTML element to use to edit this setting
      - if element is "select" => "value object" must also include an `options` array
    - `category` : category to use for this setting
      - has to be part of `SETTINGS_CATEGORIES`
    - `default` *(optional)* : default value (adds a "reset" button to the setting in the UI)
    - `reset` *(optional)* : if this function is defined, is used when clicking the "reset" button that gets added to the settings (if not, the "default" value is used)
    - `value` *(optional)* : function that returns the value for the element to be initialized with *(useful to set the value of the element if it's not a saved setting)*
    - `init` *(optional)* : function called with the created element as an argument when it is initialized
    - `apply` *(optional)* : if this function is defined, is called at the start of the script with the saved value as an argument for init purposes
    - `attributes` : an object that will be assigned to the element as it's attributes\
    examples :
      - `type` : often needed if `element` is "input" to set the type of input
      - `onchange` : function that will be called when the element is changed *(often here that you will have your `saveSetting("censorAlpha", e.target.value);` function called)*
      - `oninput` : function that will be called when the element receives an input

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