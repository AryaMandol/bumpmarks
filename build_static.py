from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DIST = ROOT / "dist"
VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()

STATIC_URL_RE = re.compile(
    r"{{\s*url_for\('static',\s*filename='([^']+)'\)\s*}}"
)


def render_template_file(source: Path) -> str:
    text = source.read_text(encoding="utf-8")
    text = STATIC_URL_RE.sub(lambda match: f"/static/{match.group(1)}", text)

    if "{{" in text or "{%" in text:
        raise RuntimeError(f"Unresolved template syntax in {source.name}")

    return text


def write_html(relative_path: str, template_name: str) -> None:
    destination = DIST / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        render_template_file(TEMPLATES / template_name),
        encoding="utf-8",
    )


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)

    DIST.mkdir(parents=True)

    write_html("index.html", "landing.html")
    write_html("app/index.html", "index.html")
    write_html("offline/index.html", "offline.html")
    write_html("404.html", "404.html")

    shutil.copytree(STATIC, DIST / "static")
    shutil.copy2(STATIC / "sw.js", DIST / "sw.js")

    (DIST / "healthz.json").write_text(
        json.dumps(
            {
                "status": "ok",
                "app": "BumpMarks",
                "version": VERSION,
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    (DIST / "version.json").write_text(
        json.dumps(
            {
                "app": "BumpMarks",
                "version": VERSION,
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    (DIST / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n",
        encoding="utf-8",
    )

    print(f"Built BumpMarks {VERSION} into {DIST}")


if __name__ == "__main__":
    main()
