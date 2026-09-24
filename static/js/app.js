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
const navSettingsButton = document.getElementById("nav-settings");

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
                ? input.doctorInstructions
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


function normalizeDayData(day) {
    if (!day || typeof day !== "object") {
        return {
            entries: [],
            note: ""
        };
    }

    if (!Array.isArray(day.entries)) {
        day.entries = [];
    }

    if (typeof day.note !== "string") {
        day.note = "";
    }

    return day;
}


function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            return createEmptyState();
        }

        const parsed = JSON.parse(stored);

        if (!parsed || typeof parsed !== "object" || typeof parsed.days !== "object") {
            return createEmptyState();
        }

        parsed.settings = normalizeSettings(parsed.settings);

        Object.keys(parsed.days).forEach(dateKey => {
            parsed.days[dateKey] = normalizeDayData(parsed.days[dateKey]);
        });

        return parsed;
    } catch (error) {
        console.error("Could not read BumpMarks data.", error);
        return createEmptyState();
    }
}


function saveState() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
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


function syncBodyModalState() {
    const anyOpen =
        !catchupModal.hidden ||
        !deleteModal.hidden ||
        !dayDetailModal.hidden;

    document.body.classList.toggle("modal-open", anyOpen);
}


function setActiveView(viewName) {
    const showHistory = viewName === "history";
    const showSettings = viewName === "settings";
    const showToday = !showHistory && !showSettings;

    todayView.hidden = !showToday;
    historyView.hidden = !showHistory;
    settingsView.hidden = !showSettings;

    navTodayButton.classList.toggle("active", showToday);
    navHistoryButton.classList.toggle("active", showHistory);
    navSettingsButton.classList.toggle("active", showSettings);

    if (showHistory) {
        renderHistory();
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
    catchupModal.hidden = true;
    editingEntryId = null;
    syncBodyModalState();
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

    catchupModal.hidden = false;
    syncBodyModalState();

    window.setTimeout(() => {
        catchupCountInput.focus();
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
    deleteModal.hidden = false;
    syncBodyModalState();
}


function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteEntryId = null;
    syncBodyModalState();
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
    dayDetailModal.hidden = false;
    syncBodyModalState();
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

    dayDetailModal.hidden = true;
    selectedHistoryDateKey = null;
    detailNoteStatus.textContent = "";
    syncBodyModalState();
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
navSettingsButton.addEventListener("click", () => setActiveView("settings"));

todayNoteInput.addEventListener("input", scheduleTodayNoteSave);
detailNoteInput.addEventListener("input", scheduleDetailNoteSave);
saveSettingsButton.addEventListener("click", saveSettings);


document.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
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


undoButton.addEventListener("click", undoLastEntry);


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .catch(error => {
                console.error("Service worker registration failed.", error);
            });
    });
}


let state = loadState();

renderDate();
render();
renderSettingsForm();
setActiveView("today");
