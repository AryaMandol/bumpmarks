const STORAGE_KEY = "bumpmarks.v1";

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

const catchupModal = document.getElementById("catchup-modal");
const catchupCloseButton = document.getElementById("catchup-close");
const catchupCountInput = document.getElementById("catchup-count");
const catchupMinusButton = document.getElementById("catchup-minus");
const catchupPlusButton = document.getElementById("catchup-plus");
const catchupSaveButton = document.getElementById("catchup-save");

const deleteModal = document.getElementById("delete-modal");
const deleteCancelButton = document.getElementById("delete-cancel");
const deleteConfirmButton = document.getElementById("delete-confirm");

let editingEntryId = null;
let pendingDeleteEntryId = null;


function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function createEntryId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}


function createEmptyState() {
    return {
        version: 1,
        days: {}
    };
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


function getTodayData() {
    const key = getLocalDateKey();

    if (!state.days[key]) {
        state.days[key] = {
            entries: []
        };
    }

    if (!Array.isArray(state.days[key].entries)) {
        state.days[key].entries = [];
    }

    return state.days[key];
}


function getTodayTotal() {
    return getTodayData().entries.reduce(
        (total, entry) => total + Number(entry.count || 0),
        0
    );
}


function isTrackingWindowOpen() {
    return new Date().getHours() >= 12;
}


function vibrate() {
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


function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("visible");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
        toastElement.classList.remove("visible");
    }, 1800);
}


function syncBodyModalState() {
    const anyOpen = !catchupModal.hidden || !deleteModal.hidden;
    document.body.classList.toggle("modal-open", anyOpen);
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


function renderTrackingWindow() {
    const open = isTrackingWindowOpen();

    if (open) {
        trackingStatusElement.textContent = "12 PM - 12 AM";
        trackingStatusElement.classList.remove("closed");
        movementButton.disabled = false;
        return;
    }

    trackingStatusElement.textContent = "Starts at 12 PM";
    trackingStatusElement.classList.add("closed");
    movementButton.disabled = true;
}


function render() {
    const count = getTodayTotal();

    movementCountElement.textContent = count;
    renderTally(count);
    renderRecentEntries();
    renderTrackingWindow();

    undoButton.disabled = getTodayData().entries.length === 0;
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
