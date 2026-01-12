# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [ZeroVer](https://0ver.org/) versioning.

## [Unreleased] (todo)
- being able to switch from multiple ghost images
- make syncable censors
- save ghost image with position (import/export) ([issue#1](https://github.com/thin-kbot/geopixels-plusplus/issues/1))
- zoom based on pixel size ([issue#3](https://github.com/thin-kbot/geopixels-plusplus/issues/3))
- Buy colors by bulk or from ghost
- pipette-like keybind to activate only that color in both palettes
- fix z-index of censors for right menu buttons (can also fix other geopixels' z-index issues)

## [0.7.0] - 2025-12-30
### Changed
- Accept directly Strings as well as functions for themes
### Added
- Make censors editable with ctrl + right click
- Support for checkboxes in the settings
- "Interact with censors out of censor mode" setting => if checked, you can delete/edit censor rects event when out of censor mode
- Ghost Image's progress by color *(code modified from `Phlegethonia`)*
### Fixed
- Dark theme for pfp and banner

## [0.6.0] - 2025-12-18
### Changed
- Small visual improvement to the `SelectMenuButton` component
- Decluttered the ghost's and profile's UI by making the buttons collapsible
- Changed the `createModal` function to be more usable for other modals + take actual elements and not an html string
- Changed keybinds saving format to be more logical
- small refactor of the censor drawing code
- Changed `makeBasicButton` to be able to style them easier (and added `COLOR_CLASS` with some presets)
- Removed `createColorInputModal` and put it's functionality in `promptForColors` as that was the only place it would ever be used
### Added
- 'Add one Censor Rect at Mouse' keybind => simulates the mouse click action when censor mode is enabled
- Improvements to Censoring :
  - Option to delete censors with right click when in censor mode
  - Make it possible to still pan with MMB and zoom with scroll wheel in the canvas while in censor mode
  - Censors config modal (see each censor rects as a list and can edit each of it's properties + delete them)
- Settings modal with :
  - 'UI Theme' (added dark mode, is set as default if the user has dark mode as their default system theme)
  - 'Censor' (color and alpha + json textarea)
- `saveKeybind` function (save a single keybind by it's key)
### Fixed
- Fix the Censors not showing on page load until an interaction with the map happens
- Censors being offset by .5 of a pixel
- Make the `SelectMenuButton` close when another one is opened or when the menu is closed
- Fix clicks on labels not focusing the inputs in the modals
### Removed
- "add a new censor manually", "clear censors", "export censors", "import censors (replace)" and "import censors (add)" buttons from the Censors SelectMenuButton

## [0.5.3] - 2025-11-05
### Changed
- moved single use functions inside the button call that uses them
- moved 'Global variables', 'Utils' and 'Color Utils' inside `(function () { ... })()`
### Added
- 'Max charges reached' sound change option
- 'Toggle Censor Mode' keybind
### Fixed
- Fix changing ghost palette colors since main script's variables change

## [0.5.2] - 2025-10-21
### Fixed
- fix ghost's palette functions since main script's variables rename
- fix custom sounds sometimes not loading properly

## [0.5.1] - 2025-10-10
### Fixed
- fix saving the keybinds

## [0.5.0] - 2025-10-09
### Added
- Ability to import and export censors
- Very modular keybind setup + added two new keybinds : 
  - "Toggle ghost image"
  - "Set ghost image's top left"
### Changed
- always keep the transparent 'color' selected when setting the user palette
### Fixed
- fix `Cannot read properties of undefined (reading 'toLowerCase')` when setting user colors with no color selected to paint
- fix not seeing the drawing of the first rect when in "censor mode"

## [0.4.0] - 2025-10-08
### Added
- Added the ability to draw the censor rectangles directly on the canvas
### Changed
- Added a `createModal` function and modified `createColorInputModal` to use it for a more modular code

## [0.3.0] - 2025-10-08
### Added
- being able to censor part of the canvas

## [0.2.3] - 2025-10-08
### Changed
- make a new "menuSelectButton" instead of that shit select inside the button that was there before

## [0.2.2] - 2025-10-07
### Fixed
- fix hex parsing (accept any character after the hex)
### Changed
- when changing the user's palette, if the selected color is still in the palette, keep it

## [0.2.1] - 2025-10-05
### Changed
- move menu buttons to a new Group `GeoPixels++`

## [0.2.0] - 2025-10-05
### Added
- log function
- ability to change the sounds of the website

## [0.1.1] - 2025-10-04
### Changed
- full refactor of Observable's code to be more readable and maintainable

## [0.1.0] - 2025-10-04
### Added
- Navigation: "Go to Coordinates" button (🎯) in menu dropdown - accepts coordinates or GeoPixels URLs
- Palette tools: "Set Both Palettes" button (🧪) in tools dropdown - sets user and ghost palettes simultaneously
- Ghost palette controls: "Get Ghost Colors", "Get Enabled Ghost Colors", "Set Enabled Ghost Colors" buttons
- Shop/Profile controls: "Get User Colors", "Get Enabled Colors", "Set Enabled Colors" buttons
- Custom modal dialog for multi-line color input with textarea

## [0.0.1] - 2025-10-04
### Added
- initial release
- add a button to the ghost's UI to only show colors you own
