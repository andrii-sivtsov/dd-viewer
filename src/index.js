// DDViewer — thumbnail strip: no-loop scroll, arrow enable/disable, EN comments
class DDViewer {
	constructor(cardSelector, options = {}) {
		this.options = Object.assign(
			{
				styles: true,
				closeOnOverlay: true,
				hooks: { open: null, close: null },
				watchAsyncContent: false, // false | 'auto' | { button: 'selector' }
				thumbs: true, // show thumbnail strip (on/off)
				mount: 'auto', // 'auto' | 'manual' | { ui: '.my-modal' }
				template: null, // null | (ui) => string | Node
				selectors: { root: '.ddlb-modal', img: '.ddlb-modal-image' }, // for manual/adopt
			},
			options
		)

		// Anchor selectors (keep as combo-classes in custom markup)
		this.ui = {
			modalRoot: '.ddlb-modal',
			modalWindow: '.ddlb-modal-window',
			modalImage: '.ddlb-modal-image',
			slidePrevBtn: '.ddlb-prev',
			slideNextBtn: '.ddlb-next',
			thumbsWrap: '.ddlb-thumbs',
			thumbsViewport: '.ddlb-thumbs-viewport',
			thumbsTrack: '.ddlb-thumbs-track',
			thumbsPrevBtn: '.ddlb-thumbs-prev',
			thumbsNextBtn: '.ddlb-thumbs-next',
			thumbButton: '.ddlb-thumb',
		}

		// Group = all cards matching selector
		this.cardSelector = cardSelector
		this.cards = []
		this.activeIndex = -1

		this._collectCards()
		this._mountModal()
		this._bindCards()

		if (this.options.watchAsyncContent) this._watchAsyncCards()
	}

	// ---------- utils ----------
	_qs(selector, root = document) {
		return root.querySelector(selector)
	}
	_qsa(selector, root = document) {
		return Array.from(root.querySelectorAll(selector))
	}

	// ---------- cards (group) ----------
	_collectCards() {
		this.cards = this._qsa(this.cardSelector).filter(
			node => node?.nodeType === 1
		)
		if (!this.cards.length)
			console.warn('[DDViewer] no cards by selector:', this.cardSelector)
	}

	_bindCards() {
		this.cards.forEach((cardEl, index) => {
			cardEl.addEventListener('click', evt => {
				evt.preventDefault()
				this.openByIndex(index)
			})
		})
	}

	_watchAsyncCards() {
		if (this.options.watchAsyncContent === 'auto') {
			const mo = new MutationObserver(() => {
				this._collectCards()
				this._bindCards()
			})
			mo.observe(document.body, { childList: true, subtree: true })
			return
		}
		if (
			typeof this.options.watchAsyncContent === 'object' &&
			this.options.watchAsyncContent.button
		) {
			const btn = this._qs(this.options.watchAsyncContent.button)
			if (btn)
				btn.addEventListener('click', () =>
					setTimeout(() => {
						this._collectCards()
						this._bindCards()
					}, 50)
				)
		}
	}

	// ---------- modal mount ----------
	_mountModal() {
		let hostContainer = null

		// Adopt existing modal by selector: { mount: { ui: '.my-modal' } }
		if (typeof this.options.mount === 'object' && this.options.mount.ui) {
			hostContainer = this._qs(this.options.mount.ui)
			if (!hostContainer) {
				console.warn('[DDViewer] mount.ui not found:', this.options.mount.ui)
				return
			}
		}

		// Manual / adopt
		if (this.options.mount === 'manual' || hostContainer) {
			const scope = hostContainer || document
			this.modalRoot = this._qs(
				this.options.selectors.root || this.ui.modalRoot,
				scope
			)
			this.modalImageEl = this._qs(
				this.options.selectors.img || this.ui.modalImage,
				scope
			)
			if (!this.modalRoot || !this.modalImageEl)
				console.warn('[DDViewer] manual/adopt: selectors not found')
			this._bindGlobalEvents()
			return
		}

		// Auto: reuse existing or build default
		const existed = this._qs(this.ui.modalRoot)
		if (existed) {
			this.modalRoot = existed
			this.modalImageEl = this._qs(this.ui.modalImage, existed)
			this._bindGlobalEvents()
			return
		}

		// Custom template
		let node = null
		if (typeof this.options.template === 'function') {
			const tpl = this.options.template(this.ui)
			if (typeof tpl === 'string') {
				const wrap = document.createElement('div')
				wrap.innerHTML = tpl.trim()
				node = wrap.firstElementChild
			} else if (tpl && tpl.nodeType === 1) node = tpl
		}

		// Default build
		if (!node) node = this._createDefaultModal()

		document.body.appendChild(node)
		this.modalRoot = node
		this.modalImageEl = this._qs(this.ui.modalImage, this.modalRoot)
		this._bindGlobalEvents()
	}

