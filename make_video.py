"""
Inventory Management System Feature Video
6 slides: Hero, Dashboard, Product Management, Inventory Updates, Audits, Reports, CTA
Voice: Microsoft AriaNeural (Azure TTS)
Output: InventoryPro-Features.mp4
"""

import os, asyncio, subprocess, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import edge_tts
import imageio_ffmpeg

FFMPEG  = imageio_ffmpeg.get_ffmpeg_exe()
VOICE   = "en-US-AriaNeural"
RATE    = "+3%"
OUT_DIR = Path("video_out")
OUT_DIR.mkdir(exist_ok=True)
W, H    = 1280, 720

# Color palette
BLUE    = (29,  78, 216)
INDIGO  = (79,  70, 229)
EMERALD = (16, 185, 129)
AMBER   = (245, 158,  11)
TEAL    = (20, 184, 166)
ROSE    = (244,  63,  94)
DARK    = (15,  23,  42)
WHITE   = (255, 255, 255)
SLATE   = (71,  85, 105)

# ── helpers ──────────────────────────────────────────────────────────────────

def font(size, bold=False):
    candidates = (
        ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/calibrib.ttf"] if bold
        else ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/calibri.ttf"]
    )
    for p in candidates:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

def tw(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[2]-b[0], b[3]-b[1]

def cx(draw, text, y, f, color=WHITE, wrap=0):
    if wrap:
        lines = textwrap.wrap(text, wrap)
        _, lh = tw(draw, "A", f)
        for i, ln in enumerate(lines):
            w, _ = tw(draw, ln, f)
            draw.text(((W-w)//2, y+i*(lh+8)), ln, font=f, fill=color)
        return y + len(lines)*(lh+8)
    w, h = tw(draw, text, f)
    draw.text(((W-w)//2, y), text, font=f, fill=color)
    return y + h

def grad(img, top, bot):
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y/H
        r = int(top[0]*(1-t)+bot[0]*t)
        g = int(top[1]*(1-t)+bot[1]*t)
        b = int(top[2]*(1-t)+bot[2]*t)
        d.line([(0, y), (W, y)], fill=(r, g, b))
    return ImageDraw.Draw(img)

def rr(draw, xy, r, fill=None, outline=None, ow=2):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=ow)

def pill(draw, x, y, text, bg, fg=WHITE, fsize=16):
    f = font(fsize)
    w, h = tw(draw, text, f)
    rr(draw, [x, y, x+w+28, y+h+12], 22, fill=bg)
    draw.text((x+14, y+6), text, font=f, fill=fg)
    return w + 28

def kpi_card(draw, x, y, w, h, label, value, sub, col):
    rr(draw, [x, y, x+w, y+h], 16, fill=(col[0]//6, col[1]//6, col[2]//6), outline=col, ow=2)
    vf = font(28, bold=True)
    lf = font(12)
    sf = font(11)
    vw, _ = tw(draw, value, vf)
    lw, _ = tw(draw, label, lf)
    sw, _ = tw(draw, sub, sf)
    cx2 = x + w//2
    draw.text((cx2 - vw//2, y+12), value, font=vf, fill=WHITE)
    draw.text((cx2 - lw//2, y+48), label, font=lf, fill=(160, 180, 230))
    draw.text((cx2 - sw//2, y+66), sub, font=sf, fill=col)

def bottom_nav(draw, active=""):
    items = ["Dashboard", "Products", "Inventory", "Audit"]
    rr(draw, [30, H-64, W-30, H-12], 16, fill=(18, 28, 60), outline=(45, 65, 115), ow=1)
    sw = (W-60)//4
    for i, item in enumerate(items):
        x = 30 + i*sw + sw//2
        col = WHITE if item == active else (110, 130, 170)
        f = font(15, bold=(item == active))
        iw, _ = tw(draw, item, f)
        draw.text((x-iw//2, H-51), item, font=f, fill=col)
        if item == active:
            draw.ellipse([x-3, H-18, x+3, H-12], fill=BLUE)

slides = []

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — HERO
# ══════════════════════════════════════════════════════════════════════════════
def draw_hero(img):
    d = grad(img, (8, 14, 52), (30, 10, 80))

    # Logo pill
    lf = font(36, bold=True)
    lw, _ = tw(d, "Inventory Pro", lf)
    px = (W - lw - 56)//2
    rr(d, [px, 72, px+lw+56, 130], 30, fill=WHITE)
    d.text((px+28, 80), "Inventory Pro", font=lf, fill=DARK)

    # Headline
    cx(d, "Your Inventory.", 158, font(52, bold=True))
    cx(d, "Real-time. Mobile. Organized.", 222, font(52, bold=True), (172, 184, 255))

    # Sub
    cx(d, "Track stock, manage products, audit inventory, and generate", 306, font(19), (190, 200, 240))
    cx(d, "reports instantly. For businesses of any size. Free to start.", 336, font(19), (190, 200, 240))

    # Audience pills
    pills_list = [("For Retail", BLUE), ("For Warehouses", INDIGO)]
    total = sum(pill(d, -9999, 0, t, c, fsize=18) for t, c in pills_list) + 24
    px2 = (W - total)//2
    for label, col in pills_list:
        pw = pill(d, px2, 394, label, col, fsize=18)
        px2 += pw + 24

    # Feature dots row
    feats = ["Track Stock", "Manage Products", "Daily Audits", "Real-time Reports", "Mobile App"]
    feat_cols = [INDIGO, EMERALD, TEAL, ROSE, BLUE]
    total_f = sum(pill(d, -9999, 0, f, c, fsize=14) for f, c in zip(feats, feat_cols)) + 16*4
    fx = (W - total_f)//2
    for label, col in zip(feats, feat_cols):
        pw = pill(d, fx, 458, label, col, fsize=14)
        fx += pw + 16

    bottom_nav(d, "Dashboard")

slides.append(("hero",
    "Welcome to Inventory Pro — the complete inventory management system built for modern businesses. "
    "Whether you run a small retail store or manage a large warehouse, "
    "Inventory Pro gives you real-time visibility into every product, every transaction, every count. "
    "Track current stock levels instantly. Manage your entire product catalog with pricing and hierarchies. "
    "Run daily physical audits in minutes. Generate reports on demand. "
    "And do it all from any device — desktop, tablet, or mobile phone. "
    "Inventory Pro keeps your business running smoothly. "
    "Let us show you how it works.",
    draw_hero))

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
def draw_dashboard(img):
    d = grad(img, (8, 16, 54), (14, 22, 64))

    # Header banner
    rr(d, [36, 16, W-36, 72], 16, fill=BLUE)
    d.text((68, 24), "Dashboard", font=font(24, bold=True), fill=WHITE)
    d.text((68, 52), "Real-time inventory overview at a glance", font=font(15), fill=(190, 220, 255))

    # 4 KPI cards
    kpis = [
        ("83", "Products", "Active SKUs", BLUE),
        ("2", "Low Stock", "Below minimum", ROSE),
        ("4,040", "Total Units", "All locations", EMERALD),
        ("15m ago", "Last Update", "Dashboard sync", TEAL),
    ]
    kw = (W - 80 - 3*16)//4
    for i, (val, lbl, sub, col) in enumerate(kpis):
        kpi_card(d, 40 + i*(kw+16), 88, kw, 98, lbl, val, sub, col)

    # Low Stock Alerts section
    rr(d, [36, 202, W-36, 224], 6, fill=(80, 30, 30))
    alert_label = "LOW STOCK ALERTS — 2 items require attention"
    aw, _ = tw(d, alert_label, font(13, bold=True))
    d.text(((W-aw)//2, 205), alert_label, font=font(13, bold=True), fill=(255, 150, 150))

    # Low stock items
    low_items = [
        ("Covers Jio Covers 8 x 11", "0 units", "Min: 3"),
        ("Covers Pickle Covers 8 x 10", "2 units", "Min: 5"),
    ]
    for i, (name, curr, minr) in enumerate(low_items):
        ly = 238 + i*58
        rr(d, [36, ly, W-36, ly+52], 12, fill=(40, 18, 18), outline=ROSE, ow=2)
        d.ellipse([48, ly+20, 58, ly+30], fill=ROSE)
        d.text((68, ly+8), name, font=font(13, bold=True), fill=WHITE)
        d.text((68, ly+28), f"{curr}  •  {minr}", font=font(12), fill=(220, 160, 160))
        d.text((W-56, ly+16), "Reorder", font=font(12, bold=True), fill=ROSE)

    # Recent Activity section
    rr(d, [36, 368, W-36, 388], 6, fill=(50, 30, 100))
    rec_label = "RECENT ACTIVITY"
    rw, _ = tw(d, rec_label, font(13, bold=True))
    d.text(((W-rw)//2, 371), rec_label, font=font(13, bold=True), fill=(200, 180, 255))

    # Activity items
    activities = [
        ("PC Plates Paper Type 8 No PC", "Stock Out", "-10 → 240", ROSE, "15h ago"),
        ("Carry Covers Dolly 10 x 12", "Stock In", "+50 → 150", EMERALD, "2d ago"),
    ]
    for i, (prod, action, qty, col, time) in enumerate(activities):
        ay = 402 + i*48
        d.text((48, ay), prod, font=font(12, bold=True), fill=WHITE)
        d.text((48, ay+20), f"{action}  •  {time}", font=font(11), fill=(160, 180, 230))
        rr(d, [W-140, ay+8, W-48, ay+32], 8, fill=(col[0]//5, col[1]//5, col[2]//5), outline=col, ow=1)
        qw, _ = tw(d, qty, font(11, bold=True))
        d.text((W-140 + (92-qw)//2, ay+12), qty, font=font(11, bold=True), fill=col)

    bottom_nav(d, "Dashboard")

slides.append(("dashboard",
    "Every inventory manager's day starts with the dashboard. "
    "In one view, you see your complete business picture: "
    "how many products you manage, how many are low on stock, "
    "your total inventory value across all locations, and when your data was last updated. "
    "Immediately below, a dedicated Low Stock Alerts section shows which items need urgent attention — "
    "no more missing restocks. "
    "And at the bottom, Recent Activity logs every inventory movement, "
    "showing what changed, how much it changed, and when. "
    "Every transaction is logged with the resulting stock level, so there is no confusion. "
    "The dashboard syncs in real-time, so whether you are in the office or in the field, "
    "you are always looking at current data.",
    draw_dashboard))

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — PRODUCT MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════
def draw_products(img):
    d = grad(img, (14, 12, 58), (8, 8, 44))

    # Header
    rr(d, [36, 16, W-36, 72], 16, fill=BLUE)
    d.text((68, 24), "Products", font=font(24, bold=True), fill=WHITE)
    d.text((68, 52), "Organize and track your complete catalog", font=font(15), fill=(190, 220, 255))

    # Search bar
    rr(d, [36, 82, W-36, 114], 12, fill=(20, 32, 80), outline=(56, 86, 156), ow=1)
    d.text((54, 93), "🔍 Search by name or product code...", font=font(12), fill=(120, 140, 190))

    # Category pills
    cats = ["All", "Covers", "Plates", "Bags", "Boxes"]
    cx = 36
    for cat in cats:
        col = BLUE if cat == "All" else (60, 70, 140)
        pill(d, cx, 128, cat, col, fsize=13)
        ww, _ = tw(d, cat, font(13))
        cx += ww + 44

    # Product list
    products_list = [
        ("PC", "PC Plates Paper Type 8 No PC", "PCPL-PAPE-8NOP", "240", "units", "₹12", "₹18"),
        ("CC", "Carry Covers Dolly 10 x 12", "CARR-DOLL-10X1", "150", "units", "₹8", "₹15"),
        ("CB", "Covers Jio Covers 8 x 11", "COVI-JIOC-8X11", "0", "Low", "₹5", "₹10"),
    ]
    py = 160
    for initials, name, code, qty, status, actual, selling in products_list:
        # Product card
        rr(d, [36, py, W-36, py+58], 12, fill=(18, 26, 70), outline=(45, 70, 140), ow=1)

        # Initials circle
        rr(d, [48, py+12, 78, py+42], 8, fill=BLUE)
        d.text((58, py+18), initials, font=font(14, bold=True), fill=WHITE)

        # Product info
        d.text((92, py+8), name, font=font(13, bold=True), fill=WHITE)
        d.text((92, py+26), code, font=font(11), fill=(120, 140, 190))

        # Quantity
        qty_col = ROSE if status == "Low" else EMERALD
        d.text((W-280, py+14), qty, font=font(16, bold=True), fill=qty_col)
        d.text((W-280, py+34), status, font=font(11), fill=(160, 180, 230))

        # Prices
        d.text((W-180, py+14), selling, font=font(13, bold=True), fill=BLUE)
        d.text((W-180, py+32), actual, font=font(10), fill=(140, 160, 210), )

        py += 68

    # Add Product button
    rr(d, [W-240, H-128, W-48, H-88], 14, fill=BLUE)
    d.text((W-200, H-112), "➕ Add Product", font=font(13, bold=True), fill=WHITE)

    bottom_nav(d, "Products")

slides.append(("products",
    "Your entire product catalog lives in the Products section. "
    "Search instantly by product name or code to find any item in seconds. "
    "Filter by category or location to focus on what matters. "
    "Every product card shows you the product name, its unique code, current stock level, "
    "and its actual cost and selling price — so you can see your margin at a glance. "
    "When you add a new product, you build it from your existing hierarchy — "
    "categories, subcategories, variants, and sizes. "
    "This keeps your entire catalog organized and consistent. "
    "Want to edit a product or adjust its minimum stock threshold? "
    "Tap on any product card and make changes in seconds. "
    "Prices are tracked so you always know your profitability.",
    draw_products))

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — INVENTORY UPDATES
# ══════════════════════════════════════════════════════════════════════════════
def draw_inventory(img):
    d = grad(img, (10, 16, 54), (16, 22, 64))

    # Header
    rr(d, [36, 16, W-36, 72], 16, fill=BLUE)
    d.text((68, 24), "Update Inventory", font=font(24, bold=True), fill=WHITE)
    d.text((68, 52), "Record stock movements in real-time", font=font(15), fill=(190, 220, 255))

    # Form section
    FORM_L, FORM_R = 36, 540

    # Select Product
    d.text((FORM_L+20, 92), "Select Product", font=font(13, bold=True), fill=(160, 180, 230))
    rr(d, [FORM_L+20, 112, FORM_R-20, 148], 10, fill=(20, 32, 80), outline=(56, 86, 156), ow=1)
    d.text((FORM_L+40, 125), "🔍 PC Plates Paper Type 8 No PC", font=font(12), fill=WHITE)

    # Action
    d.text((FORM_L+20, 168), "Action", font=font(13, bold=True), fill=(160, 180, 230))
    actions = ["Stock In", "Stock Out", "Adjust"]
    ax = FORM_L+20
    for act in actions:
        col = EMERALD if act == "Stock In" else (ROSE if act == "Stock Out" else TEAL)
        rr(d, [ax, 188, ax+90, 216], 8, fill=(col[0]//6, col[1]//6, col[2]//6), outline=col, ow=1)
        aw, _ = tw(d, act, font(11, bold=True))
        d.text((ax+45-aw//2, 196), act, font=font(11, bold=True), fill=col)
        ax += 110

    # Quantity
    d.text((FORM_L+20, 236), "Quantity", font=font(13, bold=True), fill=(160, 180, 230))
    rr(d, [FORM_L+20, 256, FORM_R-20, 292], 10, fill=(20, 32, 80), outline=(56, 86, 156), ow=1)
    d.text((FORM_L+40, 269), "10", font=font(14, bold=True), fill=WHITE)

    # Notes
    d.text((FORM_L+20, 312), "Notes (optional)", font=font(13, bold=True), fill=(160, 180, 230))
    rr(d, [FORM_L+20, 332, FORM_R-20, 386], 10, fill=(20, 32, 80), outline=(56, 86, 156), ow=1)
    d.text((FORM_L+40, 345), "Damaged goods", font=font(12), fill=(190, 210, 255))

    # Save button
    rr(d, [FORM_L+20, 402, FORM_R-20, 440], 12, fill=BLUE)
    d.text((278, 413), "Update Stock", font=font(13, bold=True), fill=WHITE)

    # Right: Recent history
    REC_L, REC_R = 560, W-36
    d.text((REC_L+16, 92), "Recent Updates", font=font(14, bold=True), fill=WHITE)

    updates = [
        ("PC Plates Paper Type 8 No PC", "-10 → 240", ROSE, "15h ago"),
        ("Carry Covers Dolly 10 x 12", "+50 → 150", EMERALD, "2d ago"),
        ("Covers Jio Covers 8 x 11", "Adjust: 3", TEAL, "3d ago"),
    ]
    uy = 118
    for prod, qty, col, time in updates:
        rr(d, [REC_L, uy, REC_R, uy+48], 10, fill=(col[0]//8, col[1]//8, col[2]//8), outline=col, ow=1)
        d.text((REC_L+12, uy+6), prod, font=font(11, bold=True), fill=WHITE)
        d.text((REC_L+12, uy+24), time, font=font(10), fill=(160, 180, 230))
        qw, _ = tw(d, qty, font(11, bold=True))
        d.text((REC_R-12-qw, uy+18), qty, font=font(11, bold=True), fill=col)
        uy += 62

    bottom_nav(d, "Inventory")

slides.append(("inventory",
    "Daily inventory updates are quick and easy. "
    "Select the product you are updating using a searchable dropdown — "
    "no more typing or scrolling through huge lists. "
    "Choose your action: Stock In when you receive goods, Stock Out when you sell or use inventory, "
    "or Adjust when you need to correct a count. "
    "Enter the quantity, optionally add a note for context — damaged goods, theft, supplier error, whatever — "
    "and hit Save. "
    "That transaction is immediately logged with a timestamp. "
    "Every update shows you the change and the resulting stock level, "
    "so there is no ambiguity about what your current inventory really is. "
    "The Recent Updates panel on the right shows your latest movements, "
    "and all of it syncs to your dashboard and reports in real-time.",
    draw_inventory))

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — DAILY AUDITS
# ══════════════════════════════════════════════════════════════════════════════
def draw_audits(img):
    d = grad(img, (14, 12, 58), (8, 14, 52))

    # Header
    rr(d, [36, 16, W-36, 72], 16, fill=BLUE)
    d.text((68, 24), "Daily Audit", font=font(24, bold=True), fill=WHITE)
    d.text((68, 52), "Physical count every product systematically", font=font(15), fill=(190, 220, 255))

    # Stats row
    kpis_audit = [
        ("5", "Items", "to count", BLUE),
        ("3", "Done", "completed", EMERALD),
        ("2", "Pending", "in progress", AMBER),
    ]
    kw2 = (W - 80 - 2*16)//3
    for i, (val, lbl, sub, col) in enumerate(kpis_audit):
        kpi_card(d, 40 + i*(kw2+16), 88, kw2, 90, lbl, val, sub, col)

    # Search bar
    rr(d, [36, 190, W-36, 222], 12, fill=(20, 32, 80), outline=(56, 86, 156), ow=1)
    d.text((54, 201), "🔍 Search product name or code...", font=font(12), fill=(120, 140, 190))

    # Audit items
    audit_items = [
        ("1", "PC Plates Paper Type 8", "240", "240", "✓", EMERALD),
        ("2", "Carry Covers Dolly 10 x 12", "150", "148", "-2", ROSE),
        ("3", "Covers Jio Covers 8 x 11", "3", "0", "-3", ROSE),
    ]
    iy = 238
    for num, name, expected, actual, diff, col in audit_items:
        rr(d, [36, iy, W-36, iy+62], 12, fill=(18, 26, 70), outline=(45, 70, 140), ow=1)

        # Number badge
        rr(d, [48, iy+12, 74, iy+38], 8, fill=BLUE)
        d.text((58, iy+18), num, font=font(13, bold=True), fill=WHITE)

        # Product name
        d.text((88, iy+8), name, font=font(12, bold=True), fill=WHITE)

        # Expected vs Actual
        d.text((88, iy+28), f"Expected: {expected}  →  Actual: {actual}", font=font(11), fill=(160, 180, 230))

        # Diff badge
        rr(d, [W-80, iy+14, W-36, iy+48], 10, fill=(col[0]//6, col[1]//6, col[2]//6), outline=col, ow=2)
        dw, _ = tw(d, diff, font(12, bold=True))
        d.text((W-80 + (44-dw)//2, iy+18), diff, font=font(12, bold=True), fill=col)

        iy += 74

    # Submit button
    rr(d, [36, 500, W-36, 540], 14, fill=BLUE)
    d.text((640, 513), "Submit Audit", font=font(14, bold=True), fill=WHITE)

    bottom_nav(d, "Audit")

slides.append(("audits",
    "Every business needs a reliable count of what it actually has versus what it thinks it has. "
    "Inventory Pro makes daily audits fast and painless. "
    "Hit Start Audit and the system loads every active product sorted alphabetically. "
    "Search within the audit to quickly jump to specific items. "
    "For each product, you see what you expected to have and you enter what you actually counted. "
    "The system instantly shows you the difference — oversupply, shortage, or match. "
    "If there is a discrepancy, you can note the reason: damage, theft, recount, supplier error, whatever. "
    "When you are done, hit Submit. The audit is archived with a timestamp, "
    "stock levels are corrected, and a complete record is stored for compliance and trend analysis. "
    "Run an audit every day, every week, or whenever you need — "
    "Inventory Pro keeps your counts honest.",
    draw_audits))

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — REPORTS
# ══════════════════════════════════════════════════════════════════════════════
def draw_reports(img):
    d = grad(img, (16, 14, 56), (12, 18, 60))

    # Header
    rr(d, [36, 16, W-36, 72], 16, fill=BLUE)
    d.text((68, 24), "Reports", font=font(24, bold=True), fill=WHITE)
    d.text((68, 52), "Data-driven insights for smart decisions", font=font(15), fill=(190, 220, 255))

    # Filter pills
    filters = ["All Products", "Category Filter", "Low Stock Only"]
    fx = 36
    for filt in filters:
        col = BLUE if "All" in filt else (60, 70, 140)
        pill(d, fx, 88, filt, col, fsize=12)
        fw, _ = tw(d, filt, font(12))
        fx += fw + 36

    # Left panel: Low stock
    rr(d, [36, 132, 600, 500], 16, fill=(14, 22, 70), outline=(45, 70, 140), ow=1)
    d.text((54, 148), "Low Stock Alert (2 items)", font=font(14, bold=True), fill=WHITE)

    low_report = [
        ("Covers Jio Covers 8 x 11", "0 units", "Min: 3", ROSE),
        ("Covers Pickle Covers 8 x 10", "2 units", "Min: 5", ROSE),
    ]
    ry = 174
    for name, stock, minr, col in low_report:
        rr(d, [54, ry, 582, ry+44], 10, fill=(col[0]//8, col[1]//8, col[2]//8), outline=col, ow=1)
        d.text((68, ry+6), name, font=font(11, bold=True), fill=WHITE)
        d.text((68, ry+24), f"{stock}  •  Required: {minr}", font=font(10), fill=(200, 160, 160))
        ry += 60

    # Category breakdown
    d.text((54, 268), "Stock by Category", font=font(14, bold=True), fill=WHITE)
    categories = [
        ("Covers", "1,240 units", 1240, EMERALD),
        ("Plates", "850 units", 850, TEAL),
        ("Bags", "680 units", 680, INDIGO),
        ("Boxes", "270 units", 270, AMBER),
    ]
    cy = 296
    for cat, val, amt, col in categories:
        # Bar
        bar_w = int(amt / 1240 * (582-68))
        d.rectangle([68, cy+18, 68+bar_w, cy+26], fill=col)
        d.text((68, cy+2), cat, font=font(11, bold=True), fill=WHITE)
        d.text((582-80, cy+4), val, font=font(11, bold=True), fill=col)
        cy += 50

    # Right panel: Recent summary
    rr(d, [620, 132, W-36, 500], 16, fill=(14, 22, 70), outline=(45, 70, 140), ow=1)
    d.text((638, 148), "Summary", font=font(14, bold=True), fill=WHITE)

    summary_items = [
        ("Total Products", "83", BLUE),
        ("Low Stock Items", "2", ROSE),
        ("Total Units", "4,040", EMERALD),
        ("Last Updated", "15 min ago", TEAL),
    ]
    sy = 178
    for lbl, val, col in summary_items:
        d.text((638, sy), lbl, font=font(11), fill=(160, 180, 230))
        d.text((638, sy+18), val, font=font(16, bold=True), fill=col)
        sy += 62

    bottom_nav(d, "Audit")

slides.append(("reports",
    "Reporting transforms raw inventory data into actionable insights. "
    "Filter by category, location, or minimum stock status to focus on what matters. "
    "See at a glance which items are low and need immediate restocking. "
    "Get a breakdown of inventory by category — how many units you have in Covers versus Plates versus Bags. "
    "See total units across your entire operation and when your data was last refreshed. "
    "Export any report to share with stakeholders, accounting, or supply chain. "
    "All data is updated in real-time as inventory moves, so your reports are never stale. "
    "Make smarter business decisions with accurate, current data.",
    draw_reports))

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — CTA
# ══════════════════════════════════════════════════════════════════════════════
def draw_cta(img):
    d = grad(img, (8, 14, 52), (24, 8, 72))

    # Logo
    lf = font(34, bold=True)
    lw, _ = tw(d, "Inventory Pro", lf)
    px0 = (W - lw - 56)//2
    rr(d, [px0, 56, px0+lw+56, 118], 30, fill=WHITE)
    d.text((px0+28, 66), "Inventory Pro", font=lf, fill=DARK)

    cx(d, "Stop Spreadsheets. Start Smart.", 142, font(46, bold=True))
    cx(d, "Manage your entire inventory in one place.", 204, font(21), (172, 184, 255))

    # Two entry cards
    # For Business card
    rr(d, [60, 260, 608, 440], 24, fill=(14, 34, 90), outline=BLUE, ow=3)
    rr(d, [60, 260, 608, 310], 14, fill=BLUE)
    d.text((82, 270), "For Your Business", font=font(20, bold=True), fill=WHITE)
    business_points = [
        "Track unlimited products with pricing",
        "Run daily audits and get instant reports",
        "Mobile-first app works offline and online",
    ]
    for i, pt in enumerate(business_points):
        py2 = 324 + i*36
        d.ellipse([82, py2+5, 94, py2+17], fill=BLUE)
        d.text((104, py2+1), pt, font=font(14), fill=(190, 210, 255))
    rr(d, [82, 408, 320, 432], 12, fill=BLUE)
    d.text((90, 414), "Get Started Free", font=font(13, bold=True), fill=WHITE)

    # For Teams card
    rr(d, [636, 260, W-60, 440], 24, fill=(30, 12, 72), outline=INDIGO, ow=3)
    rr(d, [636, 260, W-60, 310], 14, fill=INDIGO)
    d.text((660, 270), "For Your Team", font=font(20, bold=True), fill=WHITE)
    team_points = [
        "Real-time sync across all locations",
        "Complete audit trail for compliance",
        "Works on any device, any time",
    ]
    for i, pt in enumerate(team_points):
        py2 = 324 + i*36
        d.ellipse([660, py2+5, 672, py2+17], fill=INDIGO)
        d.text((684, py2+1), pt, font=font(14), fill=(210, 190, 255))
    rr(d, [660, 408, W-80, 432], 12, fill=INDIGO)
    d.text((678, 414), "Schedule a Demo", font=font(13, bold=True), fill=WHITE)

    # Bottom badges
    badges = [("Mobile App", EMERALD), ("Cloud Sync", BLUE), ("Real-time", TEAL), ("Free Trial", ROSE)]
    bx = (W - sum(pill(d, -9999, 0, t, c, fsize=14) for t, c in badges) - 16*3)//2
    for label, col in badges:
        pw = pill(d, bx, 460, label, col, fsize=14)
        bx += pw + 16

    bottom_nav(d, "Dashboard")

slides.append(("cta",
    "Inventory Pro is designed for businesses that are tired of spreadsheets and manual counting. "
    "Get started free — no credit card, no setup fees. "
    "Upload your product list, set minimum stock levels, and start tracking. "
    "The mobile app works on any phone or tablet, and it works offline too — "
    "sync happens automatically when you reconnect. "
    "For teams, everyone sees real-time updates across all locations simultaneously. "
    "For compliance, every transaction is logged with a timestamp and notes. "
    "Try Inventory Pro free for 30 days. No commitment. No contract. "
    "Just smarter inventory management — starting right now. "
    "Visit the website to get started or schedule a demo with our team.",
    draw_cta))

# ══════════════════════════════════════════════════════════════════════════════
# RENDER
# ══════════════════════════════════════════════════════════════════════════════
print("\n-- Rendering frames --")
frame_paths = []
for i, (name, narration, draw_fn) in enumerate(slides):
    img = Image.new("RGB", (W, H), DARK)
    draw_fn(img)
    fp = OUT_DIR / f"{i:02d}_{name}.png"
    img.save(str(fp))
    frame_paths.append(str(fp))
    print(f"  [{i+1}/{len(slides)}] {name}.png")

# ══════════════════════════════════════════════════════════════════════════════
# NARRATION
# ══════════════════════════════════════════════════════════════════════════════
print("\n-- Generating narration --")
audio_paths = []

async def gen_audio(text, path):
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(path)

async def gen_all():
    for i, (name, narration, _) in enumerate(slides):
        ap = str(OUT_DIR / f"{i:02d}_{name}.mp3")
        await gen_audio(narration, ap)
        audio_paths.append(ap)
        print(f"  [{i+1}/{len(slides)}] {name}.mp3")

asyncio.run(gen_all())

# ══════════════════════════════════════════════════════════════════════════════
# ASSEMBLE
# ══════════════════════════════════════════════════════════════════════════════
def get_duration(ap):
    r = subprocess.run([FFMPEG, "-i", ap, "-f", "null", "-"], capture_output=True, text=True)
    for line in (r.stdout+r.stderr).split("\n"):
        if "Duration:" in line:
            p = line.strip().split("Duration:")[1].split(",")[0].strip()
            h, m, s = p.split(":"); return float(h)*3600 + float(m)*60 + float(s)
    return 8.0

print("\n-- Building clips --")
clip_paths = []; total_dur = 0
for i, (fp, ap) in enumerate(zip(frame_paths, audio_paths)):
    dur = get_duration(ap) + 1.0
    dur = max(dur, 8.0)
    total_dur += dur
    cp = str(OUT_DIR / f"{i:02d}_clip.mp4")
    subprocess.run([
        FFMPEG, "-y", "-loop", "1", "-i", fp, "-i", ap,
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p", "-t", str(dur),
        "-vf", "scale=1280:720", cp
    ], check=True, capture_output=True)
    clip_paths.append(cp)
    print(f"  [{i+1}/{len(slides)}] {Path(cp).name} ({dur:.1f}s)")
print(f"  Total: {total_dur:.0f}s (~{total_dur/60:.1f} min)")

concat_file = str(OUT_DIR / "concat.txt")
with open(concat_file, "w") as f:
    for cp in clip_paths:
        f.write(f"file '{os.path.abspath(cp).replace(chr(92), '/')}'\n")

out = "InventoryPro-Features.mp4"
print(f"\n-- Concatenating -> {out} --")
subprocess.run([
    FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", out
], check=True, capture_output=True)

sz = os.path.getsize(out)/1024/1024
r2 = subprocess.run([FFMPEG, "-i", out, "-f", "null", "-"], capture_output=True, text=True)
for line in (r2.stdout+r2.stderr).split("\n"):
    if "Duration:" in line:
        dur_str = line.strip().split("Duration:")[1].split(",")[0].strip()
        print(f"\nDone!  {out}  |  Duration: {dur_str}  |  Size: {sz:.1f} MB")
        break
