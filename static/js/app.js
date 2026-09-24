const STORAGE_KEY = "bumpmarks.v1";

const DEFAULT_SETTINGS = {
    trackingStart: "12:00",
    trackingEnd: "00:00",
    dailyTarget: null,
    hapticsEnabled: true,
    doctorInstructions: ""
};

const APPROXIMATE_TIME_LABELS = {
    just_now: "Just now",
    within_30: "Within 30 min",
    within_60: "Within 1 hr",
    earlier_today: "Earlier today",
    unknown: "Don't remember"
};

const movementCountElement = document.getElementById("movement-count");
const movementButton = document.getElementById("movement-button");
const undoButton = document.getElementById("undo-button");
const tallyElement = document.getElementById("tally");
const todayDateElement = document.getElementById("today-date");
const trackingStatusElement = document.getElementById("tracking-status");
const recentListElement = document.getElementById("recent-list");
const emptyStateElement = document.getElementById("empty-state");
const entryCountLabelElement = document.getElementById("entry-count-label");
const customCatchupButton = document.getElementById("custom-catchup-button");
const toastElement = document.getElementById("toast");
const storageWarningElement = document.getElementById("storage-warning");
const mainContent = document.getElementById("main-content");
const bottomNav = document.querySelector(".bottom-nav");

const updateBanner = document.getElementById("update-banner");
const applyUpdateButton = document.getElementById("apply-update");

const installReady = document.getElementById("install-ready");
const installInstalled = document.getElementById("install-installed");
const installIosHelp = document.getElementById("install-ios-help");
const installBrowserHelp = document.getElementById("install-browser-help");
const installAppButton = document.getElementById("install-app");


const targetProgress = document.getElementById("target-progress");
const targetProgressText = document.getElementById("target-progress-text");
const targetProgressBar = document.getElementById("target-progress-bar");
const targetProgressMessage = document.getElementById("target-progress-message");

const doctorInstructionsCard = document.getElementById("doctor-instructions-card");
const doctorInstructionsDisplay = document.getElementById("doctor-instructions-display");

const todayView = document.getElementById("today-view");
const historyView = document.getElementById("history-view");
const settingsView = document.getElementById("settings-view");
const navTodayButton = document.getElementById("nav-today");
const navHistoryButton = document.getElementById("nav-history");
const navExportButton = document.getElementById("nav-export");
const navSettingsButton = document.getElementById("nav-settings");

const exportView = document.getElementById("export-view");
const exportStartDate = document.getElementById("export-start-date");
const exportEndDate = document.getElementById("export-end-date");
const exportCsvButton = document.getElementById("export-csv");
const exportError = document.getElementById("export-error");
const downloadBackupButton = document.getElementById("download-backup");
const restoreFileInput = document.getElementById("restore-file");
const chooseRestoreFileButton = document.getElementById("choose-restore-file");
const restoreFileName = document.getElementById("restore-file-name");
const deleteAllDataButton = document.getElementById("delete-all-data");

const restoreConfirmModal = document.getElementById("restore-confirm-modal");
const restoreCancelButton = document.getElementById("restore-cancel");
const restoreConfirmButton = document.getElementById("restore-confirm");

const deleteAllModal = document.getElementById("delete-all-modal");
const deleteAllCancelButton = document.getElementById("delete-all-cancel");
const deleteAllConfirmButton = document.getElementById("delete-all-confirm");

const todayNoteInput = document.getElementById("today-note");
const todayNoteStatus = document.getElementById("today-note-status");

const historyListElement = document.getElementById("history-list");
const historyEmptyElement = document.getElementById("history-empty");

const settingStartTime = document.getElementById("setting-start-time");
const settingEndTime = document.getElementById("setting-end-time");
const settingDailyTarget = document.getElementById("setting-daily-target");
const settingHaptics = document.getElementById("setting-haptics");
const settingDoctorInstructions = document.getElementById("setting-doctor-instructions");
const saveSettingsButton = document.getElementById("save-settings");
const settingsError = document.getElementById("settings-error");

const catchupModal = document.getElementById("catchup-modal");
const catchupCloseButton = document.getElementById("catchup-close");
const catchupCountInput = document.getElementById("catchup-count");
const catchupMinusButton = document.getElementById("catchup-minus");
const catchupPlusButton = document.getElementById("catchup-plus");
const catchupSaveButton = document.getElementById("catchup-save");

const deleteModal = document.getElementById("delete-modal");
const deleteCancelButton = document.getElementById("delete-cancel");
const deleteConfirmButton = document.getElementById("delete-confirm");

const dayDetailModal = document.getElementById("day-detail-modal");
const dayDetailCloseButton = document.getElementById("day-detail-close");
const dayDetailTitle = document.getElementById("day-detail-title");
const dayDetailSummary = document.getElementById("day-detail-summary");
const dayDetailEntries = document.getElementById("day-detail-entries");
const detailNoteInput = document.getElementById("detail-note");
const detailNoteStatus = document.getElementById("detail-note-status");

let editingEntryId = null;
let pendingDeleteEntryId = null;
let selectedHistoryDateKey = null;
let todayNoteTimer = null;
let detailNoteTimer = null;
let pendingRestoreState = null;
let deferredInstallPrompt = null;
let waitingServiceWorker = null;
let storageAccessAvailable = true;
let storageWritesBlocked = false;
let storageWarningMessage = "";
let lastModalTrigger = null;
let lastRenderedDateKey = null;



function isStandaloneMode() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}


function isIosDevice() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}


function renderInstallState() {
    const installed = isStandaloneMode();

    installInstalled.hidden = !installed;

    if (installed) {
        installReady.hidden = true;
        installIosHelp.hidden = true;
        installBrowserHelp.hidden = true;
        return;
    }

    installReady.hidden = deferredInstallPrompt === null;
    installIosHelp.hidden = !(isIosDevice() && deferredInstallPrompt === null);
    installBrowserHelp.hidden = isIosDevice() || deferredInstallPrompt !== null;
}