	_createDefaultModal() {
		const make = (tag, className, attrs = {}) => {
			const el = document.createElement(tag)
			if (className) el.className = className.replace(/^\./, '')
			for (const k in attrs) el.setAttribute(k, attrs[k])
			return el
		}

		const root = make('div', this.ui.modalRoot, { 'aria-hidden': 'true' })
		const windowEl = make('div', this.ui.modalWindow)
		const imageEl = make('img', this.ui.modalImage, { alt: '' })

		const slidePrevBtn = make('button', this.ui.slidePrevBtn)
		slidePrevBtn.type = 'button'
		slidePrevBtn.textContent = '‹'
		const slideNextBtn = make('button', this.ui.slideNextBtn)
		slideNextBtn.type = 'button'
		slideNextBtn.textContent = '›'

		// Thumbs (optional)
		let thumbsWrap = null,
			thumbsViewport = null,
			thumbsTrack = null,
			thumbsPrevBtn = null,
			thumbsNextBtn = null
		if (this.options.thumbs) {
			thumbsWrap = make('div', this.ui.thumbsWrap)
			thumbsPrevBtn = make('button', this.ui.thumbsPrevBtn)
			thumbsPrevBtn.type = 'button'
			thumbsPrevBtn.textContent = '‹'
			thumbsViewport = make('div', this.ui.thumbsViewport)
			thumbsTrack = make('div', this.ui.thumbsTrack)
			thumbsNextBtn = make('button', this.ui.thumbsNextBtn)
			thumbsNextBtn.type = 'button'
			thumbsNextBtn.textContent = '›'
			thumbsViewport.appendChild(thumbsTrack)
			thumbsWrap.append(thumbsPrevBtn, thumbsViewport, thumbsNextBtn)
		}

		if (this.options.styles) {
			root.style.cssText =
				'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);z-index:9999;pointer-events:none;opacity:0;transition:opacity .25s ease'
			windowEl.style.cssText =
				'position:relative;width:min(92vw,1200px);max-height:90vh;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:12px'
			imageEl.style.cssText =
				'max-width:100%;max-height:80vh;display:block;object-fit:contain'
			slidePrevBtn.style.cssText = slideNextBtn.style.cssText =
				'position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:999px;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none'
			slidePrevBtn.style.left = '12px'
			slideNextBtn.style.right = '12px'

			if (thumbsWrap) {
				thumbsWrap.style.cssText =
					'position:absolute;left:24px;right:24px;bottom:20px;display:flex;justify-content:center;align-items:center;gap:12px;pointer-events:auto'
				const btnCss =
					'width:36px;height:36px;border-radius:999px;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto;user-select:none'
				thumbsPrevBtn.style.cssText = btnCss
				thumbsNextBtn.style.cssText = btnCss
				thumbsViewport.style.cssText =
					'overflow-x:auto;max-width:100%;scrollbar-width:none;-ms-overflow-style:none'
				thumbsViewport.addEventListener(
					'wheel',
					e => {
						if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return
						e.preventDefault()
						thumbsViewport.scrollLeft += e.deltaY
					},
					{ passive: false }
				)
				thumbsViewport.style.scrollbarWidth = 'none'
				thumbsTrack.style.cssText = 'display:flex;gap:12px'
			}
		}

		windowEl.append(slidePrevBtn, imageEl, slideNextBtn)
		root.appendChild(windowEl)
		if (thumbsWrap) root.appendChild(thumbsWrap)
		return root
	}

