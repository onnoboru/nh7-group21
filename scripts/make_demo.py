"""Generate a short Kindred UI walkthrough without changing app dependencies."""

from pathlib import Path
import shutil
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 12
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "demo"
COLORS = {
    "canvas": "#f8f7f2", "paper": "#fffefa", "ink": "#283c33",
    "muted": "#65746a", "green": "#305e47", "dark": "#204a36",
    "sage": "#e9eee3", "peach": "#f5dfcd", "line": "#e3e6dc",
    "gold": "#c1875d", "cream": "#f5ecdd", "white": "#fffdf4",
}
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def rr(draw, box, radius=18, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, size=24, color=None, bold=False, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=color or COLORS["ink"], anchor=anchor)


def wrapped(draw, xy, value, width, size=20, color=None, bold=False, spacing=6):
    words, lines, line = value.split(), [], ""
    f = font(size, bold)
    for word in words:
        candidate = f"{line} {word}".strip()
        if draw.textlength(candidate, font=f) <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    draw.multiline_text(xy, "\n".join(lines), font=f, fill=color or COLORS["ink"], spacing=spacing)


def base(title, eyebrow, section="Discover", points="60"):
    image = Image.new("RGB", (W, H), COLORS["canvas"])
    d = ImageDraw.Draw(image)
    d.rectangle((0, 0, 218, H), fill="#fdfcf7")
    d.line((218, 0, 218, H), fill=COLORS["line"], width=2)
    rr(d, (28, 28, 70, 73), 13, COLORS["green"])
    text(d, (49, 51), "k", 37, COLORS["white"], True, "mm")
    text(d, (84, 50), "kindred", 28, COLORS["ink"], True, "lm")
    nav = [("Discover", 128), ("Activities", 184), ("My circle", 240), ("Rewards", 296)]
    for label, y in nav:
        if label == section:
            rr(d, (22, y - 20, 196, y + 26), 11, COLORS["green"])
        text(d, (48, y + 3), label, 16, COLORS["white"] if label == section else COLORS["muted"], label == section, "lm")
    text(d, (30, 634), "Demo · stays on this device", 12, COLORS["muted"])
    d.line((247, 82, 1245, 82), fill=COLORS["line"], width=1)
    text(d, (252, 47), "A space to belong", 14, COLORS["muted"], True)
    rr(d, (1122, 26, 1228, 66), 20, "#f1edda")
    text(d, (1175, 46), f"✦  {points}", 15, "#6c6236", True, "mm")
    text(d, (252, 113), eyebrow.upper(), 12, COLORS["green"], True)
    text(d, (252, 141), title, 35, COLORS["ink"], True)
    return image, d


def cursor(d, x, y, pulse=0):
    r = 11 + int(3 * pulse)
    d.ellipse((x-r, y-r, x+r, y+r), fill="#ffffff", outline=COLORS["gold"], width=4)


def scene_intro(t):
    im, d = base("A little closer, every day.", "Familiar people. New perspectives.", points="0")
    rr(d, (252, 204, 1230, 612), 24, "#edf0df", "#dce4ce")
    text(d, (292, 242), "GROWING CLOSER, ACROSS GENERATIONS", 13, COLORS["green"], True)
    text(d, (292, 286), "Small moments.", 48, COLORS["dark"], True)
    text(d, (292, 344), "Stronger connections.", 48, COLORS["dark"], True)
    wrapped(d, (294, 414), "Start with someone beside you, then keep familiar people close — wherever they are.", 520, 21, COLORS["muted"])
    rr(d, (294, 505, 508, 558), 12, COLORS["green"])
    text(d, (401, 532), "Play face to face  →", 17, COLORS["white"], True, "mm")
    # Simple two-generation illustration
    d.ellipse((880, 270, 1015, 405), fill="#f5c29c")
    d.ellipse((1030, 255, 1165, 390), fill="#b0c6b9")
    d.ellipse((917, 296, 977, 356), fill="#cd8a61")
    d.ellipse((1067, 280, 1127, 340), fill="#e8b891")
    rr(d, (902, 355, 992, 500), 28, "#bd7651")
    rr(d, (1052, 339, 1142, 500), 28, COLORS["green"])
    text(d, (1022, 230), "♡", 42, COLORS["gold"], True, "mm")
    cursor(d, 500, 532, abs((t % 1) - .5))
    return im


