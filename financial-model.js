// Financial Model & Capital Allocation — shared renderer for
// investor-relations.html and investor-presentation.html.
// Fetches editable data from /api/financial-model and renders
// KPI cards, an SVG donut chart, allocation bars, and the
// illustrative capital planning calculator.
(function () {
    "use strict";

    var GOLD_SHADES = ["#C9A24B", "#D6B87A", "#8C6F2F", "#E8D5A4", "#A98B3F", "#7A6230", "#BFA05A", "#5C4A24", "#D9C48A", "#93783A"];

    var usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function renderKpis(container, kpis) {
        container.innerHTML = "";
        kpis.forEach(function (k) {
            var card = el("div", "fm-kpi-card");
            card.appendChild(el("span", "fm-kpi-value", k.value));
            card.appendChild(el("span", "fm-kpi-label", k.label));
            container.appendChild(card);
        });
    }

    function renderDonut(container, allocation) {
        container.innerHTML = "";
        var svgNS = "http://www.w3.org/2000/svg";
        var size = 220, stroke = 30;
        var r = (size - stroke) / 2;
        var c = 2 * Math.PI * r;
        var svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 " + size + " " + size);
        svg.setAttribute("class", "fm-donut-svg");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Illustrative capital allocation donut chart");

        var offset = 0;
        allocation.forEach(function (a, i) {
            var seg = document.createElementNS(svgNS, "circle");
            var len = (a.pct / 100) * c;
            seg.setAttribute("cx", size / 2);
            seg.setAttribute("cy", size / 2);
            seg.setAttribute("r", r);
            seg.setAttribute("fill", "none");
            seg.setAttribute("stroke", GOLD_SHADES[i % GOLD_SHADES.length]);
            seg.setAttribute("stroke-width", stroke);
            seg.setAttribute("stroke-dasharray", len + " " + (c - len));
            seg.setAttribute("stroke-dashoffset", String(-offset + c / 4));
            offset += len;
            svg.appendChild(seg);
        });
        container.appendChild(svg);
    }

    function renderLegend(container, allocation) {
        container.innerHTML = "";
        allocation.forEach(function (a, i) {
            var item = el("li", "fm-legend-item");
            var dot = el("span", "fm-legend-dot");
            dot.style.background = GOLD_SHADES[i % GOLD_SHADES.length];
            item.appendChild(dot);
            item.appendChild(el("span", "fm-legend-name", a.name));
            item.appendChild(el("span", "fm-legend-pct", a.pct + "%"));
            container.appendChild(item);
        });
    }

    function renderBars(container, allocation) {
        container.innerHTML = "";
        allocation.forEach(function (a, i) {
            var row = el("div", "fm-bar-row");
            var head = el("div", "fm-bar-head");
            head.appendChild(el("span", "fm-bar-name", a.name));
            head.appendChild(el("span", "fm-bar-pct", a.pct + "%"));
            var track = el("div", "fm-bar-track");
            var fill = el("div", "fm-bar-fill");
            fill.style.width = a.pct + "%";
            fill.style.background = GOLD_SHADES[i % GOLD_SHADES.length];
            track.appendChild(fill);
            row.appendChild(head);
            row.appendChild(track);
            container.appendChild(row);
        });
    }

    function initCalculator(root, allocation) {
        var slider = root.querySelector("[data-fm-calc-slider]");
        var input = root.querySelector("[data-fm-calc-input]");
        var breakdown = root.querySelector("[data-fm-calc-breakdown]");
        var totalOut = root.querySelector("[data-fm-calc-total]");
        if (!slider || !input || !breakdown) return;

        function clamp(v) {
            v = Math.round(Number(v) || 0);
            return Math.min(Math.max(v, Number(slider.min)), Number(slider.max));
        }

        function render(amount) {
            breakdown.innerHTML = "";
            allocation.forEach(function (a, i) {
                var row = el("div", "fm-calc-row");
                var dot = el("span", "fm-legend-dot");
                dot.style.background = GOLD_SHADES[i % GOLD_SHADES.length];
                row.appendChild(dot);
                row.appendChild(el("span", "fm-calc-name", a.name + " (" + a.pct + "%)"));
                row.appendChild(el("span", "fm-calc-amount", usd.format(amount * a.pct / 100)));
                breakdown.appendChild(row);
            });
            if (totalOut) totalOut.textContent = usd.format(amount);
        }

        slider.addEventListener("input", function () {
            input.value = slider.value;
            render(Number(slider.value));
        });
        input.addEventListener("change", function () {
            var v = clamp(input.value);
            input.value = v;
            slider.value = v;
            render(v);
        });

        var start = Number(slider.value);
        input.value = start;
        render(start);
    }

    function init() {
        var kpiEls = document.querySelectorAll("[data-fm-kpis]");
        var donutEls = document.querySelectorAll("[data-fm-donut]");
        var legendEls = document.querySelectorAll("[data-fm-legend]");
        var barEls = document.querySelectorAll("[data-fm-bars]");
        var calcEls = document.querySelectorAll("[data-fm-calc]");
        if (!kpiEls.length && !donutEls.length && !barEls.length && !calcEls.length) return;

        fetch("/api/financial-model")
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || !data.ok) return;
                kpiEls.forEach(function (n) { renderKpis(n, data.kpis || []); });
                donutEls.forEach(function (n) { renderDonut(n, data.allocation || []); });
                legendEls.forEach(function (n) { renderLegend(n, data.allocation || []); });
                barEls.forEach(function (n) { renderBars(n, data.allocation || []); });
                calcEls.forEach(function (n) { initCalculator(n, data.allocation || []); });
                document.documentElement.setAttribute("data-fm-ready", "true");
            })
            .catch(function (err) {
                console.error("Financial model load failed:", err);
                document.documentElement.setAttribute("data-fm-ready", "error");
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