	// ---------- global events ----------
	_bindGlobalEvents() {
		if (!this.modalRoot) return

		if (this.options.closeOnOverlay) {
			// Close on any click inside overlay EXCEPT image, frame arrows and thumbs area
			this.modalRoot.addEventListener('click', e => {
				const inImage = e.target.closest(this.ui.modalImage)
				const inPrev = e.target.closest(this.ui.slidePrevBtn)
				const inNext = e.target.closest(this.ui.slideNextBtn)
				const inThumbs = e.target.closest(this.ui.thumbsWrap)
				if (!inImage && !inPrev && !inNext && !inThumbs) this.close()
			})
		}

		document.addEventListener('keydown', e => {
			if (
				!this.modalRoot ||
				this.modalRoot.getAttribute('aria-hidden') === 'true'
			)
				return
			if (e.key === 'Escape') this.close()
			if (e.key === 'ArrowRight') this.next()
			if (e.key === 'ArrowLeft') this.prev()
		})

		const slidePrevBtn = this._qs(this.ui.slidePrevBtn, this.modalRoot)
		const slideNextBtn = this._qs(this.ui.slideNextBtn, this.modalRoot)
		slidePrevBtn && slidePrevBtn.addEventListener('click', () => this.prev())
		slideNextBtn && slideNextBtn.addEventListener('click', () => this.next())

		// Thumbs navigation (no-loop scroll at edges)
		const thumbsViewport = this._qs(this.ui.thumbsViewport, this.modalRoot)
		const thumbsTrack = this._qs(this.ui.thumbsTrack, this.modalRoot)
		const thumbsPrevBtn = this._qs(this.ui.thumbsPrevBtn, this.modalRoot)
		const thumbsNextBtn = this._qs(this.ui.thumbsNextBtn, this.modalRoot)

		// If thumbs off — hide arrows (for custom markup case)
		if (!this.options.thumbs) {
			thumbsPrevBtn && (thumbsPrevBtn.style.display = 'none')
			thumbsNextBtn && (thumbsNextBtn.style.display = 'none')
		} else if (thumbsViewport && thumbsPrevBtn && thumbsNextBtn) {
			const stepPx = () => Math.floor(thumbsViewport.clientWidth * 0.9)

			const thumbScrollTo = left => {
				thumbsViewport.scrollTo({ left, behavior: 'smooth' })
				this._updateThumbsArrows()
			}

			const clampScroll = delta => {
				const max = Math.max(
					0,
					thumbsViewport.scrollWidth - thumbsViewport.clientWidth
				)
				const target = Math.max(
					0,
					Math.min(max, Math.round(thumbsViewport.scrollLeft + delta))
				)
				thumbScrollTo(target)
			}

			thumbsPrevBtn.addEventListener('click', () => clampScroll(-stepPx()))
			thumbsNextBtn.addEventListener('click', () => clampScroll(stepPx()))
			thumbsViewport.addEventListener(
				'scroll',
				() => this._updateThumbsArrows(),
				{ passive: true }
			)

			// Initial state + observers
			this._updateThumbsArrows()
			this._thumbsRO?.disconnect?.()
			this._thumbsRO = new ResizeObserver(() => this._updateThumbsArrows())
			this._thumbsRO.observe(thumbsViewport)
			if (thumbsTrack) this._thumbsRO.observe(thumbsTrack)

			this._updateThumbsArrowsBound ||= () => this._updateThumbsArrows()
			window.addEventListener(
				'orientationchange',
				this._updateThumbsArrowsBound
			)
			window.addEventListener('resize', this._updateThumbsArrowsBound)
		}
	}

	_updateThumbsArrows() {
		if (!this.options.thumbs) return
		const vp = this._qs(this.ui.thumbsViewport, this.modalRoot)
		const prev = this._qs(this.ui.thumbsPrevBtn, this.modalRoot)
		const next = this._qs(this.ui.thumbsNextBtn, this.modalRoot)
		if (!vp || !prev || !next) return

		const max = Math.max(0, vp.scrollWidth - vp.clientWidth)
		const need = max > 1 // show arrows only if overflow exists
		prev.style.display = need ? '' : 'none'
		next.style.display = need ? '' : 'none'

		if (need) {
			const atStart = vp.scrollLeft <= 1
			const atEnd = vp.scrollLeft >= max - 1
			prev.disabled = atStart
			next.disabled = atEnd
			prev.setAttribute('aria-disabled', atStart ? 'true' : 'false')
			next.setAttribute('aria-disabled', atEnd ? 'true' : 'false')
		}
	}

