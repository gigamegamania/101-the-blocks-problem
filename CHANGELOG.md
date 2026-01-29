# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### UI/UX Improvements

#### Layout & Structure
- **Two-column layout**: Restructured the application into a two-column grid layout
  - Left column: Input section with textarea, helper text, and quick commands
  - Right column: Output section displaying results
  - Full-width responsive design that stacks vertically on mobile devices (< 768px)
  - Removed max-width constraints to utilize full screen width

- **Section headers**: Created reusable `SectionHeader` component for consistent styling
  - Ensures "Input:" and "Output:" headings have identical margins and styling
  - Green accent color (#42b883) for visual consistency

#### Input Field Enhancements
- **Removed redundant label**: Removed "Enter text:" label for cleaner interface
- **Hover effects**: Added visual feedback on textarea hover
  - Border color changes to medium gray (#999) on hover
  - Green border (#42b883) on focus for clear active state indication
  - Smooth transitions for better user experience

- **Improved contrast**: Enhanced text readability for dark theme
  - Changed helper text color from dark gray (#666) to lighter gray (#aaa) for better visibility
  - Updated input text color to light gray (#ccc) for improved readability
  - Removed white backgrounds from example code blocks

#### Helper Text & Documentation
- **Input format explanation**: Added comprehensive helper text below the input field
  - Explains the expected input format (number of blocks, commands, quit)
  - Includes example input with proper formatting
  - Displays example as regular text (no background box) for cleaner appearance

- **Illegal commands rule**: Added explanation of illegal command rules below the example
  - Documents that commands where `a = b` are illegal
  - Documents that commands where blocks are in the same stack are illegal
  - Helps users understand why certain commands are ignored

### Features

#### Quick Command Buttons
- **Quick command tags**: Added clickable command buttons for faster input
  - Positioned on the right side of the textarea for easy access
  - Includes all valid commands: `move A onto B`, `move A over B`, `pile A onto B`, `pile A over B`, `quit`
  - Commands insert with placeholder text (A, B) that users can replace with actual block numbers
  - Automatically adds newline when appending to existing input
  - Styled as small tag-like buttons with hover effects

- **Tooltips**: Added informative tooltips on hover for each quick command button
  - Explains what each command does when hovering over the button
  - Tooltips appear to the right of buttons with dark background
  - Includes arrow pointer connecting tooltip to button
  - Responsive design that adapts to screen size

#### Illegal Command Detection & Display
- **Frontend filtering**: Implemented illegal command detection before sending to backend
  - Detects commands where `a = b` (e.g., "move 0 onto 0")
  - Detects commands where blocks are already in the same stack
  - Filters illegal commands from input before processing
  - Prevents illegal commands from affecting the output state

- **Illegal commands display**: Shows ignored illegal commands below the output
  - Displays list of illegal commands with explanations
  - Each command shows why it's illegal:
    - "Block X cannot be moved onto itself (a = b)"
    - "Blocks X and Y are already in the same stack"
  - Styled with orange/warning theme to indicate ignored commands
  - Command text in monospace with orange color, reason in italic gray text

- **State simulation**: Implemented block state tracking to detect same-stack conditions
  - Simulates command execution sequentially to track block positions
  - Maintains accurate state for detecting illegal commands in subsequent operations
  - Ensures proper detection even when multiple commands affect block positions

### Bug Fixes

#### Illegal Command Handling
- **Fixed illegal command execution**: Illegal commands are now completely ignored
  - Previously, illegal commands were partially processed by the backend
  - Now filtered out before sending to backend, ensuring they have zero effect on output
  - Example: "move 0 onto 0" no longer clears block 0's position
  - Output remains unchanged when only illegal commands are entered

### Code Quality

#### Documentation & Comments
- **Comprehensive code comments**: Added detailed documentation to `filterIllegalCommands` function
  - Explains why filtering happens in frontend vs backend
  - Documents the two illegal command conditions with examples
  - Explains state simulation logic and why it's necessary
  - Includes JSDoc comments for function parameters and return values
  - Clarifies command execution flow and state tracking

### Technical Changes

#### Component Architecture
- **Reusable components**: Created `SectionHeader.vue` component
  - Promotes code reusability and consistency
  - Centralized styling for section headings
  - Easy to maintain and update

#### CSS Improvements
- **Removed layout constraints**: Updated `main.css` to allow full-width layout
  - Removed `max-width: 1280px` constraint from `#app`
  - Changed body display from flex to block for proper layout
  - Removed conflicting grid layout on `#app` element

#### State Management
- **Illegal command tracking**: Enhanced state management for illegal commands
  - Changed from simple string array to object array with command and reason
  - Enables detailed explanations for each illegal command
  - Improves user understanding of why commands are rejected
