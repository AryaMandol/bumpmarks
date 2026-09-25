const demoCount = document.getElementById("demo-count");
const demoTally = document.getElementById("demo-tally");
const demoAddButton = document.getElementById("demo-add");
const demoResetButton = document.getElementById("demo-reset");

let demoValue = 0;


function renderDemoTally() {
    demoTally.innerHTML = "";

    let remaining = demoValue;

    while (remaining > 0) {
        const marks = Math.min(remaining, 5);
        const group = document.createElement("span");

        group.className = "demo-tally-group";

        if (marks === 5) {
            group.classList.add("complete");
        }

        const verticalMarks = marks === 5 ? 4 : marks;

        for (let index = 0; index < verticalMarks; index += 1) {
            const mark = document.createElement("span");
            mark.className = "demo-tally-mark";
            group.appendChild(mark);
        }

        demoTally.appendChild(group);
        remaining -= marks;
    }
}


function renderDemo() {
    demoCount.textContent = demoValue;
    renderDemoTally();
}


demoAddButton.addEventListener("click", () => {
    demoValue += 1;
    renderDemo();

    if ("vibrate" in navigator) {
        navigator.vibrate(20);
    }
});


demoResetButton.addEventListener("click", () => {
    demoValue = 0;
    renderDemo();
});


function registerLandingServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker
        .register("/sw.js", {
            scope: "/",
            updateViaCache: "none"
        })
        .then(registration => registration.update())
        .catch(error => {
            console.error("Service worker registration failed.", error);
        });
}


registerLandingServiceWorker();
renderDemo();
