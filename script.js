
const taskList = document.getElementById("taskList");

const modalOverlay = document.getElementById("modalOverlay");

const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelModalBtn = document.getElementById("cancelModal");
const emptyAddBtn = document.getElementById("emptyAddBtn");

const taskForm = document.getElementById("taskForm");

const taskInput = document.getElementById("taskInput");
const taskDescription = document.getElementById("taskDescription");
const priorityInput = document.getElementById("priorityInput");
const categoryInput = document.getElementById("categoryInput");
const dueDateInput = document.getElementById("dueDate");
const editTaskId = document.getElementById("editTaskId");

const modalTitle = document.getElementById("modalTitle");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const toast = document.getElementById("toast");

let tasks = JSON.parse(
    localStorage.getItem("taskflow_tasks")
) || [];

let currentFilter = "all";


/* =========================
   INITIALIZATION
========================= */

document.addEventListener("DOMContentLoaded", () => {

    displayDate();

    renderTasks();

    updateStats();

    loadTheme();

});


/* =========================
   DATE
========================= */

function displayDate() {

    const dateElement =
        document.getElementById("currentDate");

    const today = new Date();

    dateElement.textContent =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );
}


/* =========================
   MODAL
========================= */

function openModal(task = null) {

    modalOverlay.classList.add("show");

    if (task) {

        modalTitle.textContent = "Edit Task";

        editTaskId.value = task.id;

        taskInput.value = task.title;

        taskDescription.value =
            task.description || "";

        priorityInput.value =
            task.priority;

        categoryInput.value =
            task.category;

        dueDateInput.value =
            task.dueDate || "";

    } else {

        modalTitle.textContent = "Create Task";

        taskForm.reset();

        editTaskId.value = "";

        priorityInput.value = "medium";

    }

    setTimeout(() => {

        taskInput.focus();

    }, 100);
}


function closeModal() {

    modalOverlay.classList.remove("show");

    taskForm.reset();

    editTaskId.value = "";

    modalTitle.textContent = "Create Task";
}


openModalBtn.addEventListener(
    "click",
    () => openModal()
);

emptyAddBtn.addEventListener(
    "click",
    () => openModal()
);

closeModalBtn.addEventListener(
    "click",
    closeModal
);

cancelModalBtn.addEventListener(
    "click",
    closeModal
);


modalOverlay.addEventListener(
    "click",
    event => {

        if (event.target === modalOverlay) {

            closeModal();

        }

    }
);


/* =========================
   ADD / EDIT TASK
========================= */

taskForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const title =
            taskInput.value.trim();

        if (!title) {

            showToast("Please enter a task title.");

            return;

        }

        const existingId =
            editTaskId.value;

        if (existingId) {

            const task =
                tasks.find(
                    item =>
                        item.id === existingId
                );

            if (task) {

                task.title = title;

                task.description =
                    taskDescription.value.trim();

                task.priority =
                    priorityInput.value;

                task.category =
                    categoryInput.value;

                task.dueDate =
                    dueDateInput.value;

            }

            showToast("Task updated successfully!");

        } else {

            const newTask = {

                id:
                    Date.now().toString(),

                title,

                description:
                    taskDescription.value.trim(),

                priority:
                    priorityInput.value,

                category:
                    categoryInput.value,

                dueDate:
                    dueDateInput.value,

                completed: false,

                createdAt:
                    new Date().toISOString()

            };

            tasks.unshift(newTask);

            showToast("Task created successfully!");

        }

        saveTasks();

        renderTasks();

        updateStats();

        closeModal();

    }
);


/* =========================
   RENDER TASKS
========================= */

function renderTasks() {

    let filtered =
        getFilteredTasks();

    filtered =
        applySearch(filtered);

    filtered =
        applySort(filtered);


    if (filtered.length === 0) {

        showEmptyState();

        return;

    }

    taskList.innerHTML = "";

    filtered.forEach(task => {

        const element =
            createTaskElement(task);

        taskList.appendChild(element);

    });

}


/* =========================
   FILTER
========================= */

