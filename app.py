from flask import Flask, render_template, send_from_directory

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/offline")
def offline():
    return render_template("offline.html")


@app.route("/sw.js")
def service_worker():
    return send_from_directory(
        "static",
        "sw.js",
        mimetype="application/javascript",
    )


if __name__ == "__main__":
    app.run(debug=True)