async function installApp() {
    if (!deferredInstallPrompt) {
        renderInstallState();
        return;
    }

    deferredInstallPrompt.prompt();

    try {
        await deferredInstallPrompt.userChoice;
    } finally {
        deferredInstallPrompt = null;
        renderInstallState();
    }
}


function showUpdateAvailable(worker) {
    waitingServiceWorker = worker;
    updateBanner.hidden = false;
}


function hideUpdateAvailable() {
    waitingServiceWorker = null;
    updateBanner.hidden = true;
}


function applyPendingUpdate() {
    if (!waitingServiceWorker) {
        return;
    }

    waitingServiceWorker.postMessage({
        type: "SKIP_WAITING"
    });
}


function registerPwaHandlers() {
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        renderInstallState();
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        renderInstallState();
        showToast("BumpMarks installed");
    });

    window
        .matchMedia("(display-mode: standalone)")
        .addEventListener?.("change", renderInstallState);

    renderInstallState();
}


function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    let refreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) {
            return;
        }

        refreshing = true;
        window.location.reload();
    });

    navigator.serviceWorker
        .register("/sw.js")
        .then(registration => {
            if (registration.waiting) {
                showUpdateAvailable(registration.waiting);
            }

            registration.addEventListener("updatefound", () => {
                const worker = registration.installing;

                if (!worker) {
                    return;
                }

                worker.addEventListener("statechange", () => {
                    if (
                        worker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        showUpdateAvailable(worker);
                    }
                });
            });

            registration.update().catch(() => {});
        })
        .catch(error => {
            console.error("Service worker registration failed.", error);
        });
}


function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function dateFromKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}


function createEntryId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}


function normalizeSettings(settings) {
    const input = settings && typeof settings === "object"
        ? settings
        : {};

    const dailyTarget = Number(input.dailyTarget);

    return {
        trackingStart: isValidTimeString(input.trackingStart)
            ? input.trackingStart
            : DEFAULT_SETTINGS.trackingStart,

        trackingEnd: isValidTimeString(input.trackingEnd)
            ? input.trackingEnd
            : DEFAULT_SETTINGS.trackingEnd,

        dailyTarget:
            Number.isInteger(dailyTarget) &&
            dailyTarget >= 1 &&
            dailyTarget <= 100
                ? dailyTarget
                : null,

        hapticsEnabled:
            typeof input.hapticsEnabled === "boolean"
                ? input.hapticsEnabled
                : DEFAULT_SETTINGS.hapticsEnabled,

        doctorInstructions:
            typeof input.doctorInstructions === "string"
                ? input.doctorInstructions.slice(0, 1000)
                : DEFAULT_SETTINGS.doctorInstructions
    };
}


function createEmptyState() {
    return {
        version: 1,
        settings: { ...DEFAULT_SETTINGS },
        days: {}
    };
}


function normalizeStoredEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== "object") {
        return null;
    }

    const count = Number(rawEntry.count);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
        return null;
    }

    if (
        typeof rawEntry.recordedAt !== "string" ||
        Number.isNaN(new Date(rawEntry.recordedAt).getTime())
    ) {
        return null;
    }

    const type = rawEntry.type === "catchup"
        ? "catchup"
        : "live";

    const entry = {
        id:
            typeof rawEntry.id === "string" && rawEntry.id
                ? rawEntry.id.slice(0, 128)
                : createEntryId(),
        type,
        count,
        recordedAt: rawEntry.recordedAt
    };

    if (type === "catchup") {
        entry.approximateTime = APPROXIMATE_TIME_LABELS[rawEntry.approximateTime]
            ? rawEntry.approximateTime
            : "unknown";
    }

    if (
        typeof rawEntry.editedAt === "string" &&
        !Number.isNaN(new Date(rawEntry.editedAt).getTime())
    ) {
        entry.editedAt = rawEntry.editedAt;
    }

    return entry;
}


function normalizeDayData(day) {
    if (!day || typeof day !== "object" || Array.isArray(day)) {
        return {
            entries: [],
            note: ""
        };
    }

    const rawEntries = Array.isArray(day.entries)
        ? day.entries
        : [];

    day.entries = rawEntries
        .map(normalizeStoredEntry)
        .filter(Boolean);

    day.note = typeof day.note === "string"
        ? day.note.slice(0, 500)
        : "";

    return day;
}


function setStorageWarning(message) {
    storageWarningMessage = message || "";

    if (!storageWarningElement) {
        return;
    }

    storageWarningElement.textContent = storageWarningMessage;
    storageWarningElement.hidden = !storageWarningMessage;
}


function loadState() {
    let stored;

    try {
        stored = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error("Local storage is unavailable.", error);
        storageAccessAvailable = false;
        storageWritesBlocked = true;
        storageWarningMessage =
            "Local storage is unavailable in this browser. Changes can work during this session but may not persist after the app closes.";
        return createEmptyState();
    }

    if (!stored) {
        return createEmptyState();
    }

    try {
        const parsed = JSON.parse(stored);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            !parsed.days ||
            typeof parsed.days !== "object" ||
            Array.isArray(parsed.days)
        ) {
            storageWritesBlocked = true;
            storageWarningMessage =
                "Saved BumpMarks data could not be validated. It has not been overwritten. Restore a known-good backup or delete local data to start fresh.";
            return createEmptyState();
        }

        const safeDays = {};

        Object.keys(parsed.days).forEach(dateKey => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                return;
            }

            safeDays[dateKey] = normalizeDayData(parsed.days[dateKey]);
        });

        return {
            version: 1,
            settings: normalizeSettings(parsed.settings),
            days: safeDays
        };
    } catch (error) {
        console.error("Could not parse BumpMarks data.", error);
        storageWritesBlocked = true;
        storageWarningMessage =
            "Saved BumpMarks data appears unreadable. It has not been overwritten. Restore a known-good backup or delete local data to start fresh.";
        return createEmptyState();
    }
}


