# Changelog

All notable changes to Suluu are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
Suluu adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- SpotlightCard, a quiet card surface whose warm light trails fine-pointer
  movement on a spring with a little mass, fades away more slowly than it
  arrives, and never cuts hard against the card edge.
- SlideControl, a range slider whose fill follows the thumb with a little mass.
- Toaster and `toast()`, a quiet toast deck that peeks four, springs the front
  three apart on hover, and scrolls the rest of the deck into view.

### Changed

- Toast collapse gathers back into the peek on the pinned edge, with a more
  damped spring than expand, so a tall or scrolled deck no longer jumps off the
  corner.

## [0.1.0] - 2026-08-19

### Added

- Initial release with MagnetPull, MorphButton, NotifyMorph, SearchMorph,
  SwitchToggle, SegmentedControl, and CounterNumbers.
