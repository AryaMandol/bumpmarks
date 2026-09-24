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


def test_settings_view_and_controls_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="settings-view"' in response.data
    assert b'id="nav-settings"' in response.data
    assert b'id="setting-start-time"' in response.data
    assert b'id="setting-end-time"' in response.data
    assert b'id="setting-daily-target"' in response.data
    assert b'id="setting-haptics"' in response.data
    assert b'id="setting-doctor-instructions"' in response.data
    assert b'id="save-settings"' in response.data


def test_target_and_doctor_instruction_ui_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="target-progress"' in response.data
    assert b'id="target-progress-bar"' in response.data
    assert b'id="doctor-instructions-card"' in response.data
    assert b'id="doctor-instructions-display"' in response.data


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


def test_settings_defaults_and_normalization_exist():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "DEFAULT_SETTINGS" in javascript
    assert 'trackingStart: "12:00"' in javascript
    assert 'trackingEnd: "00:00"' in javascript
    assert "dailyTarget: null" in javascript
    assert "hapticsEnabled: true" in javascript
    assert "normalizeSettings" in javascript


def test_tracking_window_uses_settings():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "isTrackingWindowOpen" in javascript
    assert "timeStringToMinutes" in javascript
    assert "getTrackingWindowLabel" in javascript
    assert "settings.trackingStart" in javascript
    assert "settings.trackingEnd" in javascript


def test_settings_save_and_validation_logic_exists():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "validateSettingsForm" in javascript
    assert "saveSettings" in javascript
    assert "renderSettingsForm" in javascript
    assert "doctorInstructions" in javascript
    assert "dailyTarget" in javascript


def test_export_view_and_navigation_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="export-view"' in response.data
    assert b'id="nav-export"' in response.data
    assert b'id="export-start-date"' in response.data
    assert b'id="export-end-date"' in response.data
    assert b'id="export-csv"' in response.data


def test_backup_restore_and_delete_controls_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="download-backup"' in response.data
    assert b'id="restore-file"' in response.data
    assert b'id="choose-restore-file"' in response.data
    assert b'id="delete-all-data"' in response.data


def test_restore_and_delete_confirmation_modals_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="restore-confirm-modal"' in response.data
    assert b'id="restore-confirm"' in response.data
    assert b'id="delete-all-modal"' in response.data
    assert b'id="delete-all-confirm"' in response.data


def test_export_and_backup_logic_exists():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "exportCsv" in javascript
    assert "createBackupPayload" in javascript
    assert "downloadBackup" in javascript
    assert "downloadTextFile" in javascript
    assert "sanitizeCsvFormula" in javascript


def test_restore_validation_and_apply_logic_exists():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "validateBackupPayload" in javascript
    assert "handleRestoreFile" in javascript
    assert "applyRestore" in javascript
    assert 'payload.app !== "BumpMarks"' in javascript
    assert "formatVersion !== 1" in javascript


def test_delete_all_data_logic_exists():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "deleteAllLocalData" in javascript
    assert "localStorage.removeItem(STORAGE_KEY)" in javascript
    assert "createEmptyState()" in javascript


def test_offline_route_loads():
    client = app.test_client()

    response = client.get("/offline")

    assert response.status_code == 200
    assert b"BumpMarks is offline" in response.data


def test_manifest_has_hardened_pwa_metadata():
    manifest = (ROOT / "static" / "manifest.webmanifest").read_text(encoding="utf-8")

    assert '"id": "/"' in manifest
    assert '"scope": "/"' in manifest
    assert '"display": "standalone"' in manifest
    assert '"orientation": "portrait"' in manifest
    assert '"purpose": "maskable"' in manifest


def test_install_ui_is_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="install-app"' in response.data
    assert b'id="install-ready"' in response.data
    assert b'id="install-ios-help"' in response.data
    assert b'id="install-installed"' in response.data


def test_update_banner_is_present():
    client = app.test_client()

    response = client.get("/")

    assert b'id="update-banner"' in response.data
    assert b'id="apply-update"' in response.data


def test_service_worker_has_offline_and_update_handling():
    service_worker = (ROOT / "static" / "sw.js").read_text(encoding="utf-8")

    assert 'const CACHE_NAME = "bumpmarks-v7";' in service_worker
    assert '"/offline"' in service_worker
    assert 'event.request.mode === "navigate"' in service_worker
    assert '"SKIP_WAITING"' in service_worker


def test_frontend_has_install_and_update_logic():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "beforeinstallprompt" in javascript
    assert "appinstalled" in javascript
    assert "registerServiceWorker" in javascript
    assert "applyPendingUpdate" in javascript
    assert "controllerchange" in javascript


def test_security_and_privacy_headers_are_set():
    client = app.test_client()

    response = client.get("/")

    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "camera=()" in response.headers["Permissions-Policy"]
    assert "microphone=()" in response.headers["Permissions-Policy"]
    assert "geolocation=()" in response.headers["Permissions-Policy"]
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]
    assert "object-src 'none'" in response.headers["Content-Security-Policy"]


def test_service_worker_response_is_not_strongly_cached():
    client = app.test_client()

    response = client.get("/sw.js")

    assert response.headers["Cache-Control"] == "no-cache"


def test_accessibility_landmarks_and_status_ui_are_present():
    client = app.test_client()

    response = client.get("/")

    assert b'class="skip-link"' in response.data
    assert b'id="main-content"' in response.data
    assert b'id="storage-warning"' in response.data
    assert b'aria-current="page"' in response.data
    assert b'aria-atomic="true"' in response.data


def test_modal_dialogs_have_programmatic_focus_targets():
    client = app.test_client()

    response = client.get("/")

    assert b'class="modal-sheet" tabindex="-1" role="dialog"' in response.data
    assert b'class="modal-sheet compact-sheet" tabindex="-1" role="dialog"' in response.data
    assert b'class="modal-sheet day-detail-sheet" tabindex="-1" role="dialog"' in response.data


def test_accessibility_css_has_focus_and_reduced_motion_support():
    stylesheet = (ROOT / "static" / "css" / "app.css").read_text(encoding="utf-8")

    assert ":focus-visible" in stylesheet
    assert "prefers-reduced-motion: reduce" in stylesheet
    assert ".skip-link" in stylesheet
    assert ".storage-warning" in stylesheet


def test_frontend_handles_storage_failures_and_corrupt_data():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "storageWritesBlocked" in javascript
    assert "storageAccessAvailable" in javascript
    assert "setStorageWarning" in javascript
    assert "normalizeStoredEntry" in javascript
    assert "Saved BumpMarks data appears unreadable" in javascript


def test_frontend_has_modal_focus_trap_and_background_inert():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "trapModalFocus" in javascript
    assert "getFocusableElements" in javascript
    assert "mainContent.inert = anyOpen" in javascript
    assert "bottomNav.inert = anyOpen" in javascript
    assert 'event.key === "Tab"' in javascript


def test_frontend_refreshes_time_sensitive_state_after_resume():
    javascript = (ROOT / "static" / "js" / "app.js").read_text(encoding="utf-8")

    assert "refreshTimeSensitiveUi" in javascript
    assert 'window.addEventListener("focus", refreshTimeSensitiveUi)' in javascript
    assert 'document.addEventListener("visibilitychange"' in javascript
    assert "window.setInterval(refreshTimeSensitiveUi, 60_000)" in javascript