function getFilteredTasks() {

    switch (currentFilter) {

        case "active":

            return tasks.filter(
                task => !task.completed
            );

        case "completed":

            return tasks.filter(
                task => task.completed
            );

        case "high":

            return tasks.filter(
                task =>
                    task.priority === "high"
            );

        default:

            return [...tasks];

    }

}


/* =========================
   SEARCH
========================= */

function applySearch(taskArray) {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!search) {

        return taskArray;

    }

    return taskArray.filter(task =>

        task.title
            .toLowerCase()
            .includes(search)

        ||

        task.description
            .toLowerCase()
            .includes(search)

        ||

        task.category
            .toLowerCase()
            .includes(search)

    );

}


/* =========================
   SORT
========================= */

function applySort(taskArray) {

    const sorted =
        [...taskArray];

    switch (sortSelect.value) {

        case "oldest":

            return sorted.sort(
                (a, b) =>
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
            );

        case "priority":

            const weight = {
                high: 3,
                medium: 2,
                low: 1
            };

            return sorted.sort(
                (a, b) =>
                    weight[b.priority] -
                    weight[a.priority]
            );

        case "due":

            return sorted.sort(
                (a, b) => {

                    if (!a.dueDate) return 1;

                    if (!b.dueDate) return -1;

                    return new Date(a.dueDate) -
                        new Date(b.dueDate);

                }
            );

        default:

            return sorted.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

    }

}


/* =========================
   CREATE TASK ELEMENT
========================= */

function createTaskElement(task) {

    const element =
        document.createElement("div");

    element.className =
        `task-item ${
            task.completed
                ? "completed"
                : ""
        }`;

    const dueInfo =
        getDueInfo(task.dueDate);

    element.innerHTML = `

        <button
            class="check"
            aria-label="Complete task"
        ></button>

        <div class="task-info">

            <div class="task-title">
                ${escapeHTML(task.title)}
            </div>

            ${
                task.description
                    ?
                `<div class="task-description">
                    ${escapeHTML(task.description)}
                </div>`
                    :
                ""
            }

            <div class="task-meta">

                <span class="badge ${task.priority}">
                    ${capitalize(task.priority)}
                </span>

                <span class="badge category">
                    ${escapeHTML(task.category)}
                </span>

                ${
                    task.dueDate
                    ?
                    `<span class="due ${
                        dueInfo.overdue
                            ? "overdue"
                            : ""
                    }">
                        📅 ${dueInfo.text}
                    </span>`
                    :
                    ""
                }

            </div>

        </div>

        <div class="task-actions">

            <button
                class="action-btn edit"
                title="Edit task"
            >
                ✎
            </button>

            <button
                class="action-btn delete"
                title="Delete task"
            >
                ×
            </button>

        </div>

    `;


    /* Complete */

    element
        .querySelector(".check")
        .addEventListener(
            "click",
            () => toggleTask(task.id)
        );


    /* Edit */

    element
        .querySelector(".edit")
        .addEventListener(
            "click",
            () => openModal(task)
        );


    /* Delete */

    element
        .querySelector(".delete")
        .addEventListener(
            "click",
            () => deleteTask(task.id)
        );


    return element;
}


/* =========================
   TOGGLE TASK
========================= */

function toggleTask(id) {

    const task =
        tasks.find(
            item => item.id === id
        );

    if (!task) return;

    task.completed =
        !task.completed;

    saveTasks();

    renderTasks();

    updateStats();

    showToast(
        task.completed
            ? "Task completed! 🎉"
            : "Task marked active."
    );

}


/* =========================
   DELETE TASK
========================= */

function deleteTask(id) {

    const task =
        tasks.find(
            item => item.id === id
        );

    tasks =
        tasks.filter(
            item => item.id !== id
        );

    saveTasks();

    renderTasks();

    updateStats();

    showToast(
        `"${task?.title || "Task"}" deleted`
    );

}


/* =========================
   STATISTICS
========================= */

