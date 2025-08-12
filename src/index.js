class DDViewer {
	constructor(selector, options = {}) {
		this.opts = Object.assign(
			{
				styles: true,
				closeOnOverlay: true,
				hooks: { open: null, close: null },
				watchAsyncContent: false, // false | 'auto' | { button: 'selector' }
				mount: 'auto', // 'auto' | 'manual'
				ui: {
					root: {
						el: 'div',
						class: 'ddlb-modal',
						attrs: { 'aria-hidden': 'true' },
					},
					window: { el: 'div', class: 'ddlb-modal-window', attrs: {} },
					img: { el: 'img', class: 'ddlb-modal-image', attrs: { alt: '' } },
				},
				template: null, // null | (ui) => string | Node
				selectors: { root: '.ddlb-modal', img: '.ddlb-modal-image' },
			},
			options
		)

		this.selector = selector
		this._collectElements()
		this._mount()
		this._bindElements()

		if (this.opts.watchAsyncContent) {
			this._watchAsync()
		}
	}

	_collectElements() {
		this.elements = Array.from(document.querySelectorAll(this.selector)).filter(
			el => el && el.nodeType === 1
		)

		if (!this.elements.length) {
			console.warn('[DDViewer] no elements by selector:', this.selector)
		}
	}

	_mount() {
		if (this.opts.mount === 'manual') {
			this.root = document.querySelector(this.opts.selectors.root)
			this.imgEl = document.querySelector(this.opts.selectors.img)
			if (!this.root || !this.imgEl) {
				console.warn('[DDViewer] manual mode: selectors not found')
			}
			this._bindGlobal()
			return
		}

		const existed = document.querySelector('.ddlb-modal')
		if (existed) {
			this.root = existed
			this.imgEl = existed.querySelector('.ddlb-modal-image')
			this._bindGlobal()
			return
		}

		let node = null

		// 1) custom template
		if (typeof this.opts.template === 'function') {
			const res = this.opts.template(this.opts.ui)
			if (typeof res === 'string') {
				const wrap = document.createElement('div')
				wrap.innerHTML = res.trim()
				node = wrap.firstElementChild
			} else if (res && res.nodeType === 1) {
				node = res
			}
		}

		// 2) build from ui
		if (!node) {
			const ce = (tag, cls, attrs = {}) => {
				const n = document.createElement(tag)
				if (cls) n.className = cls
				for (const k in attrs) n.setAttribute(k, attrs[k])
				return n
			}

			const ui = this.opts.ui
			const root = ce(
				ui.root.el,
				ui.root.class,
				Object.assign({ 'aria-hidden': 'true' }, ui.root.attrs)
			)
			const win = ce(ui.window.el, ui.window.class, ui.window.attrs)
			const img = ce(ui.img.el, ui.img.class, ui.img.attrs)

			if (this.opts.styles) {
				root.style.cssText =
					'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);z-index:9999;pointer-events:none;opacity:0;transition:opacity .25s ease'
				img.style.cssText =
					'max-width:100%;max-height:80vh;display:block;object-fit:contain'
				win.style.cssText =
					'width:min(92vw,1200px);max-height:90vh;overflow:hidden'
			}

			win.appendChild(img)
			root.appendChild(win)
			node = root
		}

		document.body.appendChild(node)
		this.root = node
		this.imgEl = this.root.querySelector(`.${this.opts.ui.img.class}`)
		this._bindGlobal()
	}

	_bindElements() {
		this.elements.forEach(el => {
			el.addEventListener('click', evt => {
				evt.preventDefault()
				const img = el.querySelector('img')
				const src = img && img.getAttribute('src')
				if (!src) return console.warn('[DDViewer] no <img> src inside element')
				this.open(src)
			})
		})
	}

	_bindGlobal() {
		if (this.opts.closeOnOverlay) {
			this.root.addEventListener('click', e => {
				if (e.target === this.root) this.close()
			})
		}
		document.addEventListener('keydown', e => {
			if (this.root.getAttribute('aria-hidden') === 'true') return
			if (e.key === 'Escape') this.close()
		})
	}

	_watchAsync() {
		if (this.opts.watchAsyncContent === 'auto') {
			const observer = new MutationObserver(() => {
				this._collectElements()
				this._bindElements()
			})
			observer.observe(document.body, { childList: true, subtree: true })
			return
		}
		if (
			typeof this.opts.watchAsyncContent === 'object' &&
			this.opts.watchAsyncContent.button
		) {
			const btn = document.querySelector(this.opts.watchAsyncContent.button)
			if (btn) {
				btn.addEventListener('click', () => {
					setTimeout(() => {
						this._collectElements()
						this._bindElements()
					}, 50)
				})
			}
		}
	}

	// ---------- Public API ----------
	open(src) {
		if (!src) return
		this.imgEl.src = src
		this.root.setAttribute('aria-hidden', 'false')

		if (this.opts.hooks && typeof this.opts.hooks.open === 'function') {
			this.opts.hooks.open({ root: this.root, img: this.imgEl, src })
			return
		}

		if (this.opts.styles) {
			this.root.style.pointerEvents = 'auto'
			this.root.style.opacity = '1'
		} else {
			this.root.style.pointerEvents = 'auto'
		}
	}

	close() {
		if (this.opts.hooks && typeof this.opts.hooks.close === 'function') {
			this.opts.hooks.close({ root: this.root, img: this.imgEl })
			return
		}

		if (this.opts.styles) {
			this.root.style.opacity = '0'
		}
		this.root.setAttribute('aria-hidden', 'true')
		this.root.style.pointerEvents = 'none'
	}
}

export default DDViewer
if (typeof window !== 'undefined') window.DDViewer = DDViewer
