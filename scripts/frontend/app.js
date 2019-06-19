const CROSSPLATFORM_MESSAGE_REFRESH_INTERVAL = 5 * 1000;
const DESKTOP_TIME_REFRESH_INTERVAL = 500;
const DESKTOP_SCHEDULE_REFRESH_INTERVAL = 60 * 5 * 1000;
const DESKTOP_SCROLL_INTERVAL = 20;
const DESKTOP_SCROLL_PAUSE_DURATION = 2 * 1000;
const MOBILE_SETTINGS_COOKIE = "settings";
const MOBILE_CLASS_COOKIE = "class";
const
    bottomColor = "#00827E",
    topColor = "#00649C";

let messageInterval;
let desktopScrollDirection = true, desktopScrollPaused = false;

function load() {
    crossplatform_background_load(topColor, bottomColor);
    if (screen.width > screen.height) {
        desktop_load();
    } else {
        mobile_load();
    }
}

function crossplatform_background_load(top, bottom) {
    document.body.style.backgroundImage = "linear-gradient(to bottom," + top + ", " + bottom + ")";
    document.body.style.backgroundColor = top;
}

function crossplatform_messages_load(schedule, v) {
    let view = get(v);
    if (schedule.hasOwnProperty("messages")) {
        if (schedule.messages.length > 0) {
            let index = 0;
            let next = () => {
                if (schedule.messages.length > 0) {
                    view.innerText = schedule.messages[index];
                    if (index < schedule.messages.length - 1) {
                        index++;
                    } else {
                        index = 0;
                    }
                }
            };
            next();
            clearInterval(messageInterval);
            messageInterval = setInterval(next, CROSSPLATFORM_MESSAGE_REFRESH_INTERVAL);
            show(view);
        } else {
            hide(view);
        }
    } else {
        hide(view);
    }
}

function desktop_grades_load(schedule) {
    clear("desktop-schedule-subjects");
    clear("desktop-schedule-grades");
    if (schedule.hasOwnProperty("grades")) {
        let dayLength = 0;
        for (let c = 0; c < schedule.grades.length; c++) {
            let grade = schedule.grades[c];
            if (grade.hasOwnProperty("subjects")) {
                for (let h = 0; h < 15; h++) {
                    if (h > dayLength && grade.subjects.hasOwnProperty(h.toString())) {
                        dayLength = h;
                    }
                }
            }
        }
        get("desktop-schedule-grades").appendChild(document.createElement("p"));
        let column = document.createElement("div");
        for (let h = 0; h <= dayLength; h++) {
            let time = document.createElement("p");
            time.innerText = h.toString();
            column.appendChild(time);
        }
        get("desktop-schedule-subjects").appendChild(column);
        for (let c = 0; c < schedule.grades.length; c++) {
            let grade = schedule.grades[c];
            let column = document.createElement("div");
            let name = document.createElement("p");
            name.innerText = grade.name;
            get("desktop-schedule-grades").appendChild(name);
            if (grade.hasOwnProperty("subjects")) {
                for (let h = 0; h <= dayLength; h++) {
                    let name = document.createElement("p");
                    if (grade.subjects.hasOwnProperty(h)) {
                        if (grade.subjects[h].hasOwnProperty("name")) {
                            name.innerText = grade.subjects[h.toString()].name;
                        }
                    }
                    if (name.innerText.length === 0) name.style.backgroundColor = "transparent";
                    column.appendChild(name);
                }
            }
            get("desktop-schedule-subjects").appendChild(column);
        }
    }
}

