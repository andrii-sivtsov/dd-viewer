# DDViewer

A lightweight, dependency-free JavaScript image viewer for modal display.
Designed to work with container elements that contain an <img> tag inside.

## Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/andrii-sivtsov/ddviewer/dist/ddviewer.umd.min.js"></script>
```

## ES module

```javascript
import DDViewer from './ddviewer.js'
```

## Usage

### HTML structure\*

Your selector must target a container with an <img> inside.

```html
<div class="gallery-item">
	<img src="image.jpg" alt="" />
</div>
```

### Initialize

```javascript
new DDViewer('.gallery-item', {
	styles: false,
	hooks: {
		open: ({ root }) => {
			root.style.visibility = 'visible'
			root.style.pointerEvents = 'auto'
		},
		close: ({ root }) => {
			root.style.visibility = 'hidden'
			root.style.pointerEvents = 'none'
		},
	},
})
```

### Options

```javascript
{
  // Injects default inline styles into modal elements
  styles: true, // boolean

  // Closes modal when clicking outside the image
  closeOnOverlay: true, // boolean

  // Functions called on open/close
  hooks: { open: null, close: null }, // { open?: Function, close?: Function }

  // Watch for dynamically added content:
  // false — no watching
  // 'auto' — MutationObserver on document.body
  // { button: 'selector' } — rebind after clicking a specific button
  watchAsyncContent: false, // false | 'auto' | { button: string }

  // Modal mount mode:
  // 'auto' — create modal automatically
  // 'manual' — expect modal markup in DOM
  mount: 'auto', // 'auto' | 'manual'

  // Modal structure (created in 'auto' mode if template is not provided)
  ui: {
    root: { el: 'div', class: 'ddlb-modal', attrs: { 'aria-hidden': 'true' } },
    window: { el: 'div', class: 'ddlb-modal-window', attrs: {} },
    img: { el: 'img', class: 'ddlb-modal-image', attrs: { alt: '' } },
  },

  // Custom HTML template function (overrides ui)
  template: null, // null | (ui) => string | Node

  // Selectors for manual mount mode
  selectors: { root: '.ddlb-modal', img: '.ddlb-modal-image' },
}
```

### Public API

```javascript
viewer.open(src: string)
// Opens modal with the given image source

viewer.close()
// Closes the modal
```

### Tips

- Change modal HTML structure with `ui` or `template`
- Use `manual` mount mode if you already have modal HTML in your DOM
- `watchAsyncContent` is useful when your gallery is loaded dynamically (AJAX, infinite scroll, etc.)
