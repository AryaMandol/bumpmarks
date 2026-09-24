from pathlib import Path

from app import app


ROOT = Path(__file__).resolve().parents[1]


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


def test_catchup_modal_is_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="catchup-modal"' in response.data
    assert b'id="catchup-count"' in response.data
    assert b'name="catchup-time"' in response.data
    assert b'id="catchup-save"' in response.data


def test_delete_confirmation_is_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="delete-modal"' in response.data
    assert b'id="delete-confirm"' in response.data


def test_history_view_and_navigation_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="history-view"' in response.data
    assert b'id="history-list"' in response.data
    assert b'id="nav-today"' in response.data
    assert b'id="nav-history"' in response.data


def test_daily_notes_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="today-note"' in response.data
    assert b'id="detail-note"' in response.data
    assert b'maxlength="500"' in response.data


def test_day_detail_modal_is_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="day-detail-modal"' in response.data
    assert b'id="day-detail-summary"' in response.data
    assert b'id="day-detail-entries"' in response.data


def test_frontend_no_longer_uses_prompt_for_catchup():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "window.prompt" not in javascript
    assert "approximateTime" in javascript
    assert "openCatchupModal" in javascript
    assert "confirmDeleteEntry" in javascript


def test_existing_storage_key_is_preserved():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert 'const STORAGE_KEY = "bumpmarks.v1";' in javascript


def test_history_and_notes_logic_exists():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "renderHistory" in javascript
    assert "openDayDetail" in javascript
    assert "scheduleTodayNoteSave" in javascript
    assert "scheduleDetailNoteSave" in javascript
    assert 'note: ""' in javascript
