# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] (todo)

- being able to switch from multiple ghost images
- persistent map theme
- UI theme (dark mode)
- make buttons less messy in the existing UI
- toggle ghost visibility
- make syncable censors
  - export/import censors
- better censors management

## [0.3.1] - 2025-10-08
## Moddified
- Added a `createModal` function and modified `createColorInputModal` to use it for a more modular code

## [0.3.0] - 2025-10-08
## Added
- being able to censor part of the canvas

## [0.2.3] - 2025-10-08
## Changed
- make a new "menuSelectButton" instead of that shit select inside the button that was there before

## [0.2.2] - 2025-10-07
## Changed
- fix hex parsing (accept any character after the hex)
- when changing the user's palette, if the selected color is still in the palette, keep it

## [0.2.1] - 2025-10-05
## Changed
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