function saveState() {
    if (!storageAccessAvailable || storageWritesBlocked) {
        setStorageWarning(
            storageWarningMessage ||
            "BumpMarks cannot safely write to local storage right now. Changes may only last for this session."
        );
        return false;
    }

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

        setStorageWarning("");
        return true;
    } catch (error) {
        console.error("Could not save BumpMarks data.", error);
        storageAccessAvailable = false;
        setStorageWarning(
            "BumpMarks could not save to local storage. Changes may only last for this session. Check browser storage/private-mode restrictions."
        );
        return false;
    }
}


function getSettings() {
    state.settings = normalizeSettings(state.settings);
    return state.settings;
}


function getDayData(dateKey, createIfMissing = false) {
    if (!state.days[dateKey] && createIfMissing) {
        state.days[dateKey] = {
            entries: [],
            note: ""
        };
    }

    if (!state.days[dateKey]) {
        return null;
    }

    return normalizeDayData(state.days[dateKey]);
}


function getTodayData() {
    return getDayData(getLocalDateKey(), true);
}


function getDayTotal(day) {
    return day.entries.reduce(
        (total, entry) => total + Number(entry.count || 0),
        0
    );
}


function getTodayTotal() {
    return getDayTotal(getTodayData());
}


function isValidTimeString(value) {
    return typeof value === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}


function timeStringToMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return (hours * 60) + minutes;
}


function isTrackingWindowOpen(now = new Date()) {
    const settings = getSettings();
    const start = timeStringToMinutes(settings.trackingStart);
    const end = timeStringToMinutes(settings.trackingEnd);
    const current = (now.getHours() * 60) + now.getMinutes();

    if (start === end) {
        return false;
    }

    if (start < end) {
        return current >= start && current < end;
    }

    return current >= start || current < end;
}


function formatTimeSetting(value) {
    const [hours, minutes] = value.split(":").map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);

    return new Intl.DateTimeFormat(
        undefined,
        {
            hour: "numeric",
            minute: minutes === 0 ? undefined : "2-digit"
        }
    ).format(date);
}


function getTrackingWindowLabel() {
    const settings = getSettings();

    return `${formatTimeSetting(settings.trackingStart)} - ${formatTimeSetting(settings.trackingEnd)}`;
}


function vibrate() {
    if (!getSettings().hapticsEnabled) {
        return;
    }

    if ("vibrate" in navigator) {
        navigator.vibrate(30);
    }
}


function formatTime(isoDate) {
    const date = new Date(isoDate);

    return new Intl.DateTimeFormat(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);
}


function formatHistoryDate(dateKey) {
    return new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(dateFromKey(dateKey));
}


function formatHistoryCardDate(dateKey) {
    const date = dateFromKey(dateKey);
    const todayKey = getLocalDateKey();

    if (dateKey === todayKey) {
        return "Today";
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "short",
            day: "numeric",
            month: "short"
        }
    ).format(date);
}


function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("visible");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
        toastElement.classList.remove("visible");
    }, 1800);
}



function getOpenModal() {
    return [
        restoreConfirmModal,
        deleteAllModal,
        deleteModal,
        catchupModal,
        dayDetailModal
    ].find(modal => modal && !modal.hidden) || null;
}


function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
    ).filter(element => !element.hidden);
}


function showModal(modal, focusTarget = null) {
    lastModalTrigger = document.activeElement;
    modal.hidden = false;
    syncBodyModalState();

    window.setTimeout(() => {
        const target =
            focusTarget ||
            getFocusableElements(modal)[0] ||
            modal.querySelector('[role="dialog"]');

        target?.focus();
    }, 0);
}


function hideModal(modal) {
    modal.hidden = true;
    syncBodyModalState();

    const trigger = lastModalTrigger;
    lastModalTrigger = null;

    if (!getOpenModal() && trigger instanceof HTMLElement) {
        window.setTimeout(() => {
            trigger.focus();
        }, 0);
    }
}


