ngx-query-builder Changelog
===========================

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Unique `switchGroupId` per component instance to isolate nested AND/OR radio groups.
- Additional unit test coverage for `QueryBuilderComponent`, including radio-group isolation scenarios.
- Dedicated TypeScript configuration files to improve IDE support in JetBrains/WebStorm.

### Changed
- Upgraded the workspace and library metadata to Angular 22.
- Refined event handling and lint configuration in line with Angular 21 conventions.
- Updated TypeScript and deprecation-related compiler settings.
- Refactored query builder and query value typings for stricter type safety.
- Updated package metadata and cleaned imports for Angular 21 compatibility.

### Fixed
- Improved default accessibility behavior in query builder controls.
- Removed unused imports in the query builder implementation.

## [21.0.0]

### Added
- Comprehensive unit test suite and Playwright end-to-end tests for core library behavior.

### Changed
- Upgraded the project from Angular 19 to Angular 21.
- Modernized and optimized component/demo styling.

### Fixed
- Fixed collapse toggle behavior with OnPush change detection.
- Fixed layout regressions in switch and rule rows.
- Restored native dropdown arrow behavior on select controls.

## [0.5.0]

### Changed
- Upgraded to Angular 8.
- Added an option to persist value on rule change.

## [0.4.0]

### Added
- Added `coerceValueForOperator` in config to handle value transitions when operators change.
- Added `treeContainer`, `collapsed`, `arrowIcon`, and `arrowIconButton` to `classNames`.
- Added `queryArrowIcon` structural directive to override collapse arrow icon.
- Added `allowCollapse` to enable accordion/collapse mode. (#66)

### Fixed
- Fixed issue where switching operators changed select to multiple and caused invalid value errors. (#69)

## [0.3.3]

### Fixed
- Fixed `queryEmptyWarning` directive not being passed to nested rules.

## [0.3.2]

### Added
- Added `queryEmptyWarning` directive for custom empty warning messages.
- Added `[emptyMessage]` to override the default empty message text.

## [0.3.1]

### Added
- Added `[disabled]` support. (#61)

### Changed
- Updated add-rule behavior to use `Field.defaultValue` as the initial value.
- Updated Angular Material dependencies in demos to 6.0.
- Applied vanilla CSS styling improvements.

### Fixed
- Fixed touched state not updating when changing query condition (AND/OR).

## [0.3.0]

### Added
- Added `onChange` callback support to `queryEntity`, `queryInput`, and `queryOperator` directives for custom component integration.
- Added proper touched behavior support for reactive form usage. (See #49)
- Added entity mode. (See #22)

### Changed
- **Breaking:** Renamed `changeField` callback to `onChange` for `queryField` directive.
- Applied minor CSS styling improvements for the default component.

### Fixed
- Fixed `[value]` unrecognized property binding.
- Fixed `QueryBuilderClassNames` export as an interface.
- Fixed `in` operator behavior so multi-select applies only to `category` and `boolean`.

## [0.2.5]

### Fixed
- Fixed root remove-ruleset button visibility.
- Fixed default value bug where only the first character of the operator was shown.
- Fixed inability to override multiselect operators (`is in`, `is not in`).

## [0.2.4]

### Added
- Added `QueryBuilderClassNames` interface.
- Added Bootstrap 4 example.

### Changed
- Rewrote CSS for more extensible class overrides.

### Fixed
- Fixed a validation issue causing incorrect `ngModel` values.

## [0.2.3]

### Added
- Added validator function support on `Field` config.

### Fixed
- Fixed IE11 compatibility (ES5 target).
- Fixed invalid/valid state handling.
