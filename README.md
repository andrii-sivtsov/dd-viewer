# DDViewer

Lightweight, dependency-free JavaScript image viewer with optional thumbnail slider.

## Installation

**CDN**

```html
<script src="https://cdn.jsdelivr.net/gh/andrii-sivtsov/dd-viewer@0.1.1/dist/ddviewer.min.js
"></script>
```

**ES module**

```js
import DDViewer from './ddviewer.js'
```

## HTML Example (with thumbnails)

```html
<div class="gallery-item"><img src="1.jpg" alt="" /></div>
<div class="gallery-item"><img src="2.jpg" alt="" /></div>

<div class="my-modal ddlb-modal" aria-hidden="true">
	<div class="ddlb-modal-window">
		<button class="ddlb-slide-prev">‹</button>
		<img class="ddlb-modal-image" alt="" />
		<button class="ddlb-slide-next">›</button>

		<div class="ddlb-thumbs">
			<button class="ddlb-thumbs-prev">‹</button>
			<div class="ddlb-thumbs-viewport">
				<div class="ddlb-thumbs-track">
					<button class="ddlb-thumb"><img src="1.jpg" alt="" /></button>
					<button class="ddlb-thumb"><img src="2.jpg" alt="" /></button>
				</div>
			</div>
			<button class="ddlb-thumbs-next">›</button>
		</div>
	</div>
</div>
```

## Usage

```js
// With thumbnails
new DDViewer('.gallery-item', {
	mount: '.my-modal',
	thumbs: true,
})

// Without thumbnails
new DDViewer('.gallery-item', {
	mount: '.my-modal',
	thumbs: false,
})
```

## Options

- **mount** — `'auto'` or `'.selector'` to use your own modal
- **styles** — `true / false` inject default styles
- **thumbs** — `true / false` enable/disable thumbnail slider
- **closeOnOverlay** — `true / false` close on overlay click
- **watchAsyncContent** — `false`, `'auto'` or `{ button: 'selector' }`
- **hooks** — `{ open, close }` callbacks for open/close events

## Quick Start

1. Add gallery items and modal HTML
2. Include script via CDN or import
3. Init `new DDViewer()` with desired options
