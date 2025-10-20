// Restore saved wallpaper
const savedWallpaper = localStorage.getItem("wallpaper");
if (savedWallpaper) {
    setWallpaper(savedWallpaper);
}

// Variables
let zCounter = 1000;

// Clock update
function updateClock() {
    const now = new Date();
    const ore = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const secunde = String(now.getSeconds()).padStart(2, '0');
    const time = `${ore}:${minute}:${secunde}`;

    const zile = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const luni = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const zi_curenta = zile[now.getDay()];
    const zi_luna = String(now.getDate()).padStart(2, '0');
    const luna = luni[now.getMonth()];
    const an = now.getFullYear();
    const data = `${zi_luna}/${luna}/${an}`;
    document.querySelector(".clock").textContent = `${time} | ${data}`;
}
setInterval(updateClock, 1000);
updateClock();

// App icons
document.querySelectorAll(".icon").forEach(icon => {
    icon.addEventListener("click", () => {
        const app = icon.dataset.app;
        openWindow(app);
    });
});

function openWindow(app) {
    const existingWin = document.querySelector(`.window[data-app="${app}"]`);
    if (existingWin) {
        existingWin.style.display = "block";
        bringToFront(existingWin);
        return;
    }

    const win = document.createElement("div");
    win.classList.add("window");
    win.setAttribute("data-app", app);
    win.style.top = "100px";
    win.style.left = "100px";

    let content = "";
    if (app === "photo") {
        content = `
            <div class="photo-content">
                <img src="lebron-sunshine.png" alt="Lebron background">
            </div>
        `;
    } else if (app === "notes") {
        const savedNotes = localStorage.getItem("notes") || "";
        content = `
            <div class="notes-content">
                <textarea placeholder="Write your notes here...">${savedNotes}</textarea>
            </div>
        `;
    } else if (app === "wallpapers") {
        content = `
            <div class="wallpaper-content">
                <h3>Select a wallpaper:</h3>
                <div class="wallpaper-grid">
                    <img src="sky.jpg" data-img="sky.jpg" class="wall-thumb">
                    <img src="forest.jpg" data-img="forest.jpg" class="wall-thumb">
                    <img src="beach.jpg" data-img="beach.jpg" class="wall-thumb">
                </div>
                <hr>
                <p>Or upload your own:</p>
                <input type="file" id="customWallpaper">
            </div>
        `;
    }

    win.innerHTML = `
        <div class="window-header">
            <span>${app.toUpperCase()}</span>
            <div class="window-controls">
                <button class="minimize-btn">━</button>
                <button class="maximize-btn">⬜</button>
                <button class="close-btn">✖</button>
            </div>
        </div>
        <div class="window-body">${content}</div>
        <div class="resize-handle"></div>
    `;
    document.body.appendChild(win);

    // Taskbar button
    let taskButton = document.querySelector(`.task-btn[data-app="${app}"]`);
    if (!taskButton) {
        taskButton = document.createElement("button");
        taskButton.classList.add("button", "task-btn");
        taskButton.setAttribute("data-app", app);
        taskButton.textContent = app;
        document.querySelector(".bar").insertBefore(taskButton, document.querySelector(".clock"));
    }

    // Close
    win.querySelector(".close-btn").addEventListener("click", () => {
        win.remove();
        taskButton.remove();
    });

    // Minimize / Maximize
    const minimizeBtn = win.querySelector(".minimize-btn");
    const maximizeBtn = win.querySelector(".maximize-btn");
    let isMaximized = false;
    let preMax = { top: win.offsetTop, left: win.offsetLeft, width: win.offsetWidth, height: win.offsetHeight };

    minimizeBtn.addEventListener("click", () => {
        win.style.display = "none";
    });

    maximizeBtn.addEventListener("click", () => {
        if (!isMaximized) {
            preMax = { top: win.offsetTop, left: win.offsetLeft, width: win.offsetWidth, height: win.offsetHeight };
            win.style.top = "0px";
            win.style.left = "0px";
            win.style.width = window.innerWidth + "px";
            win.style.height = window.innerHeight + "px";
            isMaximized = true;
        } else {
            win.style.top = preMax.top + "px";
            win.style.left = preMax.left + "px";
            win.style.width = preMax.width + "px";
            win.style.height = preMax.height + "px";
            isMaximized = false;
        }

        if (app === "notes") {
            const textarea = win.querySelector("textarea");
            const headerHeight = win.querySelector(".window-header").offsetHeight;
            textarea.style.height = (win.offsetHeight - headerHeight - 20) + "px";
        }
    });

    // Taskbar restore
    taskButton.addEventListener("click", () => {
        win.style.display = "block";
        bringToFront(win);
    });

    // Wallpapers
    if (app === "wallpapers") {
        win.querySelectorAll(".wall-thumb").forEach(img => {
            img.addEventListener("click", () => {
                const url = img.dataset.img;
                setWallpaper(url);
            });
        });

        const fileInput = win.querySelector("#customWallpaper");
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                setWallpaper(reader.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Notes
    if (app === "notes") {
        win.style.width = "600px";
        win.style.height = "400px";
        const textarea = win.querySelector("textarea");
        textarea.addEventListener("input", () => {
            localStorage.setItem("notes", textarea.value);
        });
        function adjustTextareaHeight() {
            const headerHeight = win.querySelector(".window-header").offsetHeight;
            textarea.style.height = (win.offsetHeight - headerHeight - 20) + "px";
        }
        adjustTextareaHeight();
        const observer = new ResizeObserver(adjustTextareaHeight);
        observer.observe(win);
    }

    makeDraggable(win);
    makeResizable(win, app);
    bringToFront(win);
}


function makeDraggable(win) {
    const header = win.querySelector(".window-header");
    let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
    header.onmousedown = e => {
        e.preventDefault();
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.onmouseup = stopDrag;
        document.onmousemove = drag;
    };
    function drag(e) {
        e.preventDefault();
        offsetX = mouseX - e.clientX;
        offsetY = mouseY - e.clientY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        win.style.top = (win.offsetTop - offsetY) + "px";
        win.style.left = (win.offsetLeft - offsetX) + "px";
        bringToFront(win);
    }
    function stopDrag() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function makeResizable(win, app) {
    const handle = win.querySelector(".resize-handle");
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = win.offsetWidth;
        startHeight = win.offsetHeight;

        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);
    });

    function resize(e) {
        if (!isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newWidth = Math.max(200, startWidth + dx);
        const newHeight = Math.max(100, startHeight + dy);

        win.style.width = `${newWidth}px`;
        win.style.height = `${newHeight}px`;

        if (app === "notes") {
            const textarea = win.querySelector("textarea");
            if (textarea) {
                const headerHeight = win.querySelector(".window-header").offsetHeight;
                textarea.style.height = `${newHeight - headerHeight - 20}px`;
            }
        }
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResize);
    }
}

function bringToFront(win) {
    win.style.zIndex = zCounter++;
}

function setWallpaper(imageUrl) {
    document.body.style.backgroundImage = `url(${imageUrl})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    localStorage.setItem("wallpaper", imageUrl);
}