def scene_paths(t):
    im, d = base("Choose the moment that fits.", "Two ways to stay connected", points="0")
    cards = [
        (252, 205, 720, 520, COLORS["sage"], "READY TO PLAY", "Together now",
         "Two real people share one screen, take turns, and keep both reflections.", "Play face to face"),
        (744, 205, 1230, 520, COLORS["cream"], "REMOTE CIRCLE · PLANNED", "Trusted circle",
         "Family and guardian-approved people can build a shared routine, even from afar.", "Preview trusted circle"),
    ]
    for x1, y1, x2, y2, bg, status, heading, body, action in cards:
        rr(d, (x1, y1, x2, y2), 20, bg, COLORS["line"])
        text(d, (x1+30, y1+35), status, 12, COLORS["green"], True)
        text(d, (x1+30, y1+78), heading, 31, COLORS["ink"], True)
        wrapped(d, (x1+30, y1+132), body, x2-x1-60, 18, COLORS["muted"], spacing=8)
        rr(d, (x1+30, y2-75, x1+245, y2-25), 11, COLORS["green"] if x1 < 700 else COLORS["paper"], COLORS["green"])
        text(d, (x1+137, y2-50), action, 15, COLORS["white"] if x1 < 700 else COLORS["green"], True, "mm")
    text(d, (252, 565), "Start together today. Add safe remote connections when you are ready.", 18, COLORS["muted"])
    cursor(d, 458 if t < .55 else 880, 470, abs((t % 1)-.5))
    return im


def scene_setup(t):
    im, d = base("Play face to face.", "Two people. One device.", section="Activities", points="0")
    rr(d, (330, 194, 1154, 635), 24, COLORS["paper"], COLORS["line"])
    wrapped(d, (374, 231), "Sit together and take turns. No account, age, or community profile is needed.", 730, 18, COLORS["muted"])
    fields = [(374, 306, "PLAYER 1 NICKNAME", "Alex"), (746, 306, "PLAYER 2 NICKNAME", "Gran")]
    for x, y, label, value in fields:
        text(d, (x, y), label, 12, COLORS["muted"], True)
        rr(d, (x, y+28, x+330, y+84), 9, "#ffffff", "#cbd3c3")
        text(d, (x+18, y+56), value, 18, COLORS["ink"], False, "lm")
    text(d, (374, 426), "CHOOSE YOUR ACTIVITY", 12, COLORS["muted"], True)
    rr(d, (374, 454, 1076, 514), 9, "#ffffff", "#cbd3c3")
    text(d, (394, 484), "A little green knowledge · Quiz", 18, COLORS["ink"], False, "lm")
    rr(d, (822, 548, 1076, 603), 11, COLORS["green"])
    text(d, (949, 576), "Start together  →", 17, COLORS["white"], True, "mm")
    cursor(d, 1045, 576, abs((t % 1)-.5))
    return im


def scene_turns(t):
    im, d = base("A little green knowledge", "Face to face · on this device", section="Activities", points="0")
    for idx, (name, active, x) in enumerate([("Alex", t < .5, 274), ("Gran", t >= .5, 510)]):
        rr(d, (x, 196, x+212, 250), 12, "#fffef6" if active else "#f7f8f0", COLORS["green"] if active else "#ccd5c4", 3 if active else 1)
        d.ellipse((x+15, 207, x+47, 239), fill="#e0e9d5" if idx == 0 else COLORS["peach"])
        text(d, (x+31, 223), name[0], 14, COLORS["green"], True, "mm")
        text(d, (x+60, 223), f"Player {idx+1} · {name}", 15, COLORS["ink"] if active else COLORS["muted"], True, "lm")
    rr(d, (274, 278, 1190, 626), 18, COLORS["paper"], COLORS["line"])
    d.rectangle((302, 306, 1160, 315), fill="#e5eadc")
    d.rectangle((302, 306, 650 if t < .5 else 1000, 315), fill=COLORS["green"])
    active = "Alex" if t < .5 else "Gran"
    rr(d, (302, 342, 1160, 398), 9, "#eaf0e1")
    text(d, (326, 370), f"{active}, it’s your turn.", 21, COLORS["dark"], True, "lm")
    text(d, (302, 438), "Which part of a plant usually takes up water from the soil?", 24, COLORS["ink"], True)
    for i, answer in enumerate(["A   Flowers", "B   Roots", "C   Fruit"]):
        x = 302 + i * 278
        rr(d, (x, 500, x+250, 557), 10, "#ffffff", "#cbd3c3")
        text(d, (x+20, 529), answer, 17, COLORS["ink"], False, "lm")
    text(d, (302, 581), "Player 1’s answer stays hidden until Player 2 chooses.", 15, COLORS["muted"])
    cursor(d, 705 if t < .5 else 427, 528, abs((t*2 % 1)-.5))
    return im


