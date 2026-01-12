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
- Add new keybinds (see/change them in the settings or in geopixels' "Keyboard Shortcut" menu)
- Ghost Image's progress by color

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

## 🙏 Support this project
If you like this project and want to support its development, consider giving it a star on GitHub! Your support is greatly appreciated. ⭐

You can also support me on Ko-fi:\
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/R5R81S5JO6)

Or using cryptocurrencies:

|[![Solana](https://img.shields.io/badge/Solana-donate-9945FF?logo=solana)](https://explorer.solana.com/address/FUpwyXmyjTGCUbmJfcPze6rijJYBgCHPyVCNKxr6MswG)|[![Bitcoin](https://img.shields.io/badge/Bitcoin-donate-yellow?logo=bitcoin)](https://blockstream.info/address/1ENy88PLJ3g7HKYmm7vSgCSbWBkSVGmVV3)|[![Ethereum](https://img.shields.io/badge/Ethereum-donate-blue?logo=ethereum)](https://etherscan.io/address/0x74F9021A2f8Cd4Aa5e15360eF008aA2725214BcD)|[![TRON](https://img.shields.io/badge/TRON-donate-ff6600?logo=tron)](https://tronscan.org/#/address/TVLy2r4ZsUvazkPB6f8v3qfH8vH9VPPwu8)|
|:-:|:-:|:-:|:-:|
|FUpwyXmyjTGCUbmJfcPze6rijJYBgCHPyVCNKxr6MswG|1ENy88PLJ3g7HKYmm7vSgCSbWBkSVGmVV3|0x74F9021A2f8Cd4Aa5e15360eF008aA2725214BcD|TVLy2r4ZsUvazkPB6f8v3qfH8vH9VPPwu8|
|<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=solana:FUpwyXmyjTGCUbmJfcPze6rijJYBgCHPyVCNKxr6MswG" alt="SOL QR" width="150"/>|<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:1ENy88PLJ3g7HKYmm7vSgCSbWBkSVGmVV3" alt="BTC QR" width="150"/>|<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ethereum:0x74F9021A2f8Cd4Aa5e15360eF008aA2725214BcD" alt="ETH QR" width="150"/>|<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tron:TVLy2r4ZsUvazkPB6f8v3qfH8vH9VPPwu8" alt="TRON QR" width="150"/>|

*Thank you for your support!* 🙌