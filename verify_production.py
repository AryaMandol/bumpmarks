from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()


def fail(message: str) -> None:
    raise SystemExit(f"PRODUCTION CHECK FAILED: {message}")


def fetch(base_url: str, path: str):
    url = urllib.parse.urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
    request = urllib.request.Request(
        url,
        headers={"User-Agent": f"BumpMarks/{VERSION} production verifier"},
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return url, response.status, response.headers, response.read()
    except urllib.error.HTTPError as exc:
        fail(f"{url} returned HTTP {exc.code}")
    except urllib.error.URLError as exc:
        fail(f"Could not reach {url}: {exc.reason}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("base_url", help="Live BumpMarks base URL, including https://")
    parser.add_argument(
        "--expected-revision",
        help="Expected full Git commit SHA for the live deployment",
    )
    args = parser.parse_args()

    base_url = args.base_url.strip()
    parsed = urllib.parse.urlparse(base_url)

    if parsed.scheme != "https":
        fail("Production URL must use HTTPS")

    root_url, status, headers, body = fetch(base_url, "/")
    if status != 200 or b"Baby movement tracking, kept simple." not in body:
        fail("Landing page verification failed")

    required_headers = {
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
    }

    for name, expected in required_headers.items():
        actual = headers.get(name, "")
        if expected.lower() not in actual.lower():
            fail(f"Missing or unexpected {name} header: {actual!r}")

    _, status, _, app_body = fetch(base_url, "/app")
    if status != 200 or b'id="movement-button"' not in app_body:
        fail("Tracker page verification failed")

    _, status, _, physical_app_body = fetch(base_url, "/app/index.html")
    if status != 200 or b'id="movement-button"' not in physical_app_body:
        fail("Canonical /app/index.html is not directly available")

    for path, marker in [
        ("/privacy", b"Privacy Policy"),
        ("/terms", b"Terms of Use"),
        ("/refund-policy", b"Refund and Cancellation Policy"),
        ("/contact", b"Contact BumpMarks"),
    ]:
        _, status, _, policy_body = fetch(base_url, path)
        if status != 200 or marker not in policy_body:
            fail(f"Policy page verification failed: {path}")

    _, status, _, offline_body = fetch(base_url, "/offline/index.html")
    if status != 200 or b"BumpMarks is offline" not in offline_body:
        fail("Canonical offline document is not directly available")

    _, status, _, build_info_body = fetch(base_url, "/build-info.json")
    if status != 200:
        fail("Build-info endpoint did not return 200")

    try:
        build_info = json.loads(build_info_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"Build-info endpoint returned invalid JSON: {exc}")

    live_revision = str(build_info.get("revision", "")).strip()
    if not live_revision:
        fail("Build-info endpoint does not contain a revision")

    if args.expected_revision:
        expected_revision = args.expected_revision.strip()
        if live_revision != expected_revision:
            fail(
                "Render is serving a different commit. "
                f"Expected {expected_revision}, live is {live_revision}"
            )

    _, status, _, health_body = fetch(base_url, "/healthz")
    if status != 200:
        fail("Health endpoint did not return 200")

    try:
        health = json.loads(health_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"Health endpoint returned invalid JSON: {exc}")

    if health.get("status") != "ok" or health.get("version") != VERSION:
        fail(f"Unexpected health response: {health}")

    _, status, sw_headers, sw_body = fetch(base_url, "/sw.js")
    if status != 200 or b'bumpmarks-v15' not in sw_body:
        fail("Service worker verification failed or old worker is still deployed")
    if b'/app/index.html' not in sw_body or b'self.skipWaiting' not in sw_body or b'networkFirstNavigation' not in sw_body:
        fail("Production service worker is missing the offline app-shell fix")

    cache_control = sw_headers.get("Cache-Control", "")
    if "no-cache" not in cache_control.lower() and "no-store" not in cache_control.lower():
        fail(f"Service worker cache header is too strong: {cache_control!r}")

    worker_scope = sw_headers.get("Service-Worker-Allowed", "")
    if worker_scope.strip() != "/":
        fail(f"Unexpected service-worker scope header: {worker_scope!r}")

    _, status, _, preview_body = fetch(base_url, "/static/images/app-preview.png")
    if status != 200 or len(preview_body) < 10000:
        fail("App preview image is missing or unexpectedly small")

    _, status, _, manifest_body = fetch(base_url, "/static/manifest.webmanifest")
    if status != 200:
        fail("Manifest verification failed")

    manifest = json.loads(manifest_body.decode("utf-8"))
    if manifest.get("start_url") != "/app":
        fail("Production manifest does not start at /app")

    print(
        f"BumpMarks {VERSION} production verification passed: {root_url}\n"
        f"Live revision: {live_revision}"
    )


if __name__ == "__main__":
    main()