	// ---------- thumbs ----------
	_buildThumbsIfNeeded() {
		if (!this.options.thumbs) return
		const track = this._qs(this.ui.thumbsTrack, this.modalRoot)
		const viewport = this._qs(this.ui.thumbsViewport, this.modalRoot)
		if (!track || !viewport) return

		if (!track.dataset.built) {
			track.innerHTML = ''
			this.cards.forEach((cardEl, i) => {
				const bigSrc =
					cardEl.getAttribute('data-dd-src') ||
					cardEl.querySelector('img')?.getAttribute('src')

				const btn = document.createElement('button')
				btn.type = 'button'
				btn.className = this.ui.thumbButton.replace(/^\./, '')
				btn.dataset.index = i

				const im = document.createElement('img')
				im.alt = ''
				im.decoding = 'async'
				im.loading = 'lazy'
				im.src = bigSrc || ''

				if (this.options.styles) {
					// .ddlb-thumb default look
					btn.style.cssText =
						'flex:0 0 auto; border:2px solid transparent; padding:0; background:transparent'
					im.style.cssText =
						'width:64px;height:64px;object-fit:cover;display:block;border-radius:4px'
				}

				btn.appendChild(im)
				btn.addEventListener('click', () => this.openByIndex(i))
				track.appendChild(btn)
			})
			track.dataset.built = '1'
			this._updateThumbsArrows()
		}
	}

	_markActiveThumb(index) {
		if (!this.options.thumbs) return
		const track = this._qs(this.ui.thumbsTrack, this.modalRoot)
		if (!track) return

		this._qsa(`${this.ui.thumbButton}.is-active`, track).forEach(btn =>
			btn.classList.remove('is-active')
		)

		const activeBtn = this._qs(
			`${this.ui.thumbButton}[data-index="${index}"]`,
			track
		)
		if (activeBtn) {
			activeBtn.classList.add('is-active')
			if (this.options.styles) activeBtn.style.borderColor = '#fff'
			this._qsa(this.ui.thumbButton, track).forEach(btn => {
				if (btn !== activeBtn && this.options.styles)
					btn.style.borderColor = 'transparent'
			})
			this._centerActiveThumb(activeBtn)
		}
	}

	_centerActiveThumb(thumbButton) {
		const viewport = this._qs(this.ui.thumbsViewport, this.modalRoot)
		if (!viewport || !thumbButton) return
		const vpRect = viewport.getBoundingClientRect()
		const thRect = thumbButton.getBoundingClientRect()
		const delta =
			(thRect.left + thRect.right) / 2 - (vpRect.left + vpRect.right) / 2
		viewport.scrollTo({
			left: Math.max(0, viewport.scrollLeft + delta),
			behavior: 'smooth',
		})
	}

	// ---------- navigation ----------
	openByIndex(index) {
		if (!this.cards.length) return

		const max = this.cards.length - 1
		if (index < 0) index = 0
		if (index > max) index = max

		const cardEl = this.cards[index]
		const src =
			cardEl.getAttribute('data-dd-src') ||
			cardEl.querySelector('img')?.getAttribute('src')
		if (!src) return

		this.activeIndex = index
		this._buildThumbsIfNeeded()
		this._updateThumbsArrows()
		this._markActiveThumb(index)
		this.open(src)
	}

	next() {
		if (this.activeIndex < 0) return
		const nextIndex = (this.activeIndex + 1) % this.cards.length
		this.openByIndex(nextIndex)
	}

	prev() {
		if (this.activeIndex < 0) return
		const prevIndex =
			(this.activeIndex - 1 + this.cards.length) % this.cards.length
		this.openByIndex(prevIndex)
	}

	// ---------- public API ----------
	open(src) {
		if (!src || !this.modalImageEl) return

		this.modalImageEl.src = src
		this.modalRoot.setAttribute('aria-hidden', 'false')

		if (this.options.hooks?.open) {
			this.options.hooks.open({
				root: this.modalRoot,
				img: this.modalImageEl,
				src,
			})
			return
		}

		this.modalRoot.style.pointerEvents = 'auto'
		if (this.options.styles) this.modalRoot.style.opacity = '1'
	}

	close() {
		if (!this.modalRoot) return

		if (this.options.hooks?.close) {
			this.options.hooks.close({ root: this.modalRoot, img: this.modalImageEl })
			return
		}

		if (this.options.styles) this.modalRoot.style.opacity = '0'
		this.modalRoot.setAttribute('aria-hidden', 'true')
		this.modalRoot.style.pointerEvents = 'none'

		// cleanup observers
		this._thumbsRO?.disconnect?.()
		this._thumbsRO = null
		if (this._updateThumbsArrowsBound) {
			window.removeEventListener(
				'orientationchange',
				this._updateThumbsArrowsBound
			)
			window.removeEventListener('resize', this._updateThumbsArrowsBound)
		}
	}
}

export default DDViewer
if (typeof window !== 'undefined') window.DDViewer = DDViewer
