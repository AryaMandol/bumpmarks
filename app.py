from flask import Flask, render_template, send_from_directory

app = Flask(__name__)


@app.after_request
def add_security_headers(response):
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "manifest-src 'self'; "
        "worker-src 'self'; "
        "object-src 'none'; "
        "base-uri 'none'; "
        "frame-ancestors 'none'; "
        "form-action 'self'"
    )
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    )
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    return response


@app.route("/")
def landing():
    return render_template("landing.html")


@app.route("/app")
@app.route("/app/")
def index():
    return render_template("index.html")


@app.route("/offline")
def offline():
    return render_template("offline.html")


@app.route("/sw.js")
def service_worker():
    response = send_from_directory(
        "static",
        "sw.js",
        mimetype="application/javascript",
    )
    response.headers["Cache-Control"] = "no-cache"
    return response


if __name__ == "__main__":
    app.run(debug=True)
