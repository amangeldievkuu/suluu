# Changelog

All notable changes to Suluu are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
Suluu adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- EmailMorph, a required native email field that stays a single pill until it is
  focused. The trailing cap then pinches off as a circular send action through a
  liquid water-drop neck; clicking outside or pressing Escape draws that drop
  back into the field. Controlled loading and success keep the action separated
  while the custom arrow, spinner, and check continue the same quiet motion
  language.
- RopeTimePicker, a twelve-hour analog time input with independently draggable
  rope hands, editable digital fields, AM/PM control, stepped snapping, and
  restrained spring weight that becomes immediate under reduced motion. Hour
  marks sit in a quiet orange, the cords hang with more sag, and the seconds
  hand is a thin red needle. Time is changed by dragging those dots, not the
  dial face.
- OtpInput, a one-native-input OTP and PIN field whose active wash, caret, and
  digits settle with springs. Completing the code rests the wash and swells the
  slot surfaces; clicking a slot again restores focus, and Backspace on the last
  filled slot deletes that digit.
- ThemeToggle, a compact appearance button whose custom sun and crescent trade
  places through a soft crossfade, slight counter-rotation, and controlled
  spring settlement. The surface stays quiet enough for navigation bars and
  settings rows, and the icons remain replaceable.
- FluidTabs, a row of circular tabs whose active item springs into a labeled
  pill while its neighbors make room. The active tab tints its icon and label
  with its own accent, and a single sheen of light travels the revealed label as
  it opens. It is built from a single em geometry in three sizes, follows
  `--suluu-fluid-tabs-font-size`, and clamps the active pill so a long label
  narrows instead of overflowing a small screen.
- SpotlightCard, a quiet card surface whose warm light trails fine-pointer
  movement on a spring with a little mass, fades away more slowly than it
  arrives, and never cuts hard against the card edge.
- SlideControl, a range slider whose fill follows the thumb with a little mass.
- Toaster and `toast()`, a quiet toast deck that peeks four, springs the front
  three apart on hover, and scrolls the rest of the deck into view.

### Changed

- FluidTabs keeps the active icon on a single spring instead of recentering it
  from the live pill width, so the glyph no longer shivers while the label
  opens. Inactive icons use a slightly softer charcoal.
- Toast collapse gathers back into the peek on the pinned edge, with a more
  damped spring than expand, so a tall or scrolled deck no longer jumps off the
  corner.

## [0.1.0] - 2026-08-19

### Added

- Initial release with MagnetPull, MorphButton, NotifyMorph, SearchMorph,
  SwitchToggle, SegmentedControl, and CounterNumbers.
