/*
    Liquid glass, refraction layer
    -----------------------------
    A backdrop filtered with blur() still has straight edges, which reads as
    plastic. Real glass bends what is behind it, and the bend is strongest where
    the surface turns: along the bevel and through the corners.

    This script builds that bend. For every glass surface it draws a displacement
    map on a canvas: the distance to the rounded (squircle) boundary, its
    gradient (the edge normal), and a falloff that dies out one bevel width
    inside the shape. The red channel carries the horizontal offset and the green
    channel the vertical one, both neutral at 128, so feDisplacementMap samples
    the backdrop along the normals and leaves the middle of the surface alone.

    One map and one filter are shared by every surface of the same size, radius
    and bevel, so a list of ten equal cards costs one filter. Geometry is rebuilt
    when a surface is resized and on a theme change, because the dark material
    bends a little harder than the white one.
*/
(() => {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';
    const MAX_MAP = 200; // longest side of a generated map, in pixels
    const BUCKET = 8; // surfaces within 8px share one map
    const TIERS = [
        ['.publication, .latest-card, .toc-container, .toc-mobile, .wl-panel', 'glass-lg'],
        ['.menu-navigations', 'glass-sheet'],
        [
            '.post-share-btn, #scroll-to-top, .theme-toggle, .menu-button > button,' +
                ' .search-bar, .wl-btn, .wl-emoji-popup, .wl-gif-popup',
            'glass-sm',
        ],
    ];
    const TARGETS = TIERS.map(([selectors]) => selectors).join(',');

    const maps = new Map();
    const filters = new Map();
    const seen = new WeakMap();
    let svg = null;
    let seq = 0;

    const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

    function surfaceSvg() {
        if (svg) return svg;
        svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
        document.body.appendChild(svg);
        return svg;
    }

    // Signed distance to a rounded rectangle: positive inside, zero on the edge.
    function insideDistance(x, y, w, h, radius) {
        const hw = w / 2;
        const hh = h / 2;
        const r = Math.min(radius, hw, hh);
        const qx = Math.abs(x - hw) - (hw - r);
        const qy = Math.abs(y - hh) - (hh - r);
        const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        return -(outside + Math.min(Math.max(qx, qy), 0) - r);
    }

    function mapFor(w, h, radius, bevel) {
        const key = `${w}|${h}|${radius}|${bevel}`;
        const hit = maps.get(key);
        if (hit) return hit;

        const shrink = Math.min(1, MAX_MAP / Math.max(w, h));
        const mw = Math.max(24, Math.round(w * shrink));
        const mh = Math.max(24, Math.round(h * shrink));
        const canvas = document.createElement('canvas');
        canvas.width = mw;
        canvas.height = mh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const image = ctx.createImageData(mw, mh);
        const data = image.data;
        const sx = w / mw;
        const sy = h / mh;

        for (let j = 0; j < mh; j++) {
            for (let i = 0; i < mw; i++) {
                const x = (i + 0.5) * sx;
                const y = (j + 0.5) * sy;
                const depth = insideDistance(x, y, w, h, radius);
                // Falloff: full strength on the edge, gone one bevel inside.
                const t = Math.min(1, Math.max(0, depth / bevel));
                const amp = Math.pow(1 - t, 1.6);
                const at = (i * 4) + (j * mw) * 4;
                if (amp <= 0) {
                    data[at] = 128;
                    data[at + 1] = 128;
                    data[at + 2] = 128;
                    data[at + 3] = 255;
                    continue;
                }
                // Edge normal from the gradient of the distance field.
                const gx = insideDistance(x + 1, y, w, h, radius) - insideDistance(x - 1, y, w, h, radius);
                const gy = insideDistance(x, y + 1, w, h, radius) - insideDistance(x, y - 1, w, h, radius);
                const len = Math.hypot(gx, gy) || 1;
                // Sample inwards from the edge, so the bevel collects the light
                // that travels through the slab and nothing outside it is lost.
                data[at] = 128 + (gx / len) * amp * 126;
                data[at + 1] = 128 + (gy / len) * amp * 126;
                data[at + 2] = 128;
                data[at + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
        const url = canvas.toDataURL('image/png');
        maps.set(key, url);
        return url;
    }

    function filterFor(w, h, radius, bevel, url) {
        const dark = isDark();
        const scale = Math.max(2, Math.round(bevel * 0.9 * (dark ? 1.15 : 1)));
        const key = `${url.length}|${w}|${h}|${scale}`;
        const hit = filters.get(key);
        if (hit) return hit;

        const id = `glass-refract-${++seq}`;
        const filter = document.createElementNS(NS, 'filter');
        filter.setAttribute('id', id);
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', '100%');
        filter.setAttribute('height', '100%');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        const image = document.createElementNS(NS, 'feImage');
        image.setAttribute('href', url);
        image.setAttribute('xlink:href', url); // older WebKit
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('width', String(w));
        image.setAttribute('height', String(h));
        image.setAttribute('preserveAspectRatio', 'none');
        image.setAttribute('result', 'map');

        const displace = document.createElementNS(NS, 'feDisplacementMap');
        displace.setAttribute('in', 'SourceGraphic');
        displace.setAttribute('in2', 'map');
        displace.setAttribute('scale', String(scale));
        displace.setAttribute('xChannelSelector', 'R');
        displace.setAttribute('yChannelSelector', 'G');

        filter.appendChild(image);
        filter.appendChild(displace);
        surfaceSvg().appendChild(filter);
        filters.set(key, id);
        return id;
    }

    function tierFor(el) {
        for (const [selectors, tier] of TIERS) {
            if (el.matches(selectors)) return tier;
        }
        return 'glass-sm';
    }

    function dress(el) {
        const style = getComputedStyle(el);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const before = seen.get(el);
        if (!w || !h || style.visibility === 'hidden') return;

        if (!before) {
            el.classList.add('glass', tierFor(el));
            seen.set(el, { w: 0, h: 0 });
        }
        const last = seen.get(el);
        if (Math.abs(last.w - w) < 3 && Math.abs(last.h - h) < 3) return;
        last.w = w;
        last.h = h;

        const bevel = parseFloat(style.getPropertyValue('--glass-bevel')) || 0;
        const radius = parseFloat(style.borderTopLeftRadius) || 0;
        if (!bevel) {
            el.style.removeProperty('--glass-filter');
            return;
        }

        // Bucketed geometry: neighbouring sizes share the same map and filter.
        const bw = Math.round(w / BUCKET) * BUCKET;
        const bh = Math.round(h / BUCKET) * BUCKET;
        const brushed = Math.min(24, Math.max(1, Math.round(radius)));
        const bbevel = Math.min(24, Math.max(1, Math.round(bevel)));
        const url = mapFor(bw, bh, brushed, bbevel);
        const id = filterFor(bw, bh, brushed, bbevel, url);
        el.style.setProperty('--glass-filter', `url(#${id})`);
    }

    let queued = false;
    const queue = new Set();
    function decorate() {
        queued = false;
        const nodes = document.querySelectorAll(TARGETS);
        for (const node of nodes) dress(node);
        queue.clear();
    }
    function schedule(el) {
        if (el) queue.add(el);
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            if (queue.size) {
                for (const el of queue) if (el.isConnected) dress(el);
                queue.clear();
            }
            decorate();
        });
    }

    const sizes = new ResizeObserver((entries) => {
        for (const entry of entries) schedule(entry.target);
    });

    function watch() {
        for (const el of document.querySelectorAll(TARGETS)) {
            if (!seen.has(el)) {
                dress(el);
                sizes.observe(el);
            }
        }
    }

    function reset() {
        maps.clear();
        filters.clear();
        if (svg) svg.remove();
        svg = null;
        for (const el of document.querySelectorAll('.glass')) {
            el.style.removeProperty('--glass-filter');
            const last = seen.get(el);
            if (last) last.w = 0;
        }
        decorate();
    }

    function start() {
        decorate();
        watch();
        new MutationObserver(() => {
            for (const el of document.querySelectorAll(TARGETS)) {
                if (!seen.has(el)) {
                    dress(el);
                    sizes.observe(el);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
        new MutationObserver(reset).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
