// Lift Fi website server
// Serves the static site and handles contact form submissions via Resend
// (Replit Resend integration — credentials are managed server-side by the
// connectors SDK; no API key ever reaches the frontend.)

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { Pool } = require("pg");
const { ReplitConnectors } = require("@replit/connectors-sdk");

const app = express();
const PORT = process.env.PORT || 5000;

// Behind Replit's proxy (one trusted hop) — makes req.ip use the real client
// address from the proxy-set header instead of trusting arbitrary
// client-supplied X-Forwarded-For values.
app.set("trust proxy", 1);

// ----- Configuration (env-overridable, sensible brand defaults) -----
const FROM_EMAIL = process.env.LIFTFI_FROM_EMAIL || "Lift Fi <admin@liftfi.io>";
const PUBLIC_EMAIL = process.env.LIFTFI_PUBLIC_EMAIL || "admin@liftfi.io";
const ADMIN_EMAILS = (process.env.LIFTFI_ADMIN_EMAILS || "admin@liftfi.io,kevin@aivarasolutions.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
const REPLY_TO_EMAIL = process.env.LIFTFI_REPLY_TO_EMAIL || "admin@liftfi.io";
const SITE_URL = "https://www.liftfi.io";
const LOGO_URL = `${SITE_URL}/brand/liftfi/liftfi_horizontal_web.png`;

// Brand palette
const BLACK = "#0A0A0A";
const CHARCOAL = "#2B2B2B";
const GOLD = "#C9A24B";
const CHAMPAGNE = "#D6B87A";

app.use(express.json({ limit: "50kb" }));

// Development cache control so previews always reflect latest files
if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        next();
    });
}

// Block non-public project files from being served
const BLOCKED_PATHS = [
    /^\/server\.js$/i,
    /^\/package(-lock)?\.json$/i,
    /^\/node_modules(\/|$)/i,
    /^\/attached_assets(\/|$)/i,
    /^\/replit\.md$/i,
    /^\/pyproject\.toml$/i,
    /^\/uv\.lock$/i,
    /^\/snippets(\/|$)/i,
];
app.use((req, res, next) => {
    let pathname;
    try {
        pathname = decodeURIComponent(req.path);
    } catch {
        return res.status(400).send("Bad request");
    }
    // Block dotfiles/dot-directories anywhere in the path and denylisted files
    if (pathname.split("/").some((seg) => seg.startsWith(".") && seg !== "." && seg !== "..") ||
        pathname.includes("..") ||
        BLOCKED_PATHS.some((re) => re.test(pathname))) {
        return res.status(404).send("Not found");
    }
    next();
});

app.use(express.static(path.join(__dirname), { extensions: ["html"], dotfiles: "ignore" }));

// ----- Helpers -----
const escapeHtml = (value) =>
    String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

// Strip CR/LF to prevent header injection in subjects / reply-to
const stripNewlines = (value) => String(value == null ? "" : value).replace(/[\r\n]+/g, " ").trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ----- Simple in-memory rate limiting (per IP) -----
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;
const rateBuckets = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const bucket = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (bucket.length >= RATE_LIMIT_MAX) {
        rateBuckets.set(ip, bucket);
        return true;
    }
    bucket.push(now);
    rateBuckets.set(ip, bucket);
    return false;
}

// Periodic cleanup so the map does not grow unbounded
setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of rateBuckets) {
        const fresh = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
        if (fresh.length === 0) rateBuckets.delete(ip);
        else rateBuckets.set(ip, fresh);
    }
}, RATE_LIMIT_WINDOW_MS).unref();