function trapModalFocus(event, modal) {
    if (event.key !== "Tab") {
        return;
    }

    const focusable = getFocusableElements(modal);

    if (focusable.length === 0) {
        event.preventDefault();
        modal.querySelector('[role="dialog"]')?.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}


function syncBodyModalState() {
    const anyOpen =
        !catchupModal.hidden ||
        !deleteModal.hidden ||
        !dayDetailModal.hidden ||
        !restoreConfirmModal.hidden ||
        !deleteAllModal.hidden;

    document.body.classList.toggle("modal-open", anyOpen);

    if (mainContent) {
        mainContent.inert = anyOpen;
    }

    if (bottomNav) {
        bottomNav.inert = anyOpen;
    }
}


function setActiveView(viewName) {
    const showHistory = viewName === "history";
    const showExport = viewName === "export";
    const showSettings = viewName === "settings";
    const showToday = !showHistory && !showExport && !showSettings;

    todayView.hidden = !showToday;
    historyView.hidden = !showHistory;
    exportView.hidden = !showExport;
    settingsView.hidden = !showSettings;

    navTodayButton.classList.toggle("active", showToday);
    navHistoryButton.classList.toggle("active", showHistory);
    navExportButton.classList.toggle("active", showExport);
    navSettingsButton.classList.toggle("active", showSettings);

    [
        [navTodayButton, showToday],
        [navHistoryButton, showHistory],
        [navExportButton, showExport],
        [navSettingsButton, showSettings]
    ].forEach(([button, active]) => {
        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (showHistory) {
        renderHistory();
    }

    if (showExport) {
        renderExportForm();
    }

    if (showSettings) {
        renderSettingsForm();
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


function closeCatchupModal() {
    hideModal(catchupModal);
    editingEntryId = null;
}


function getSelectedApproximateTime() {
    const selected = document.querySelector(
        'input[name="catchup-time"]:checked'
    );

    return selected ? selected.value : "unknown";
}


function setSelectedApproximateTime(value) {
    const validValue = APPROXIMATE_TIME_LABELS[value]
        ? value
        : "unknown";

    const target = document.querySelector(
        `input[name="catchup-time"][value="${validValue}"]`
    );

    if (target) {
        target.checked = true;
    }
}


function normalizeCatchupCount(value) {
    const count = Number(value);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
        return null;
    }

    return count;
}


function openCatchupModal(count = 1, entryId = null) {
    editingEntryId = entryId;

    const modalTitle = document.getElementById("catchup-title");

    if (entryId) {
        const entry = getTodayData().entries.find(item => item.id === entryId);

        if (!entry || entry.type !== "catchup") {
            return;
        }

        catchupCountInput.value = entry.count;
        setSelectedApproximateTime(entry.approximateTime || "unknown");
        modalTitle.textContent = "Edit catch-up entry";
        catchupSaveButton.textContent = "Save changes";
    } else {
        catchupCountInput.value = count;
        setSelectedApproximateTime("just_now");
        modalTitle.textContent = "Add missed movements";
        catchupSaveButton.textContent = "Add catch-up";
    }

    showModal(catchupModal, catchupCountInput);

    window.setTimeout(() => {
        catchupCountInput.select();
    }, 30);
}


function addLiveEntry() {
    const day = getTodayData();

    day.entries.push({
        id: createEntryId(),
        type: "live",
        count: 1,
        recordedAt: new Date().toISOString()
    });

    saveState();
    vibrate();
    render();
    showToast("Movement recorded");
}


function saveCatchupEntry() {
    const count = normalizeCatchupCount(catchupCountInput.value);

    if (count === null) {
        showToast("Enter a number between 1 and 100");
        catchupCountInput.focus();
        return;
    }

    const approximateTime = getSelectedApproximateTime();
    const day = getTodayData();

    if (editingEntryId) {
        const entry = day.entries.find(item => item.id === editingEntryId);

        if (!entry || entry.type !== "catchup") {
            closeCatchupModal();
            return;
        }

        entry.count = count;
        entry.approximateTime = approximateTime;
        entry.editedAt = new Date().toISOString();

        saveState();
        closeCatchupModal();
        render();
        showToast("Catch-up entry updated");
        return;
    }

    day.entries.push({
        id: createEntryId(),
        type: "catchup",
        count,
        recordedAt: new Date().toISOString(),
        approximateTime
    });

    saveState();
    vibrate();
    closeCatchupModal();
    render();

    showToast(
        `${count} catch-up movement${count === 1 ? "" : "s"} added`
    );
}


function undoLastEntry() {
    const day = getTodayData();

    if (day.entries.length === 0) {
        return;
    }

    const removed = day.entries.pop();

    saveState();
    render();

    showToast(
        removed.type === "catchup"
            ? "Catch-up entry removed"
            : "Last movement removed"
    );
}


function openDeleteModal(entryId) {
    const entry = getTodayData().entries.find(item => item.id === entryId);

    if (!entry) {
        return;
    }

    pendingDeleteEntryId = entryId;
    showModal(deleteModal, deleteCancelButton);
}


function closeDeleteModal() {
    hideModal(deleteModal);
    pendingDeleteEntryId = null;
}


function confirmDeleteEntry() {
    if (!pendingDeleteEntryId) {
        closeDeleteModal();
        return;
    }

    const day = getTodayData();
    const originalLength = day.entries.length;

    day.entries = day.entries.filter(
        entry => entry.id !== pendingDeleteEntryId
    );

    if (day.entries.length !== originalLength) {
        saveState();
        render();
        showToast("Entry deleted");
    }

    closeDeleteModal();
}


function saveDayNote(dateKey, value, statusElement) {
    const day = getDayData(dateKey, true);
    day.note = value.trim();

    saveState();

    statusElement.textContent = "Saved";

    window.setTimeout(() => {
        if (statusElement.textContent === "Saved") {
            statusElement.textContent = "";
        }
    }, 1500);

    renderHistory();
}


function scheduleTodayNoteSave() {
    todayNoteStatus.textContent = "Saving…";

    window.clearTimeout(todayNoteTimer);

    todayNoteTimer = window.setTimeout(() => {
        saveDayNote(
            getLocalDateKey(),
            todayNoteInput.value,
            todayNoteStatus
        );
    }, 450);
}


function scheduleDetailNoteSave() {
    if (!selectedHistoryDateKey) {
        return;
    }

    detailNoteStatus.textContent = "Saving…";

    window.clearTimeout(detailNoteTimer);

    detailNoteTimer = window.setTimeout(() => {
        const dateKey = selectedHistoryDateKey;
        const value = detailNoteInput.value;
        const day = getDayData(dateKey, true);

        day.note = value.trim();
        saveState();

        detailNoteStatus.textContent = "Saved";

        window.setTimeout(() => {
            if (detailNoteStatus.textContent === "Saved") {
                detailNoteStatus.textContent = "";
            }
        }, 1500);

        if (dateKey === getLocalDateKey()) {
            todayNoteInput.value = day.note;
        }

        renderHistory();
    }, 450);
}


function validateSettingsForm() {
    const start = settingStartTime.value;
    const end = settingEndTime.value;
    const targetRaw = settingDailyTarget.value.trim();

    if (!isValidTimeString(start) || !isValidTimeString(end)) {
        return {
            ok: false,
            message: "Choose a valid start and end time."
        };
    }

    if (start === end) {
        return {
            ok: false,
            message: "Start and end time cannot be the same."
        };
    }

    if (targetRaw) {
        const target = Number(targetRaw);

        if (!Number.isInteger(target) || target < 1 || target > 100) {
            return {
                ok: false,
                message: "Daily target must be a whole number between 1 and 100."
            };
        }
    }

    return {
        ok: true
    };
}


function renderSettingsForm() {
    const settings = getSettings();

    settingStartTime.value = settings.trackingStart;
    settingEndTime.value = settings.trackingEnd;
    settingDailyTarget.value = settings.dailyTarget || "";
    settingHaptics.checked = settings.hapticsEnabled;
    settingDoctorInstructions.value = settings.doctorInstructions || "";
    settingsError.hidden = true;
    settingsError.textContent = "";
}


function saveSettings() {
    const validation = validateSettingsForm();

    if (!validation.ok) {
        settingsError.textContent = validation.message;
        settingsError.hidden = false;
        return;
    }

    const targetRaw = settingDailyTarget.value.trim();

    state.settings = {
        trackingStart: settingStartTime.value,
        trackingEnd: settingEndTime.value,
        dailyTarget: targetRaw ? Number(targetRaw) : null,
        hapticsEnabled: settingHaptics.checked,
        doctorInstructions: settingDoctorInstructions.value.trim()
    };

    saveState();

    settingsError.hidden = true;
    settingsError.textContent = "";

    render();
    renderSettingsForm();
    showToast("Settings saved");
}



function getAllDataDateKeys() {
    return Object.keys(state.days).sort();
}


function renderExportForm() {
    const keys = getAllDataDateKeys();
    const today = getLocalDateKey();

    exportStartDate.value = keys.length ? keys[0] : today;
    exportEndDate.value = today;
    exportError.hidden = true;
    exportError.textContent = "";
    restoreFileName.textContent = "";
    restoreFileInput.value = "";
}


function sanitizeCsvFormula(value) {
    const text = String(value ?? "");

    if (/^[=+\-@]/.test(text)) {
        return `'${text}`;
    }

    return text;
}


function csvCell(value) {
    const safe = sanitizeCsvFormula(value);
    return `"${safe.replace(/"/g, '""')}"`;
}


function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


function validateExportRange() {
    const start = exportStartDate.value;
    const end = exportEndDate.value;

    if (!start || !end) {
        return {
            ok: false,
            message: "Choose both a start date and end date."
        };
    }

    if (start > end) {
        return {
            ok: false,
            message: "From date cannot be after To date."
        };
    }

    return {
        ok: true,
        start,
        end
    };
}


function exportCsv() {
    const validation = validateExportRange();

    if (!validation.ok) {
        exportError.textContent = validation.message;
        exportError.hidden = false;
        return;
    }

    const rows = [
        [
            "Date",
            "Entry Type",
            "Count",
            "Recorded At",
            "Approximate Time",
            "Daily Note"
        ]
    ];

    const dateKeys = getAllDataDateKeys().filter(
        dateKey => dateKey >= validation.start && dateKey <= validation.end
    );

    dateKeys.forEach(dateKey => {
        const day = getDayData(dateKey);

        if (!day) {
            return;
        }

        if (day.entries.length === 0 && day.note.trim()) {
            rows.push([
                dateKey,
                "",
                "",
                "",
                "",
                day.note
            ]);
            return;
        }

        day.entries.forEach(entry => {
            rows.push([
                dateKey,
                entry.type === "catchup" ? "Catch-up" : "Live",
                Number(entry.count || 0),
                entry.recordedAt || "",
                entry.type === "catchup"
                    ? (APPROXIMATE_TIME_LABELS[entry.approximateTime || "unknown"] || "Don't remember")
                    : "",
                day.note || ""
            ]);
        });
    });

    if (rows.length === 1) {
        exportError.textContent = "No BumpMarks data exists in the selected date range.";
        exportError.hidden = false;
        return;
    }

    exportError.hidden = true;
    exportError.textContent = "";

    const csv = rows
        .map(row => row.map(csvCell).join(","))
        .join("\r\n");

    downloadTextFile(
        `bumpmarks-${validation.start}-to-${validation.end}.csv`,
        "\ufeff" + csv,
        "text/csv;charset=utf-8"
    );

    showToast("CSV exported");
}


function createBackupPayload() {
    return {
        app: "BumpMarks",
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        data: state
    };
}


function downloadBackup() {
    const payload = createBackupPayload();

    downloadTextFile(
        `bumpmarks-backup-${getLocalDateKey()}.json`,
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8"
    );

    showToast("Backup downloaded");
}


function validateBackupPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    if (payload.app !== "BumpMarks" || payload.formatVersion !== 1) {
        return null;
    }

    if (!payload.data || typeof payload.data !== "object") {
        return null;
    }

    if (!payload.data.days || typeof payload.data.days !== "object" || Array.isArray(payload.data.days)) {
        return null;
    }

    const restored = {
        version: 1,
        settings: normalizeSettings(payload.data.settings),
        days: {}
    };

    for (const [dateKey, rawDay] of Object.entries(payload.data.days)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            return null;
        }

        const day = normalizeDayData(rawDay);

        const entries = [];

        for (const rawEntry of day.entries) {
            if (!rawEntry || typeof rawEntry !== "object") {
                return null;
            }

            const count = Number(rawEntry.count);

            if (!Number.isInteger(count) || count < 1 || count > 100) {
                return null;
            }

            const type = rawEntry.type === "catchup" ? "catchup" : "live";

            if (typeof rawEntry.recordedAt !== "string" || Number.isNaN(new Date(rawEntry.recordedAt).getTime())) {
                return null;
            }

            const entry = {
                id: typeof rawEntry.id === "string" && rawEntry.id
                    ? rawEntry.id
                    : createEntryId(),
                type,
                count,
                recordedAt: rawEntry.recordedAt
            };

            if (type === "catchup") {
                entry.approximateTime = APPROXIMATE_TIME_LABELS[rawEntry.approximateTime]
                    ? rawEntry.approximateTime
                    : "unknown";
            }

            if (typeof rawEntry.editedAt === "string" && !Number.isNaN(new Date(rawEntry.editedAt).getTime())) {
                entry.editedAt = rawEntry.editedAt;
            }

            entries.push(entry);
        }

        restored.days[dateKey] = {
            entries,
            note: String(day.note || "").slice(0, 500)
        };
    }

    return restored;
}


function closeRestoreConfirm() {
    hideModal(restoreConfirmModal);
    pendingRestoreState = null;
}


function openRestoreConfirm(restoredState) {
    pendingRestoreState = restoredState;
    showModal(restoreConfirmModal, restoreCancelButton);
}


function applyRestore() {
    if (!pendingRestoreState) {
        closeRestoreConfirm();
        return;
    }

    state = pendingRestoreState;
    storageWritesBlocked = false;
    storageAccessAvailable = true;

    const persisted = saveState();

    hideModal(restoreConfirmModal);
    pendingRestoreState = null;

    renderDate();
    render();
    renderSettingsForm();
    renderExportForm();
    setActiveView("today");

    showToast(
        persisted
            ? "Backup restored"
            : "Backup loaded for this session only"
    );
}


function handleRestoreFile(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
        return;
    }

    restoreFileName.textContent = file.name;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const payload = JSON.parse(String(reader.result || ""));
            const restoredState = validateBackupPayload(payload);

            if (!restoredState) {
                showToast("Invalid BumpMarks backup");
                restoreFileInput.value = "";
                restoreFileName.textContent = "";
                return;
            }

            openRestoreConfirm(restoredState);
        } catch (error) {
            console.error("Could not parse BumpMarks backup.", error);
            showToast("Invalid BumpMarks backup");
            restoreFileInput.value = "";
            restoreFileName.textContent = "";
        }
    };

    reader.onerror = () => {
        showToast("Could not read backup file");
        restoreFileInput.value = "";
        restoreFileName.textContent = "";
    };

    reader.readAsText(file);
}


