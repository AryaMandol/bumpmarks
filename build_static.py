from pathlib import Path
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DIST = ROOT / "dist"
VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()

STATIC_URL_RE = re.compile(
    r"{{\s*url_for\('static',\s*filename='([^']+)'\)\s*}}"
)
ASSET_REV_RE = re.compile(r"\?v=[A-Za-z0-9._-]+")


def get_build_revision() -> str:
    for name in ("RENDER_GIT_COMMIT", "GITHUB_SHA"):
        value = os.environ.get(name, "").strip()
        if value:
            return value

    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        value = result.stdout.strip()
        if value:
            return value
    except (OSError, subprocess.CalledProcessError):
        pass

    return f"v{VERSION}"


BUILD_REVISION = get_build_revision()


def render_template_file(source: Path) -> str:
    text = source.read_text(encoding="utf-8")
    text = STATIC_URL_RE.sub(lambda match: f"/static/{match.group(1)}", text)
    text = ASSET_REV_RE.sub(f"?v={BUILD_REVISION}", text)

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


def write_service_worker() -> None:
    source = (STATIC / "sw.js").read_text(encoding="utf-8")
    source = re.sub(
        r'const ASSET_REV = "[^"]+";',
        f'const ASSET_REV = "{BUILD_REVISION}";',
        source,
        count=1,
    )
    (DIST / "sw.js").write_text(source, encoding="utf-8")


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)

    DIST.mkdir(parents=True)

    write_html("index.html", "landing.html")
    write_html("app/index.html", "index.html")
    write_html("privacy/index.html", "privacy.html")
    write_html("terms/index.html", "terms.html")
    write_html("refund-policy/index.html", "refund-policy.html")
    write_html("contact/index.html", "contact.html")
    write_html("offline/index.html", "offline.html")
    write_html("404.html", "404.html")

    shutil.copytree(STATIC, DIST / "static")
    write_service_worker()

    release_info = {
        "app": "BumpMarks",
        "version": VERSION,
        "revision": BUILD_REVISION,
    }

    (DIST / "healthz.json").write_text(
        json.dumps(
            {
                "status": "ok",
                **release_info,
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    (DIST / "version.json").write_text(
        json.dumps(release_info, indent=2) + "\n",
        encoding="utf-8",
    )

    (DIST / "build-info.json").write_text(
        json.dumps(release_info, indent=2) + "\n",
        encoding="utf-8",
    )

    (DIST / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n",
        encoding="utf-8",
    )

    print(
        f"Built BumpMarks {VERSION} into {DIST} "
        f"(revision {BUILD_REVISION})"
    )


if __name__ == "__main__":
    main()