function updateStats() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task => task.completed
        ).length;

    const active =
        total - completed;

    const high =
        tasks.filter(
            task =>
                task.priority === "high" &&
                !task.completed
        ).length;


    document.getElementById(
        "totalTasks"
    ).textContent = total;

    document.getElementById(
        "activeTasks"
    ).textContent = active;

    document.getElementById(
        "completedTasks"
    ).textContent = completed;

    document.getElementById(
        "highTasks"
    ).textContent = high;


    document.getElementById(
        "navAll"
    ).textContent = total;

    document.getElementById(
        "navActive"
    ).textContent = active;

    document.getElementById(
        "navCompleted"
    ).textContent = completed;

    document.getElementById(
        "navHigh"
    ).textContent = high;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );

    document.getElementById(
        "progressPercent"
    ).textContent =
        `${percentage}%`;

    document.getElementById(
        "progressFill"
    ).style.width =
        `${percentage}%`;

}


/* =========================
   NAVIGATION
========================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".nav-item")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                currentFilter =
                    button.dataset.filter;

                updateTaskHeading();

                renderTasks();

            }
        );

    });


function updateTaskHeading() {

    const title =
        document.getElementById(
            "taskTitle"
        );

    const subtitle =
        document.getElementById(
            "taskSubtitle"
        );

    const headings = {

        all: [
            "All Tasks",
            "Everything you need to get done"
        ],

        active: [
            "Active Tasks",
            "Tasks that still need your attention"
        ],

        completed: [
            "Completed Tasks",
            "Things you've already accomplished"
        ],

        high: [
            "High Priority",
            "Important tasks that need attention"
        ]

    };

    title.textContent =
        headings[currentFilter][0];

    subtitle.textContent =
        headings[currentFilter][1];

}


/* =========================
   SEARCH / SORT
========================= */

searchInput.addEventListener(
    "input",
    renderTasks
);

sortSelect.addEventListener(
    "change",
    renderTasks
);


/* =========================
   EMPTY STATE
========================= */

function showEmptyState() {

    let title = "No tasks yet";

    let message =
        "Add your first task and start being productive.";

    if (searchInput.value.trim()) {

        title = "No matching tasks";

        message =
            "Try searching for something else.";

    } else if (currentFilter === "completed") {

        title = "Nothing completed";

        message =
            "Complete a task and it will appear here.";

    } else if (currentFilter === "active") {

        title = "All caught up!";

        message =
            "You don't have any active tasks.";

    } else if (currentFilter === "high") {

        title = "No high priority tasks";

        message =
            "You're all clear for now.";

    }


    taskList.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">✓</div>

            <h3>${title}</h3>

            <p>${message}</p>

            ${
                currentFilter === "all" &&
                !searchInput.value
                ?
                `<button id="dynamicAdd">
                    + Create your first task
                </button>`
                :
                ""
            }

        </div>
    `;


    const dynamicAdd =
        document.getElementById(
            "dynamicAdd"
        );

    if (dynamicAdd) {

        dynamicAdd.addEventListener(
            "click",
            () => openModal()
        );

    }

}


/* =========================
   DUE DATE
========================= */

function getDueInfo(dateString) {

    if (!dateString) {

        return {
            text: "",
            overdue: false
        };

    }

    const due =
        new Date(
            `${dateString}T23:59:59`
        );

    const today =
        new Date();

    const todayOnly =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

    const overdue =
        due < todayOnly;

    return {

        text:
            due.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            ),

        overdue

    };

}


/* =========================
   THEME
========================= */

themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );

        const light =
            document.body.classList.contains(
                "light"
            );

        localStorage.setItem(
            "taskflow_theme",
            light
                ? "light"
                : "dark"
        );

        themeIcon.textContent =
            light
                ? "☀"
                : "☾";

    }
);


function loadTheme() {

    const saved =
        localStorage.getItem(
            "taskflow_theme"
        );

    if (saved === "light") {

        document.body.classList.add(
            "light"
        );

        themeIcon.textContent = "☀";

    }

}


/* =========================
   LOCAL STORAGE
========================= */

function saveTasks() {

    localStorage.setItem(
        "taskflow_tasks",
        JSON.stringify(tasks)
    );

}


/* =========================
   TOAST
========================= */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(
        () => {
            toast.classList.remove("show");
        },
        1800
    );

}


/* =========================
   HELPERS
========================= */

function capitalize(value) {

    return value.charAt(0).toUpperCase()
        + value.slice(1);

}


function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