function openDeleteAllConfirm() {
    showModal(deleteAllModal, deleteAllCancelButton);
}


function closeDeleteAllConfirm() {
    hideModal(deleteAllModal);
}


function deleteAllLocalData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        storageAccessAvailable = true;
        storageWritesBlocked = false;
        setStorageWarning("");
    } catch (error) {
        console.error("Could not delete local BumpMarks data.", error);
        setStorageWarning(
            "BumpMarks could not erase browser storage. Your browser may be blocking local storage access."
        );
        closeDeleteAllConfirm();
        return;
    }

    state = createEmptyState();

    hideModal(deleteAllModal);

    renderDate();
    render();
    renderSettingsForm();
    renderExportForm();
    setActiveView("today");

    showToast("All local data deleted");
}


function renderTally(count) {
    tallyElement.innerHTML = "";

    if (count === 0) {
        return;
    }

    let remaining = count;

    while (remaining > 0) {
        const marks = Math.min(remaining, 5);
        const group = document.createElement("span");

        group.className = "tally-group";

        if (marks === 5) {
            group.classList.add("complete");
        }

        const verticalMarks = marks === 5 ? 4 : marks;

        for (let index = 0; index < verticalMarks; index += 1) {
            const mark = document.createElement("span");
            mark.className = "tally-mark";
            group.appendChild(mark);
        }

        tallyElement.appendChild(group);
        remaining -= marks;
    }
}


