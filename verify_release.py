from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def fail(message: str) -> None:
    raise SystemExit(f"RELEASE CHECK FAILED: {message}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def text(path: Path) -> str:
    require(path.exists(), f"Missing file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-build", action="store_true")
    args = parser.parse_args()

    version = text(ROOT / "VERSION").strip()
    require(
        re.fullmatch(r"\d+\.\d+\.\d+", version) is not None,
        "VERSION must use semantic x.y.z format",
    )

    required = [
        "README.md",
        "LICENSE",
        "ASSETS.md",
        "CONTRIBUTING.md",
        "SECURITY.md",
        "CHANGELOG.md",
        "DEPLOYMENT.md",
        "render.yaml",
        "verify_production.py",
        "verify_production.cmd",
        ".github/workflows/ci.yml",
        ".github/workflows/release.yml",
        "templates/landing.html",
        "templates/index.html",
        "templates/offline.html",
        "static/sw.js",
        "static/manifest.webmanifest",
        "static/images/landing-mother-window.png",
        "static/images/landing-mother-phone.png",
        "static/images/app-preview.png",
    ]

    for relative in required:
        require((ROOT / relative).exists(), f"Missing release file: {relative}")

    readme = text(ROOT / "README.md")
    require(r"D:\Arya" not in readme, "README contains a private local path")
    require(
        "BumpMarks is a recording and visualization tool only." in readme,
        "README medical disclaimer missing",
    )

    for source in [ROOT / "README.md", ROOT / "setup.cmd", ROOT / "test.cmd"]:
        content = text(source)
        require(r"D:\Arya" not in content, f"Private path found in {source.name}")

    manifest = json.loads(text(ROOT / "static/manifest.webmanifest"))
    require(manifest.get("start_url") == "/app", "Manifest must start at /app")
    require(manifest.get("display") == "standalone", "Manifest must be standalone")

    service_worker = text(ROOT / "static/sw.js")
    require(
        'const CACHE_NAME = "bumpmarks-v14";' in service_worker,
        "Unexpected service-worker cache version",
    )
    require(
        'const APP_DOCUMENT = "/app/index.html";' in service_worker,
        "Service worker must precache the canonical app document",
    )
    require(
        'networkFirstNavigation(event, APP_DOCUMENT)' in service_worker,
        "App navigation must be network-first with offline fallback",
    )
    require(
        'networkFirstAsset(event.request)' in service_worker,
        "App code assets must refresh online and fall back offline",
    )
    require(
        'await self.skipWaiting()' in service_worker and
        'await self.clients.claim()' in service_worker,
        "Service worker must activate and claim clients immediately",
    )
    for asset in [
        "/static/images/landing-mother-window.png",
        "/static/images/landing-mother-phone.png",
        "/static/images/app-preview.png",
    ]:
        require(asset in service_worker, f"Service worker is missing {asset}")

    app_js = text(ROOT / "static/js/app.js")
    require(
        'const STORAGE_KEY = "bumpmarks.v1";' in app_js,
        "Local-storage compatibility key changed",
    )
    require("fetch(" not in app_js, "App JS unexpectedly performs network fetches")

    landing_html = text(ROOT / "templates/landing.html")
    require("No cloud requirement" in landing_html, "Landing privacy statement missing")
    require("No AI health analysis" in landing_html, "Landing AI safety statement missing")

    if not args.skip_build:
        subprocess.run([sys.executable, "build_static.py"], cwd=ROOT, check=True)

    required_dist = [
        "index.html",
        "app/index.html",
        "offline/index.html",
        "404.html",
        "sw.js",
        "healthz.json",
        "version.json",
        "robots.txt",
        "static/css/app.css",
        "static/css/landing.css",
        "static/js/app.js",
        "static/js/landing.js",
        "static/manifest.webmanifest",
    ]

    for relative in required_dist:
        require((DIST / relative).exists(), f"Static build missing {relative}")

    for html_path in DIST.rglob("*.html"):
        content = html_path.read_text(encoding="utf-8")
        require(
            "{{" not in content and "{%" not in content,
            f"Unresolved template syntax in {html_path}",
        )

    health = json.loads(text(DIST / "healthz.json"))
    require(health.get("status") == "ok", "healthz status is not ok")
    require(health.get("version") == version, "healthz version mismatch")

    node = shutil.which("node")
    if node:
        for js_file in [ROOT / "static/js/app.js", ROOT / "static/js/landing.js"]:
            subprocess.run([node, "--check", str(js_file)], check=True)

    print(f"BumpMarks {version} release verification passed.")


if __name__ == "__main__":
    main()
