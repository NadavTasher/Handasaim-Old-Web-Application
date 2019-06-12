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
                    view.innerText = schedule.messages[messageIndex];
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

function setupClassrooms() {
    function addSubject(column, subject) {
        if (subject.name.length > 0) {
            let subjectView = document.createElement("div");
            let name = document.createElement("p");
            // let teachers = document.createElement("p");
            //
            // for (let t = 0; t < subject.teachers.length; t++) {
            //     teachers.innerHTML += subject.teachers[t];
            // }

            name.innerText = subject.name;
            subjectView.appendChild(name);
            // subjectView.appendChild(teachers);
            column.appendChild(subjectView);
        }
    }

    function dayLength() {
        let maxLength = 0;
        for (let classroomIndex = 0; classroomIndex < schedule.classrooms.length; classroomIndex++) {
            let classroom = schedule.classrooms[classroomIndex];
            if (classroom.subjects.length > maxLength) maxLength = classroom.subjects.length;
        }
        return maxLength;
    }

    function setupTimes() {
        get("classname").appendChild(document.createElement("div"));
        let column = document.createElement("div");
        for (let h = 0; h < dayLength(); h++) {
            let timeHolder = document.createElement("div");
            let time = document.createElement("p");
            time.innerText = h;
            timeHolder.appendChild(time);
            column.appendChild(timeHolder);
        }
        get("subjects").appendChild(column);
    }

    clear("subjects");
    clear("classname");
    setupTimes();
    for (let classroomIndex = 0; classroomIndex < schedule.classrooms.length; classroomIndex++) {
        let classroom = schedule.classrooms[classroomIndex];
        let column = document.createElement("div");
        let nameHolder = document.createElement("div");
        let nameTitle = document.createElement("p");
        nameHolder.appendChild(nameTitle);
        nameTitle.innerText = classroom.name;
        get("classname").appendChild(nameHolder);
        for (let subjectIndex = 0; subjectIndex < classroom.subjects.length; subjectIndex++) {
            let subject = classroom.subjects[subjectIndex];
            addSubject(column, subject);
        }
        get("subjects").appendChild(column);
    }
}


function desktop_load() {
    // Scroll load
    setInterval(() => {
        if (!desktopScrollPaused) {
            let previousTop = get("subjects").scrollTop;
            get("subjects").scrollBy(0, desktopScrollDirection ? 1 : -10);
            if (get("subjects").scrollTop === previousTop) {
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
        get("desktop-dashboard-data-time-time").innerText = now.getHours() + ":" + ((now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes());
        get("desktop-dashboard-data-time-date").innerText = now.getDate() + "." + (now.getMonth() + 1) + "." + now.getFullYear();
    };
    let loadFunction = () => {
        schedule_load((schedule) => {
            // Message load
            crossplatform_messages_load(schedule);
            setupClassrooms();
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

        if (schedule.hasOwnProperty("classrooms")) {
            for (let c = 0; c < schedule.classrooms.length; c++) {
                let classroom = schedule.classrooms[c];
                if (classroom.hasOwnProperty("grade")) {
                    if (classroom.hasOwnProperty("name")) {
                        let button = document.createElement("button");
                        button.onclick = () => {
                            gestures();
                            mobile_switcher_classroom(schedule, classroom.name);
                            slide("mobile-switcher", false, false, () => {
                                view("mobile-schedule");
                                slide("mobile-schedule", true, true, mobile_schedule_load);
                            });
                        };
                        button.innerHTML = classroom.name;
                        get("mobile-switcher-grade-" + classroom.grade).appendChild(button);
                    }
                }
            }
        }

        if (schedule_has_cookie(MOBILE_CLASS_COOKIE)) {
            mobile_switcher_classroom(schedule, decodeURIComponent(schedule_pull_cookie(MOBILE_CLASS_COOKIE)));
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

function mobile_switcher_classroom(schedule, name) {
    console.log(name);
    schedule_push_cookie(MOBILE_CLASS_COOKIE, encodeURIComponent(name));
    get("mobile-schedule-dashboard-classname").innerText = name;
    let subjects = get("mobile-schedule-subjects");
    clear(subjects);
    if (schedule.hasOwnProperty("classrooms")) {
        for (let c = 0; c < schedule.classrooms.length; c++) {
            if (schedule.classrooms[c].name === name) {
                let classroom = schedule.classrooms[c];
                if (classroom.hasOwnProperty("subjects")) {
                    for (let s = 0; s < classroom.subjects.length; s++) {
                        let subject = classroom.subjects[s];
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
                                if (subject.hasOwnProperty("hour")) {
                                    top.innerHTML = "\u200F" + subject.hour + ". " + subject.name;
                                }
                                if (subject.hasOwnProperty("start") && subject.hasOwnProperty("end")) {
                                    time.innerHTML = schedule_minute_to_time(subject.start) + " - " + schedule_minute_to_time(subject.end);
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

// OLD MOBILE CODE