// ----- Resend sending via Replit connectors (server-side only) -----
async function sendEmail(payload) {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Resend error ${response.status}: ${text}`);
    }
    try {
        return JSON.parse(text);
    } catch {
        return { raw: text };
    }
}

// ----- Email templates -----
function internalEmail(fields) {
    const rows = [
        ["Name", fields.name],
        ["Email", fields.email],
        ["Phone", fields.phone || "—"],
        ["Inquiry Type", fields.inquiryType || "—"],
        ["Message", fields.message],
        ["Source", fields.source || "liftfi.io contact form"],
        ["Submitted", fields.timestamp],
    ];

    const text = ["New Lift Fi Inquiry", ""]
        .concat(rows.map(([label, value]) => `${label}:\n${value}\n`))
        .join("\n");

    const rowsHtml = rows
        .map(
            ([label, value]) => `
        <tr>
            <td style="padding:10px 16px 2px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${escapeHtml(label)}</td>
        </tr>
        <tr>
            <td style="padding:0 16px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${CHARCOAL};white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`
        )
        .join("");

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F4F3F0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F3F0;padding:24px 0;">
        <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <tr>
                    <td style="background-color:${BLACK};padding:24px;text-align:center;">
                        <img src="${LOGO_URL}" alt="Lift Fi — Lift Financial Holdings LLC" width="220" style="display:inline-block;width:220px;max-width:80%;height:auto;border:0;">
                    </td>
                </tr>
                <tr><td style="background-color:${GOLD};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
                <tr>
                    <td style="background-color:#FFFFFF;padding:20px 8px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:4px 16px 14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BLACK};">New Lift Fi Inquiry</td>
                            </tr>
                            ${rowsHtml}
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="background-color:${BLACK};padding:18px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${CHAMPAGNE};">
                        Lift Financial Holdings LLC &nbsp;|&nbsp; ${PUBLIC_EMAIL} &nbsp;|&nbsp; www.liftfi.io
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    return { text, html };
}

function confirmationEmail(fields) {
    const firstName = stripNewlines(fields.name).split(/\s+/)[0] || "there";

    const text = [
        `Hi ${firstName},`,
        "",
        "Thank you for contacting Lift Fi.",
        "",
        "We received your inquiry and our team will review it shortly. Lift Fi is focused on building, acquiring, and scaling cash-flowing businesses through structure, discipline, and long-term ownership.",
        "",
        "If your message is related to partnerships, investment interest, acquisitions, or business opportunities, we'll follow up with the appropriate next steps.",
        "",
        `You can reply directly to this email or contact us at ${PUBLIC_EMAIL}.`,
        "",
        "Best,",
        "Lift Fi",
        "Lift Financial Holdings LLC",
        PUBLIC_EMAIL,
        "www.liftfi.io",
    ].join("\n");

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#F4F3F0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F3F0;padding:24px 0;">
        <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <tr>
                    <td style="background-color:${BLACK};padding:28px 24px;text-align:center;">
                        <img src="${LOGO_URL}" alt="Lift Fi — Lift Financial Holdings LLC" width="240" style="display:inline-block;width:240px;max-width:85%;height:auto;border:0;">
                    </td>
                </tr>
                <tr><td style="background-color:${GOLD};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
                <tr>
                    <td style="background-color:#FFFFFF;padding:32px 32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${CHARCOAL};">
                        <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
                        <p style="margin:0 0 16px;">Thank you for contacting Lift Fi.</p>
                        <p style="margin:0 0 16px;">We received your inquiry and our team will review it shortly. Lift Fi is focused on building, acquiring, and scaling cash-flowing businesses through structure, discipline, and long-term ownership.</p>
                        <p style="margin:0 0 16px;">If your message is related to partnerships, investment interest, acquisitions, or business opportunities, we&rsquo;ll follow up with the appropriate next steps.</p>
                        <p style="margin:0 0 24px;">You can reply directly to this email or contact us at <a href="mailto:${PUBLIC_EMAIL}" style="color:${GOLD};text-decoration:none;">${PUBLIC_EMAIL}</a>.</p>
                        <p style="margin:0;">Best,<br>
                        <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${BLACK};">Lift Fi</span><br>
                        <span style="font-size:13px;color:${CHARCOAL};">Lift Financial Holdings LLC</span></p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color:${BLACK};padding:18px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${CHAMPAGNE};">
                        Lift Financial Holdings LLC &nbsp;|&nbsp; <a href="mailto:${PUBLIC_EMAIL}" style="color:${CHAMPAGNE};text-decoration:none;">${PUBLIC_EMAIL}</a> &nbsp;|&nbsp; <a href="${SITE_URL}" style="color:${CHAMPAGNE};text-decoration:none;">www.liftfi.io</a>
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    return { text, html };
}

// ----- Investor Data Room (access-code gated) -----
const DATAROOM_ACCESS_CODE = process.env.DATAROOM_ACCESS_CODE || "";
const DATAROOM_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const dataroomTokens = new Map(); // token -> expiry timestamp