def scene_reflect(t):
    im, d = base("How was it for each of you?", "Two voices. One shared moment.", section="My circle", points="30")
    rr(d, (270, 195, 1215, 623), 20, COLORS["paper"], COLORS["line"])
    text(d, (308, 228), "You made time for each other.", 25, COLORS["dark"], True)
    cards = [(308, 278, "Alex", "3 / 3 correct", 5, "I liked solving it together."),
             (762, 278, "Gran", "2 / 3 correct", 4, "The plant question made us talk.")]
    for x, y, name, score, rating, note in cards:
        rr(d, (x, y, x+410, y+270), 15, COLORS["sage"] if x < 500 else "#fdf7ef", COLORS["line"])
        text(d, (x+24, y+27), name, 23, COLORS["ink"], True)
        text(d, (x+24, y+66), score, 17, COLORS["green"], True)
        text(d, (x+24, y+112), "★" * rating + "☆" * (5-rating), 27, "#b98245")
        wrapped(d, (x+24, y+164), note, 355, 16, COLORS["muted"])
    rr(d, (882, 565, 1172, 608), 10, COLORS["green"])
    text(d, (1027, 587), "Save both reviews · +30", 15, COLORS["white"], True, "mm")
    cursor(d, 1150, 587, abs((t % 1)-.5))
    return im


def scene_journey(t):
    im, d = base("Your shared journey.", "Little moments add up", section="Discover", points="30")
    rr(d, (252, 205, 720, 585), 20, COLORS["peach"], COLORS["line"])
    text(d, (286, 241), "TODAY’S SHARED MOMENT", 12, COLORS["green"], True)
    text(d, (286, 282), "The soundtrack of our lives", 27, COLORS["ink"], True)
    wrapped(d, (286, 332), "Find the songs, sounds, and memories that connect you.", 385, 18, COLORS["muted"])
    rr(d, (286, 494, 500, 544), 11, COLORS["green"])
    text(d, (393, 519), "Share this moment", 16, COLORS["white"], True, "mm")
    rr(d, (744, 205, 1230, 585), 20, COLORS["paper"], COLORS["line"])
    text(d, (778, 241), "SHARED JOURNEY", 12, COLORS["green"], True)
    text(d, (778, 280), "Small moments, kept together", 25, COLORS["ink"], True)
    stats = [("Moments saved", "1"), ("Points available", "30"), ("Interests explored", "1")]
    for i, (label, value) in enumerate(stats):
        x = 778 + i * 142
        rr(d, (x, 344, x+126, 430), 12, COLORS["sage"])
        text(d, (x+63, 372), value, 28, COLORS["dark"], True, "mm")
        text(d, (x+63, 407), label, 11, COLORS["muted"], False, "mm")
    text(d, (778, 470), "Latest pair", 13, COLORS["muted"], True)
    rr(d, (778, 497, 855, 535), 8, COLORS["sage"]); text(d, (816, 516), "Alex", 14, COLORS["green"], True, "mm")
    text(d, (872, 516), "&", 15, COLORS["muted"], True, "mm")
    rr(d, (891, 497, 971, 535), 8, COLORS["peach"]); text(d, (931, 516), "Gran", 14, "#78573e", True, "mm")
    text(d, (252, 636), "Together now · Trusted circle · Community preview", 18, COLORS["green"], True)
    cursor(d, 499, 519, abs((t % 1)-.5))
    return im


SCENES = [scene_intro, scene_paths, scene_setup, scene_turns, scene_reflect, scene_journey]


def main():
    OUT.mkdir(exist_ok=True)
    temp = Path(tempfile.mkdtemp(prefix="kindred-demo-"))
    try:
        stills = [scene(.25) for scene in SCENES]
        stills[-1].save(OUT / "kindred-demo-poster.png")
        frames = []
        hold, fade = 27, 6
        for i, make_scene in enumerate(SCENES):
            current = [make_scene(frame / max(1, hold - 1)) for frame in range(hold)]
            frames.extend(current)
            if i + 1 < len(SCENES):
                nxt = SCENES[i + 1](0)
                frames.extend(Image.blend(current[-1], nxt, (step + 1) / (fade + 1)) for step in range(fade))
        for number, frame in enumerate(frames):
            frame.save(temp / f"frame-{number:04d}.png", optimize=True)
        output = OUT / "kindred-demo.mp4"
        cmd = [
            "ffmpeg", "-y", "-framerate", str(FPS), "-i", str(temp / "frame-%04d.png"),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-r", str(FPS), str(output),
        ]
        subprocess.run(cmd, check=True)
        print(f"Created {output} ({len(frames) / FPS:.1f}s, {W}x{H})")
    finally:
        shutil.rmtree(temp, ignore_errors=True)


if __name__ == "__main__":
    main()