function desktop_load() {
    view("desktop");
    // Scroll load
    setInterval(() => {
        if (!desktopScrollPaused) {
            let previousTop = get("desktop-schedule-subjects").scrollTop;
            get("desktop-schedule-subjects").scrollBy(0, desktopScrollDirection ? 1 : -10);
            if (get("desktop-schedule-subjects").scrollTop === previousTop) {
                desktopScrollPaused = true;
                setTimeout(() => {
                    desktopScrollPaused = false;
                    desktopScrollDirection = !desktopScrollDirection;
                }, DESKTOP_SCROLL_PAUSE_DURATION);
            }
        }
    }, DESKTOP_SCROLL_INTERVAL);
    let timeFunction = () => {
        let now = new Date();
        get("desktop-dashboard-date-time-time").innerText = now.getHours() + ":" + ((now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes());
        get("desktop-dashboard-date-time-date").innerText = now.getDate() + "." + (now.getMonth() + 1) + "." + now.getFullYear();
    };
    let loadFunction = () => {
        schedule_load((schedule) => {
            // Message load
            crossplatform_messages_load(schedule, get("desktop-dashboard-message"));
            desktop_grades_load(schedule);
        });
    };
    setInterval(timeFunction, DESKTOP_TIME_REFRESH_INTERVAL);
    setInterval(loadFunction, DESKTOP_SCHEDULE_REFRESH_INTERVAL);
    timeFunction();
    loadFunction();
}

function mobile_load() {
    view("mobile");
    mobile_schedule_load();
    schedule_load((schedule) => {
        crossplatform_messages_load(schedule, "mobile-schedule-dashboard-message");

        if (schedule.hasOwnProperty("grades")) {
            for (let c = 0; c < schedule.grades.length; c++) {
                let grade = schedule.grades[c];
                if (grade.hasOwnProperty("grade")) {
                    if (grade.hasOwnProperty("name")) {
                        let button = document.createElement("button");
                        button.onclick = () => {
                            gestures();
                            mobile_grade_load(schedule, grade.name);
                            slide("mobile-switcher", false, false, () => {
                                view("mobile-schedule");
                                slide("mobile-schedule", true, true, mobile_schedule_load);
                            });
                        };
                        button.innerHTML = grade.name;
                        get("mobile-switcher-grade-" + grade.grade).appendChild(button);
                    }
                }
            }
        }

        if (schedule_has_cookie(MOBILE_CLASS_COOKIE)) {
            mobile_grade_load(schedule, decodeURIComponent(schedule_pull_cookie(MOBILE_CLASS_COOKIE)));
        } else {
            let instructions = document.createElement("p");
            instructions.innerText = "Hi there!\nTo choose your class, swipe right.\nFor settings, swipe left.";
            get("mobile-schedule-subjects").appendChild(instructions);
        }
    });
}

function mobile_schedule_load() {
    view("mobile-schedule");
    gestures(null, null, mobile_settings_load, mobile_switcher_load);
}

function mobile_settings_load() {
    gestures();
    slide("mobile-schedule", false, false, () => {
        view("mobile-settings");
        slide("mobile-settings", true, true, () => {
            gestures(null, null, null, () => {
                gestures();
                slide("mobile-settings", false, true, () => {
                    view("mobile-schedule");
                    slide("mobile-schedule", true, false, mobile_schedule_load);
                });
            });
        });
    });
}

function mobile_switcher_load() {
    gestures();
    slide("mobile-schedule", false, true, () => {
        view("mobile-switcher");
        slide("mobile-switcher", true, false, () => {
            gestures(null, null, () => {
                gestures();
                slide("mobile-switcher", false, false, () => {
                    view("mobile-schedule");
                    slide("mobile-schedule", true, true, mobile_schedule_load);
                });
            }, null);
        });
    });
}

function mobile_grade_load(schedule, name) {
    schedule_push_cookie(MOBILE_CLASS_COOKIE, encodeURIComponent(name));
    get("mobile-schedule-dashboard-grade").innerText = name;
    let subjects = get("mobile-schedule-subjects");
    clear(subjects);
    if (schedule.hasOwnProperty("grades")) {
        for (let c = 0; c < schedule.grades.length; c++) {
            if (schedule.grades[c].name === name) {
                let grade = schedule.grades[c];
                if (grade.hasOwnProperty("subjects")) {
                    for (let h = 0; h <= 15; h++) {
                        if (grade.subjects.hasOwnProperty(h.toString())) {
                            let subject = grade.subjects[h.toString()];
                            if (subject.hasOwnProperty("name")) {
                                if (subject.name.length > 0) {
                                    let view = document.createElement("div");
                                    let top = document.createElement("p");
                                    let bottom = document.createElement("div");
                                    let time = document.createElement("p");
                                    let teachers = document.createElement("p");
                                    if (subject.hasOwnProperty("teachers")) {
                                        for (let t = 0; t < subject.teachers.length; t++) {
                                            let teacher = subject.teachers[t].split(" ")[0];
                                            if (teachers.innerText.length === 0) {
                                                teachers.innerText = teacher;
                                            } else {
                                                teachers.innerText += " · ";
                                                teachers.innerText += teacher;
                                            }
                                        }
                                    }
                                    top.innerHTML = "\u200F" + h + ". " + subject.name;
                                    if (schedule.hasOwnProperty("schedule")) {
                                        if (schedule.schedule.length > h)
                                            time.innerHTML = schedule_minute_to_time(schedule.schedule[h]) + " - " + schedule_minute_to_time(schedule.schedule[h] + 45);
                                    }
                                    hide(bottom);
                                    view.onclick = () => {
                                        if (!visible(bottom)) {
                                            show(bottom);
                                        } else {
                                            hide(bottom);
                                        }
                                    };
                                    bottom.appendChild(teachers);
                                    bottom.appendChild(time);
                                    view.appendChild(top);
                                    view.appendChild(bottom);
                                    subjects.appendChild(view);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}