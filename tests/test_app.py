from app import app


def test_home_page_loads():
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200
    assert b"BumpMarks" in response.data


def test_service_worker_loads():
    client = app.test_client()

    response = client.get("/sw.js")

    assert response.status_code == 200
    assert response.mimetype == "application/javascript"


def test_manifest_loads():
    client = app.test_client()

    response = client.get("/static/manifest.webmanifest")

    assert response.status_code == 200