// Separate, stricter rate limit for login attempts
const DR_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DR_LIMIT_MAX = 5;
const drBuckets = new Map();

function isDataroomRateLimited(ip) {
    const now = Date.now();
    const bucket = (drBuckets.get(ip) || []).filter((t) => now - t < DR_LIMIT_WINDOW_MS);
    if (bucket.length >= DR_LIMIT_MAX) {
        drBuckets.set(ip, bucket);
        return true;
    }
    bucket.push(now);
    drBuckets.set(ip, bucket);
    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of drBuckets) {
        const fresh = times.filter((t) => now - t < DR_LIMIT_WINDOW_MS);
        if (fresh.length === 0) drBuckets.delete(ip);
        else drBuckets.set(ip, fresh);
    }
    for (const [token, expiry] of dataroomTokens) {
        if (expiry < now) dataroomTokens.delete(token);
    }
}, DR_LIMIT_WINDOW_MS).unref();

function timingSafeEqualStr(a, b) {
    const ha = crypto.createHash("sha256").update(String(a)).digest();
    const hb = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

function getValidDataroomToken(req) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) return null;
    const expiry = dataroomTokens.get(token);
    if (!expiry || expiry < Date.now()) {
        if (expiry) dataroomTokens.delete(token);
        return null;
    }
    return token;
}