function renderTargetProgress(count) {
    const target = getSettings().dailyTarget;

    if (!target) {
        targetProgress.hidden = true;
        return;
    }

    targetProgress.hidden = false;

    const percentage = Math.min(100, Math.round((count / target) * 100));
    const complete = count >= target;

    targetProgressText.textContent = `${count} / ${target}`;
    targetProgress.setAttribute("aria-valuemax", String(target));
    targetProgress.setAttribute("aria-valuenow", String(Math.min(count, target)));
    targetProgressBar.style.width = `${percentage}%`;
    targetProgress.classList.toggle("complete", complete);
    targetProgressMessage.textContent = complete
        ? "Today's target reached."
        : `${Math.max(0, target - count)} remaining to reach the set target.`;
}


function renderDoctorInstructions() {
    const instructions = getSettings().doctorInstructions.trim();

    doctorInstructionsCard.hidden = !instructions;
    doctorInstructionsDisplay.textContent = instructions;
}


function createEntryAction(label, className, onClick) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `entry-action ${className || ""}`.trim();
    button.textContent = label;
    button.addEventListener("click", onClick);

    return button;
}


function renderRecentEntries() {
    const day = getTodayData();

    recentListElement.innerHTML = "";

    const entries = [...day.entries].reverse();

    emptyStateElement.style.display = entries.length ? "none" : "block";
    entryCountLabelElement.textContent = entries.length
        ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`
        : "";

    entries.forEach(entry => {
        const row = document.createElement("div");
        row.className = "recent-entry";

        const main = document.createElement("div");
        main.className = "entry-main";

        const titleRow = document.createElement("div");
        titleRow.className = "entry-title-row";

        const title = document.createElement("p");
        title.className = "entry-title";
        title.textContent = entry.type === "catchup"
            ? "Catch-up"
            : "Movement";

        titleRow.appendChild(title);

        if (entry.type === "catchup") {
            const badge = document.createElement("span");
            badge.className = "entry-badge";
            badge.textContent = "Added later";
            titleRow.appendChild(badge);
        }

        const meta = document.createElement("p");
        meta.className = "entry-meta";

        if (entry.type === "catchup") {
            const approximateLabel = APPROXIMATE_TIME_LABELS[
                entry.approximateTime || "unknown"
            ] || APPROXIMATE_TIME_LABELS.unknown;

            meta.textContent = `${approximateLabel} · entered ${formatTime(entry.recordedAt)}`;
        } else {
            meta.textContent = formatTime(entry.recordedAt);
        }

        main.appendChild(titleRow);
        main.appendChild(meta);

        const side = document.createElement("div");
        side.className = "entry-side";

        const count = document.createElement("div");
        count.className = "entry-count";
        count.textContent = `+${entry.count}`;

        const actions = document.createElement("div");
        actions.className = "entry-actions";

        if (entry.type === "catchup") {
            actions.appendChild(
                createEntryAction(
                    "Edit",
                    "",
                    () => openCatchupModal(entry.count, entry.id)
                )
            );
        }

        actions.appendChild(
            createEntryAction(
                "Delete",
                "danger",
                () => openDeleteModal(entry.id)
            )
        );

        side.appendChild(count);
        side.appendChild(actions);

        row.appendChild(main);
        row.appendChild(side);

        recentListElement.appendChild(row);
    });
}


function getHistoryKeys() {
    return Object.keys(state.days)
        .filter(dateKey => {
            const day = getDayData(dateKey);
            return day && (day.entries.length > 0 || day.note.trim().length > 0);
        })
        .sort((a, b) => b.localeCompare(a));
}


function getEntryBreakdown(day) {
    return day.entries.reduce(
        (summary, entry) => {
            const count = Number(entry.count || 0);

            if (entry.type === "catchup") {
                summary.catchup += count;
            } else {
                summary.live += count;
            }

            return summary;
        },
        {
            live: 0,
            catchup: 0
        }
    );
}


function getRecordedTimeRange(day) {
    const validEntries = day.entries.filter(entry => entry.recordedAt);

    if (validEntries.length === 0) {
        return "No timed entries";
    }

    const times = validEntries
        .map(entry => new Date(entry.recordedAt))
        .filter(date => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);

    if (times.length === 0) {
        return "No timed entries";
    }

    const first = formatTime(times[0].toISOString());
    const last = formatTime(times[times.length - 1].toISOString());

    return first === last
        ? first
        : `${first} - ${last}`;
}


function renderHistory() {
    const dateKeys = getHistoryKeys();

    historyListElement.innerHTML = "";
    historyEmptyElement.style.display = dateKeys.length ? "none" : "block";

    dateKeys.forEach(dateKey => {
        const day = getDayData(dateKey);
        const total = getDayTotal(day);
        const breakdown = getEntryBreakdown(day);

        const card = document.createElement("button");
        card.type = "button";
        card.className = "history-card";
        card.addEventListener("click", () => openDayDetail(dateKey));

        const top = document.createElement("div");
        top.className = "history-card-top";

        const left = document.createElement("div");

        const date = document.createElement("p");
        date.className = "history-date";
        date.textContent = formatHistoryCardDate(dateKey);

        const subtitle = document.createElement("p");
        subtitle.className = "history-subtitle";
        subtitle.textContent =
            `${breakdown.live} live · ${breakdown.catchup} catch-up · ${getRecordedTimeRange(day)}`;

        left.appendChild(date);
        left.appendChild(subtitle);

        const right = document.createElement("div");

        const totalValue = document.createElement("div");
        totalValue.className = "history-total";
        totalValue.textContent = total;

        const totalLabel = document.createElement("div");
        totalLabel.className = "history-total-label";
        totalLabel.textContent = "movements";

        right.appendChild(totalValue);
        right.appendChild(totalLabel);

        top.appendChild(left);
        top.appendChild(right);

        card.appendChild(top);

        if (day.note.trim()) {
            const note = document.createElement("p");
            note.className = "history-note-preview";

            const preview = day.note.trim();
            note.textContent = preview.length > 95
                ? `${preview.slice(0, 95)}…`
                : preview;

            card.appendChild(note);
        }

        historyListElement.appendChild(card);
    });
}


function createSummaryStat(value, label) {
    const wrapper = document.createElement("div");
    wrapper.className = "summary-stat";

    const valueElement = document.createElement("p");
    valueElement.className = "summary-value";
    valueElement.textContent = value;

    const labelElement = document.createElement("p");
    labelElement.className = "summary-label";
    labelElement.textContent = label;

    wrapper.appendChild(valueElement);
    wrapper.appendChild(labelElement);

    return wrapper;
}


function renderDayDetailEntries(day) {
    dayDetailEntries.innerHTML = "";

    if (day.entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No movement entries for this day.";
        dayDetailEntries.appendChild(empty);
        return;
    }

    const entries = [...day.entries].sort(
        (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
    );

    entries.forEach(entry => {
        const row = document.createElement("div");
        row.className = "detail-entry";

        const left = document.createElement("div");

        const title = document.createElement("p");
        title.className = "detail-entry-title";
        title.textContent = entry.type === "catchup"
            ? "Catch-up"
            : "Movement";

        const meta = document.createElement("p");
        meta.className = "detail-entry-meta";

        if (entry.type === "catchup") {
            const approximateLabel = APPROXIMATE_TIME_LABELS[
                entry.approximateTime || "unknown"
            ] || APPROXIMATE_TIME_LABELS.unknown;

            meta.textContent = `${approximateLabel} · entered ${formatTime(entry.recordedAt)}`;
        } else {
            meta.textContent = formatTime(entry.recordedAt);
        }

        const count = document.createElement("div");
        count.className = "detail-entry-count";
        count.textContent = `+${entry.count}`;

        left.appendChild(title);
        left.appendChild(meta);

        row.appendChild(left);
        row.appendChild(count);

        dayDetailEntries.appendChild(row);
    });
}


function renderDayDetail(dateKey, syncNoteValue = true) {
    const day = getDayData(dateKey);

    if (!day) {
        return;
    }

    const total = getDayTotal(day);
    const breakdown = getEntryBreakdown(day);

    dayDetailTitle.textContent = formatHistoryDate(dateKey);

    dayDetailSummary.innerHTML = "";
    dayDetailSummary.appendChild(createSummaryStat(total, "Total"));
    dayDetailSummary.appendChild(createSummaryStat(breakdown.live, "Live"));
    dayDetailSummary.appendChild(createSummaryStat(breakdown.catchup, "Catch-up"));

    renderDayDetailEntries(day);

    if (syncNoteValue) {
        detailNoteInput.value = day.note || "";
    }
}


function openDayDetail(dateKey) {
    const day = getDayData(dateKey);

    if (!day) {
        return;
    }

    selectedHistoryDateKey = dateKey;
    detailNoteStatus.textContent = "";
    renderDayDetail(dateKey);
    showModal(dayDetailModal, dayDetailCloseButton);
}


function closeDayDetail() {
    window.clearTimeout(detailNoteTimer);

    if (selectedHistoryDateKey && detailNoteStatus.textContent === "Saving…") {
        const day = getDayData(selectedHistoryDateKey, true);
        day.note = detailNoteInput.value.trim();
        saveState();
        renderHistory();

        if (selectedHistoryDateKey === getLocalDateKey()) {
            todayNoteInput.value = day.note;
        }
    }

    hideModal(dayDetailModal);
    selectedHistoryDateKey = null;
    detailNoteStatus.textContent = "";
}


function renderTrackingWindow() {
    const open = isTrackingWindowOpen();
    const label = getTrackingWindowLabel();

    if (open) {
        trackingStatusElement.textContent = label;
        trackingStatusElement.classList.remove("closed");
        movementButton.disabled = false;
        return;
    }

    trackingStatusElement.textContent = `Tracking: ${label}`;
    trackingStatusElement.classList.add("closed");
    movementButton.disabled = true;
}


function render() {
    const count = getTodayTotal();
    const today = getTodayData();

    movementCountElement.textContent = count;
    renderTally(count);
    renderTargetProgress(count);
    renderDoctorInstructions();
    renderRecentEntries();
    renderTrackingWindow();
    renderHistory();

    if (document.activeElement !== todayNoteInput) {
        todayNoteInput.value = today.note || "";
    }

    undoButton.disabled = today.entries.length === 0;
}



function refreshTimeSensitiveUi() {
    const currentDateKey = getLocalDateKey();

    if (currentDateKey !== lastRenderedDateKey) {
        renderDate();
        render();
        lastRenderedDateKey = currentDateKey;
        return;
    }

    renderTrackingWindow();
}


function renderDate() {
    todayDateElement.textContent = new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "long",
            day: "numeric",
            month: "long"
        }
    ).format(new Date());
}


movementButton.addEventListener("click", () => {
    if (!isTrackingWindowOpen()) {
        return;
    }

    addLiveEntry();
});


document
    .querySelectorAll("[data-catchup-count]")
    .forEach(button => {
        button.addEventListener("click", () => {
            openCatchupModal(Number(button.dataset.catchupCount));
        });
    });


customCatchupButton.addEventListener("click", () => {
    openCatchupModal(1);
});


catchupCloseButton.addEventListener("click", closeCatchupModal);
catchupSaveButton.addEventListener("click", saveCatchupEntry);


catchupMinusButton.addEventListener("click", () => {
    const current = normalizeCatchupCount(catchupCountInput.value) || 1;
    catchupCountInput.value = Math.max(1, current - 1);
});


catchupPlusButton.addEventListener("click", () => {
    const current = normalizeCatchupCount(catchupCountInput.value) || 1;
    catchupCountInput.value = Math.min(100, current + 1);
});


catchupModal.addEventListener("click", event => {
    if (event.target === catchupModal) {
        closeCatchupModal();
    }
});


deleteCancelButton.addEventListener("click", closeDeleteModal);
deleteConfirmButton.addEventListener("click", confirmDeleteEntry);


deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});


dayDetailCloseButton.addEventListener("click", closeDayDetail);


dayDetailModal.addEventListener("click", event => {
    if (event.target === dayDetailModal) {
        closeDayDetail();
    }
});


navTodayButton.addEventListener("click", () => setActiveView("today"));
navHistoryButton.addEventListener("click", () => setActiveView("history"));
navExportButton.addEventListener("click", () => setActiveView("export"));
navSettingsButton.addEventListener("click", () => setActiveView("settings"));


exportCsvButton.addEventListener("click", exportCsv);
downloadBackupButton.addEventListener("click", downloadBackup);

chooseRestoreFileButton.addEventListener("click", () => {
    restoreFileInput.click();
});

restoreFileInput.addEventListener("change", handleRestoreFile);

restoreCancelButton.addEventListener("click", closeRestoreConfirm);
restoreConfirmButton.addEventListener("click", applyRestore);

restoreConfirmModal.addEventListener("click", event => {
    if (event.target === restoreConfirmModal) {
        closeRestoreConfirm();
    }
});

deleteAllDataButton.addEventListener("click", openDeleteAllConfirm);
deleteAllCancelButton.addEventListener("click", closeDeleteAllConfirm);
deleteAllConfirmButton.addEventListener("click", deleteAllLocalData);

deleteAllModal.addEventListener("click", event => {
    if (event.target === deleteAllModal) {
        closeDeleteAllConfirm();
    }
});

todayNoteInput.addEventListener("input", scheduleTodayNoteSave);
detailNoteInput.addEventListener("input", scheduleDetailNoteSave);
saveSettingsButton.addEventListener("click", saveSettings);


document.addEventListener("keydown", event => {
    const openModal = getOpenModal();

    if (openModal && event.key === "Tab") {
        trapModalFocus(event, openModal);
        return;
    }

    if (event.key !== "Escape") {
        return;
    }

    if (!restoreConfirmModal.hidden) {
        closeRestoreConfirm();
        return;
    }

    if (!deleteAllModal.hidden) {
        closeDeleteAllConfirm();
        return;
    }

    if (!deleteModal.hidden) {
        closeDeleteModal();
        return;
    }

    if (!catchupModal.hidden) {
        closeCatchupModal();
        return;
    }

    if (!dayDetailModal.hidden) {
        closeDayDetail();
    }
});


installAppButton.addEventListener("click", installApp);
applyUpdateButton.addEventListener("click", applyPendingUpdate);

undoButton.addEventListener("click", undoLastEntry);



window.addEventListener("focus", refreshTimeSensitiveUi);

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        refreshTimeSensitiveUi();
    }
});

window.setInterval(refreshTimeSensitiveUi, 60_000);

window.addEventListener("load", () => {
    registerPwaHandlers();
    registerServiceWorker();
});


let state = loadState();

renderDate();
render();
renderSettingsForm();
renderExportForm();
setActiveView("today");
lastRenderedDateKey = getLocalDateKey();

if (storageWarningMessage) {
    setStorageWarning(storageWarningMessage);
}
