const STORAGE_KEY = "bumpmarks.v1";

const movementCountElement = document.getElementById("movement-count");
const movementButton = document.getElementById("movement-button");
const undoButton = document.getElementById("undo-button");
const tallyElement = document.getElementById("tally");
const todayDateElement = document.getElementById("today-date");
const trackingStatusElement = document.getElementById("tracking-status");
const recentListElement = document.getElementById("recent-list");
const emptyStateElement = document.getElementById("empty-state");
const customCatchupButton = document.getElementById("custom-catchup-button");
const toastElement = document.getElementById("toast");


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


function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            return {
                version: 1,
                days: {}
            };
        }

        return JSON.parse(stored);
    } catch (error) {
        console.error("Could not read BumpMarks data.", error);

        return {
            version: 1,
            days: {}
        };
    }
}


function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


function getTodayData() {
    const key = getLocalDateKey();

    if (!state.days[key]) {
        state.days[key] = {
            entries: []
        };
    }

    return state.days[key];
}


function getTodayTotal() {
    const day = getTodayData();

    return day.entries.reduce(
        (total, entry) => total + entry.count,
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


function addEntry(type, count) {
    if (!Number.isInteger(count) || count <= 0) {
        return;
    }

    const day = getTodayData();

    day.entries.push({
        id: createEntryId(),
        type,
        count,
        recordedAt: new Date().toISOString()
    });

    saveState();
    vibrate();
    render();

    if (type === "live") {
        showToast("Movement recorded");
    } else {
        showToast(
            `${count} catch-up movement${count === 1 ? "" : "s"} added`
        );
    }
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


function renderRecentEntries() {
    const day = getTodayData();

    recentListElement.innerHTML = "";

    const entries = [...day.entries]
        .reverse()
        .slice(0, 6);

    emptyStateElement.style.display = entries.length ? "none" : "block";

    entries.forEach(entry => {
        const row = document.createElement("div");
        row.className = "recent-entry";

        const details = document.createElement("div");

        const title = document.createElement("p");
        title.className = "entry-title";
        title.textContent = entry.type === "catchup"
            ? "Catch-up"
            : "Movement";

        const meta = document.createElement("p");
        meta.className = "entry-meta";
        meta.textContent = entry.type === "catchup"
            ? `Added ${formatTime(entry.recordedAt)}`
            : formatTime(entry.recordedAt);

        details.appendChild(title);
        details.appendChild(meta);

        const count = document.createElement("div");
        count.className = "entry-count";
        count.textContent = `+${entry.count}`;

        row.appendChild(details);
        row.appendChild(count);

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

    addEntry("live", 1);
});


document
    .querySelectorAll(".catchup-button[data-count]")
    .forEach(button => {
        button.addEventListener("click", () => {
            const count = Number(button.dataset.count);
            addEntry("catchup", count);
        });
    });


customCatchupButton.addEventListener("click", () => {
    const input = window.prompt(
        "How many movements did you miss recording?"
    );

    if (input === null) {
        return;
    }

    const count = Number(input);

    if (!Number.isInteger(count) || count <= 0 || count > 100) {
        showToast("Enter a number between 1 and 100");
        return;
    }

    addEntry("catchup", count);
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