app.post("/api/dataroom/login", (req, res) => {
    if (!DATAROOM_ACCESS_CODE) {
        return res.status(503).json({ ok: false, error: "The data room is not yet available. Please contact admin@liftfi.io." });
    }
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (isDataroomRateLimited(ip)) {
        return res.status(429).json({ ok: false, error: "Too many attempts. Please try again later." });
    }
    const code = stripNewlines(req.body?.code).slice(0, 200);
    if (!code || !timingSafeEqualStr(code, DATAROOM_ACCESS_CODE)) {
        return res.status(401).json({ ok: false, error: "Invalid access code." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    dataroomTokens.set(token, Date.now() + DATAROOM_TOKEN_TTL_MS);
    return res.json({ ok: true, token });
});

// Data room contents are only returned to authenticated sessions.
const DATAROOM_SECTIONS = [
    {
        title: "Corporate & Organizational",
        icon: "fa-building-columns",
        items: [
            "Certificate of Formation — Lift Financial Holdings LLC",
            "Operating Agreement (holding company)",
            "Organizational chart & entity structure",
            "Subsidiary formation documents",
        ],
    },
    {
        title: "Financial Information",
        icon: "fa-chart-pie",
        items: [
            "Historical financial statements by entity",
            "Consolidated financial overview",
            "Banking & treasury structure",
            "Capitalization summary",
        ],
    },
    {
        title: "Operating Companies",
        icon: "fa-briefcase",
        items: [
            "Company profiles & operating metrics",
            "Technology & platform overviews",
            "Key contracts & customer relationships",
            "Brand & intellectual property summary",
        ],
    },
    {
        title: "Strategy & Governance",
        icon: "fa-scale-balanced",
        items: [
            "Long-term strategic plan",
            "Capital allocation framework",
            "Risk & compliance overview",
            "Leadership & management background",
        ],
    },
];

app.get("/api/dataroom/content", (req, res) => {
    const token = getValidDataroomToken(req);
    if (!token) {
        return res.status(401).json({ ok: false, error: "Session expired. Please enter your access code again." });
    }
    return res.json({
        ok: true,
        sections: DATAROOM_SECTIONS,
        note: "Materials in this data room are shared during confidential due diligence. Documents are provided individually to qualified parties following an initial conversation. To request specific materials, contact admin@liftfi.io.",
    });
});

// ----- Financial Model & Capital Allocation (public read, admin write) -----
const FINANCIAL_MODEL_DEFAULTS = {
    kpis: [
        { label: "Portfolio Companies", value: "5" },
        { label: "Industries Served", value: "7" },
        { label: "Technology Platforms", value: "3" },
        { label: "Operating Markets", value: "4" },
        { label: "Recurring Revenue Streams", value: "6" },
    ],
    allocation: [
        { name: "Technology Development", pct: 25 },
        { name: "Strategic Acquisitions", pct: 25 },
        { name: "Sales & Marketing", pct: 20 },
        { name: "Working Capital", pct: 15 },
        { name: "Hiring & Operations", pct: 10 },
        { name: "Research & Innovation", pct: 5 },
    ],
};

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

async function initFinancialModelTable() {
    if (!pool) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS financial_model (
            id INTEGER PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    await pool.query(
        `INSERT INTO financial_model (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(FINANCIAL_MODEL_DEFAULTS)]
    );
}

async function getFinancialModel() {
    if (!pool) return FINANCIAL_MODEL_DEFAULTS;
    try {
        const { rows } = await pool.query(`SELECT data FROM financial_model WHERE id = 1`);
        return rows[0]?.data || FINANCIAL_MODEL_DEFAULTS;
    } catch (err) {
        console.error("Financial model read failed, serving defaults:", err.message);
        return FINANCIAL_MODEL_DEFAULTS;
    }
}

app.get("/api/financial-model", async (req, res) => {
    const data = await getFinancialModel();
    return res.json({ ok: true, ...data });
});

// ----- Admin (access-code gated, separate code from the investor data room) -----
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || "";
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const adminTokens = new Map(); // token -> expiry timestamp
const adminBuckets = new Map();

function isAdminRateLimited(ip) {
    const now = Date.now();
    const bucket = (adminBuckets.get(ip) || []).filter((t) => now - t < DR_LIMIT_WINDOW_MS);
    if (bucket.length >= DR_LIMIT_MAX) {
        adminBuckets.set(ip, bucket);
        return true;
    }
    bucket.push(now);
    adminBuckets.set(ip, bucket);
    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of adminBuckets) {
        const fresh = times.filter((t) => now - t < DR_LIMIT_WINDOW_MS);
        if (fresh.length === 0) adminBuckets.delete(ip);
        else adminBuckets.set(ip, fresh);
    }
    for (const [token, expiry] of adminTokens) {
        if (expiry < now) adminTokens.delete(token);
    }
}, DR_LIMIT_WINDOW_MS).unref();

function getValidAdminToken(req) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) return null;
    const expiry = adminTokens.get(token);
    if (!expiry || expiry < Date.now()) {
        if (expiry) adminTokens.delete(token);
        return null;
    }
    return token;
}

app.post("/api/admin/login", (req, res) => {
    if (!ADMIN_ACCESS_CODE) {
        return res.status(503).json({ ok: false, error: "Admin access is not yet configured." });
    }
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (isAdminRateLimited(ip)) {
        return res.status(429).json({ ok: false, error: "Too many attempts. Please try again later." });
    }
    const code = stripNewlines(req.body?.code).slice(0, 200);
    if (!code || !timingSafeEqualStr(code, ADMIN_ACCESS_CODE)) {
        return res.status(401).json({ ok: false, error: "Invalid access code." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    adminTokens.set(token, Date.now() + ADMIN_TOKEN_TTL_MS);
    return res.json({ ok: true, token });
});

function validateFinancialModel(body) {
    const errors = [];
    const kpis = Array.isArray(body?.kpis) ? body.kpis : null;
    const allocation = Array.isArray(body?.allocation) ? body.allocation : null;

    if (!kpis || kpis.length < 1 || kpis.length > 12) {
        errors.push("Provide between 1 and 12 KPI cards.");
    } else {
        for (const k of kpis) {
            const label = typeof k?.label === "string" ? k.label.trim() : "";
            const value = typeof k?.value === "string" ? k.value.trim() : "";
            if (!label || label.length > 80) errors.push("Each KPI needs a label (max 80 characters).");
            if (!value || value.length > 40) errors.push("Each KPI needs a value (max 40 characters).");
        }
    }

    if (!allocation || allocation.length < 2 || allocation.length > 10) {
        errors.push("Provide between 2 and 10 allocation categories.");
    } else {
        let sum = 0;
        for (const a of allocation) {
            const name = typeof a?.name === "string" ? a.name.trim() : "";
            const pct = Number(a?.pct);
            if (!name || name.length > 80) errors.push("Each allocation category needs a name (max 80 characters).");
            if (!Number.isFinite(pct) || pct < 0 || pct > 100) errors.push("Each allocation percentage must be between 0 and 100.");
            sum += pct;
        }
        if (Math.round(sum * 100) / 100 !== 100) errors.push(`Allocation percentages must total exactly 100% (currently ${sum}%).`);
    }

    if (errors.length) return { errors };
    return {
        data: {
            kpis: kpis.map((k) => ({ label: k.label.trim().slice(0, 80), value: k.value.trim().slice(0, 40) })),
            allocation: allocation.map((a) => ({ name: a.name.trim().slice(0, 80), pct: Math.round(Number(a.pct) * 100) / 100 })),
        },
    };
}

app.get("/api/admin/financial-model", async (req, res) => {
    if (!getValidAdminToken(req)) {
        return res.status(401).json({ ok: false, error: "Session expired. Please sign in again." });
    }
    const data = await getFinancialModel();
    return res.json({ ok: true, ...data });
});

app.put("/api/admin/financial-model", async (req, res) => {
    if (!getValidAdminToken(req)) {
        return res.status(401).json({ ok: false, error: "Session expired. Please sign in again." });
    }
    if (!pool) {
        return res.status(503).json({ ok: false, error: "Database is not available." });
    }
    const { errors, data } = validateFinancialModel(req.body);
    if (errors) {
        return res.status(400).json({ ok: false, error: errors.join(" ") });
    }
    try {
        await pool.query(
            `INSERT INTO financial_model (id, data, updated_at) VALUES (1, $1, now())
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
            [JSON.stringify(data)]
        );
        return res.json({ ok: true, ...data });
    } catch (err) {
        console.error("Financial model save failed:", err.message);
        return res.status(500).json({ ok: false, error: "Could not save changes. Please try again." });
    }
});

// ----- Contact endpoint -----
app.post("/api/contact", async (req, res) => {
    try {
        const body = req.body || {};

        // Honeypot: real users never fill this hidden field. Silently accept.
        if (typeof body.website === "string" && body.website.trim() !== "") {
            return res.json({ ok: true });
        }

        const ip = req.ip || req.socket.remoteAddress || "unknown";
        if (isRateLimited(ip)) {
            return res.status(429).json({ ok: false, error: "Too many submissions. Please try again later." });
        }

        const name = stripNewlines(body.name).slice(0, 200);
        const email = stripNewlines(body.email).slice(0, 320);
        const phone = stripNewlines(body.phone).slice(0, 50);
        const inquiryType = stripNewlines(body.inquiryType).slice(0, 100);
        const message = String(body.message || "").trim().slice(0, 5000);
        const source = stripNewlines(body.source).slice(0, 200) || "liftfi.io contact form";

        // Server-side validation
        const errors = [];
        if (name.length < 2) errors.push("Please enter your full name.");
        if (!EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");
        if (message.length < 10) errors.push("Please include a brief message (at least 10 characters).");
        if (errors.length) {
            return res.status(400).json({ ok: false, error: errors[0] });
        }

        const timestamp = new Date().toLocaleString("en-US", {
            timeZone: "America/Chicago",
            dateStyle: "long",
            timeStyle: "short",
        }) + " (Central Time)";

        const fields = { name, email, phone, inquiryType, message, source, timestamp };

        // 1) Internal admin notification (reply-to: the lead's email)
        const internal = internalEmail(fields);
        await sendEmail({
            from: FROM_EMAIL,
            to: ADMIN_EMAILS,
            reply_to: email,
            subject: `New Lift Fi Inquiry — ${name}`,
            html: internal.html,
            text: internal.text,
        });

        // 2) Customer confirmation (reply-to: admin@liftfi.io).
        // The lead is already captured above, so a confirmation failure
        // should not fail the whole request — log it instead.
        try {
            const confirmation = confirmationEmail(fields);
            await sendEmail({
                from: FROM_EMAIL,
                to: [email],
                reply_to: REPLY_TO_EMAIL,
                subject: "We Received Your Lift Fi Inquiry",
                html: confirmation.html,
                text: confirmation.text,
            });
        } catch (confirmErr) {
            console.error("Confirmation email failed (lead was still delivered):", confirmErr.message);
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error("Contact form error:", err.message);
        return res.status(502).json({
            ok: false,
            error: `Something went wrong while submitting your inquiry. Please try again or contact ${PUBLIC_EMAIL}.`,
        });
    }
});

initFinancialModelTable()
    .catch((err) => console.error("Financial model table init failed:", err.message))
    .finally(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Lift Fi server running on port ${PORT}`);
        });
    });
