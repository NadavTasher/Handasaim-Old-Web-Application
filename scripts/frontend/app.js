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

const TIGHT_X = {
    style: {
        maxWidth: "8vh",
        minWidth: "8vh",
        width: "8vh",
        // overflow: "hidden"
    }
};

const TIGHT_Y = {
    style: {
        maxHeight: TIGHT_X.style.maxWidth,
        minHeight: TIGHT_X.style.minWidth,
        height: TIGHT_X.style.width,
        // overflow: "hidden"
    }
};

const SUBJECT = {
    style: {
        backgroundColor: "#ddddee",
        borderRadius: "1vh",
        borderColor: "transparent",
        // padding: "1vw"
    }
};

const MOBILE = {
    grades: {
        style: {
            overflowX: "scroll",
            margin: "1vh"
        }
    },
    subjects: {
        style: {
            flexDirection: "column"
        }
    }
};

const DESKTOP = {
    grades: {
        style: {
            overflowX: "hidden"
        }
    },
    subjects: {
        style: {
            flexDirection: "row"
        }
    }
};

const ORIENTATION = screen.width > screen.height;
const ORIENTATION_HORIZONTAL = true;
const ORIENTATION_VERTICAL = false;

let messageInterval;
let desktopScrollDirection = true, desktopScrollPaused = false;

function load() {
    view("home");
    background_load(topColor, bottomColor);
    schedule_load((schedule) => {
        messages(schedule);
        grades(schedule, null);
    });
    if (ORIENTATION === ORIENTATION_HORIZONTAL) {
        // desktop_load();
        apply(DESKTOP);
        desktop();
    } else {
        apply(MOBILE);
        // mobile();
    }

}

function glance(top, bottom) {
    get("top").innerText = top;
    get("bottom").innerText = bottom;
}

function messages(schedule) {
    if (schedule.hasOwnProperty("messages")) {
        if (schedule.messages.length > 0) {
            let index = 0;
            let next = () => {
                if (schedule.messages.length > 0) {
                    get("message").innerText = schedule.messages[index];
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
            show("message");
        } else {
            hide("message");
        }
    } else {
        hide("message");
    }
}

function background_load(top, bottom) {
    document.body.style.backgroundImage = "linear-gradient(to bottom," + top + ", " + bottom + ")";
    document.body.style.backgroundColor = top;
}

function make(what, content = null, configurations = null) {
    let thing = document.createElement(what);
    if (content !== null) {
        if (!isString(content)) {
            thing.appendChild(content);
        } else {
            thing.innerText = content;
        }
    }
    if (configurations !== null) {
        if (isArray(configurations)) {
            for (let c = 0; c < configurations.length; c++) {
                if (isObject(configurations[c]))
                    apply(configurations[c], thing);
            }
        }
    }
    return thing;
}

function grades(schedule) {
    clear("subjects");
    clear("grades");
    if (schedule.hasOwnProperty("schedule")) {
        if (schedule.hasOwnProperty("grades")) {
            // Figure out day's length
            let dayLength = 0;
            for (let c = 0; c < schedule.grades.length; c++) {
                let grade = schedule.grades[c];
                if (grade.hasOwnProperty("subjects")) {
                    for (let h = 0; h < 15; h++) {
                        if (h > dayLength && grade.subjects.hasOwnProperty(h)) {
                            dayLength = h;
                        }
                    }
                }
            }
            // Desktop only
            if (ORIENTATION === ORIENTATION_HORIZONTAL) {
                get("grades").appendChild(make("div", make("p", null, [TIGHT_X, TIGHT_Y, SUBJECT]), [TIGHT_X, TIGHT_Y, SUBJECT]));
                let column = make("div");
                for (let h = 0; h <= dayLength; h++) {
                    column.appendChild(make("p", h.toString(), [TIGHT_X, TIGHT_Y, SUBJECT]));
                }
                get("subjects").appendChild(column);
            }
            for (let c = 0; c < schedule.grades.length; c++) {
                let grade = schedule.grades[c];
                let name = make("div", make("p", grade.name, [TIGHT_X, TIGHT_Y, SUBJECT]), [TIGHT_X, TIGHT_Y, SUBJECT]);
                if (grade.hasOwnProperty("subjects")) {
                    if (ORIENTATION === ORIENTATION_HORIZONTAL) {
                        let column = document.createElement("div");

                        apply({
                            style: {
                                flexDirection: "column"
                            }
                        }, column);

                        apply(TIGHT_X, column);

                        subjects_load(schedule.schedule, grade.subjects, dayLength, column, true);

                        get("subjects").appendChild(column);
                    } else {
                        name.onclick = () => subjects_load(schedule.schedule, grade.subjects, dayLength, "subjects", false);
                    }
                }
                get("grades").appendChild(name);
            }
        }
    }
}

function subjects_load(schedule, subjects, dayLength, v, minimal = true) {
    clear(v);
    for (let h = 0; h <= dayLength; h++) {
        let subject = document.createElement("div");
        let top = document.createElement("p");
        apply(SUBJECT, subject);
        if (subjects.hasOwnProperty(h)) {
            let current = subjects[h];
            if (current.hasOwnProperty("name")) {
                top.innerText = "\u200F" + ((!minimal) ? h + ". " : "") + current.name;
            }
            subject.appendChild(top);
            if (!minimal) {
                if (current.hasOwnProperty("teachers")) {
                    let bottom = document.createElement("div");
                    let time = document.createElement("p");
                    let teachers = document.createElement("p");

                    apply({
                        style: {
                            flexDirection: "row",
                            direction: "ltr"
                        }
                    }, bottom);

                    for (let t = 0; t < current.teachers.length; t++) {
                        let teacher = current.teachers[t].split(" ")[0];
                        if (teachers.innerText.length === 0) {
                            teachers.innerText = teacher;
                        } else {
                            teachers.innerText += " · ";
                            teachers.innerText += teacher;
                        }
                    }

                    if (schedule.length > h)
                        time.innerHTML = schedule_minute_to_time(schedule[h]) + " - " + schedule_minute_to_time(schedule[h] + 45);

                    hide(bottom);

                    subject.onclick = () => {
                        if (!visible(bottom)) {
                            show(bottom);
                        } else {
                            hide(bottom);
                        }
                    };

                    bottom.appendChild(time);
                    bottom.appendChild(teachers);
                    subject.appendChild(bottom);
                }
            }
        } else if (minimal) {
            apply({
                style: {
                    backgroundColor: "transparent"
                }
            }, subject);
        }

        if (minimal) {
            apply(TIGHT_X, subject);
            apply(TIGHT_Y, subject);
        }

        if (subjects.hasOwnProperty(h) || minimal)
            get(v).appendChild(subject);

    }
}

// function desktop_grades_load(schedule) {
//     clear("desktop-schedule-subjects");
//     clear("desktop-schedule-grades");
//     if (schedule.hasOwnProperty("grades")) {
//         let dayLength = 0;
//         for (let c = 0; c < schedule.grades.length; c++) {
//             let grade = schedule.grades[c];
//             if (grade.hasOwnProperty("subjects")) {
//                 for (let h = 0; h < 15; h++) {
//                     if (h > dayLength && grade.subjects.hasOwnProperty(h.toString())) {
//                         dayLength = h;
//                     }
//                 }
//             }
//         }
//         get("desktop-schedule-grades").appendChild(document.createElement("p"));
//         let column = document.createElement("div");
//         for (let h = 0; h <= dayLength; h++) {
//             let time = document.createElement("p");
//             time.innerText = h.toString();
//             column.appendChild(time);
//         }
//         get("desktop-schedule-subjects").appendChild(column);
//         for (let c = 0; c < schedule.grades.length; c++) {
//             let grade = schedule.grades[c];
//             let column = document.createElement("div");
//             let name = document.createElement("p");
//             name.innerText = grade.name;
//             get("desktop-schedule-grades").appendChild(name);
//             if (grade.hasOwnProperty("subjects")) {
//                 for (let h = 0; h <= dayLength; h++) {
//                     let name = document.createElement("p");
//                     if (grade.subjects.hasOwnProperty(h)) {
//                         if (grade.subjects[h].hasOwnProperty("name")) {
//                             name.innerText = grade.subjects[h.toString()].name;
//                         }
//                     }
//                     if (name.innerText.length === 0) name.style.backgroundColor = "transparent";
//                     column.appendChild(name);
//                 }
//             }
//             get("desktop-schedule-subjects").appendChild(column);
//         }
//     }
// }

function desktop() {
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
    let time = () => {
        let now = new Date();
        glance(now.getHours() + ":" + ((now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes()), now.getDate() + "." + (now.getMonth() + 1) + "." + now.getFullYear());
    };
    setInterval(time, DESKTOP_TIME_REFRESH_INTERVAL);
    setInterval(load, DESKTOP_SCHEDULE_REFRESH_INTERVAL);
    time();
}

// function mobile_load() {
//     view("mobile");
//     mobile_schedule_load();
//     schedule_load((schedule) => {
//         crossplatform_messages_load(schedule, "mobile-schedule-dashboard-message");
//
//         if (schedule.hasOwnProperty("grades")) {
//             for (let c = 0; c < schedule.grades.length; c++) {
//                 let grade = schedule.grades[c];
//                 if (grade.hasOwnProperty("grade")) {
//                     if (grade.hasOwnProperty("name")) {
//                         let button = document.createElement("button");
//                         button.onclick = () => {
//                             gestures();
//                             mobile_grade_load(schedule, grade.name);
//                             slide("mobile-switcher", false, false, () => {
//                                 view("mobile-schedule");
//                                 slide("mobile-schedule", true, true, mobile_schedule_load);
//                             });
//                         };
//                         button.innerHTML = grade.name;
//                         get("mobile-switcher-grade-" + grade.grade).appendChild(button);
//                     }
//                 }
//             }
//         }
//
//         if (schedule_has_cookie(MOBILE_CLASS_COOKIE)) {
//             mobile_grade_load(schedule, decodeURIComponent(schedule_pull_cookie(MOBILE_CLASS_COOKIE)));
//         } else {
//             let instructions = document.createElement("p");
//             instructions.innerText = "Hi there!\nTo choose your class, swipe right.\nFor settings, swipe left.";
//             get("mobile-schedule-subjects").appendChild(instructions);
//         }
//     });
// }
//
// function mobile_schedule_load() {
//     view("mobile-schedule");
//     gestures(null, null, mobile_settings_load, mobile_switcher_load);
// }
//
// function mobile_settings_load() {
//     gestures();
//     slide("mobile-schedule", false, false, () => {
//         view("mobile-settings");
//         slide("mobile-settings", true, true, () => {
//             gestures(null, null, null, () => {
//                 gestures();
//                 slide("mobile-settings", false, true, () => {
//                     view("mobile-schedule");
//                     slide("mobile-schedule", true, false, mobile_schedule_load);
//                 });
//             });
//         });
//     });
// }
//
// function mobile_switcher_load() {
//     gestures();
//     slide("mobile-schedule", false, true, () => {
//         view("mobile-switcher");
//         slide("mobile-switcher", true, false, () => {
//             gestures(null, null, () => {
//                 gestures();
//                 slide("mobile-switcher", false, false, () => {
//                     view("mobile-schedule");
//                     slide("mobile-schedule", true, true, mobile_schedule_load);
//                 });
//             }, null);
//         });
//     });
// }
//
// function mobile_grade_load(schedule, name) {
//     schedule_push_cookie(MOBILE_CLASS_COOKIE, encodeURIComponent(name));
//     get("mobile-schedule-dashboard-grade").innerText = name;
//     let subjects = get("mobile-schedule-subjects");
//     clear(subjects);
//     if (schedule.hasOwnProperty("grades")) {
//         for (let c = 0; c < schedule.grades.length; c++) {
//             if (schedule.grades[c].name === name) {
//                 let grade = schedule.grades[c];
//                 if (grade.hasOwnProperty("subjects")) {
//                     for (let h = 0; h <= 15; h++) {
//                         if (grade.subjects.hasOwnProperty(h.toString())) {
//                             let subject = grade.subjects[h.toString()];
//                             if (subject.hasOwnProperty("name")) {
//                                 if (subject.name.length > 0) {
//                                     let view = document.createElement("div");
//                                     let top = document.createElement("p");
//                                     let bottom = document.createElement("div");
//                                     let time = document.createElement("p");
//                                     let teachers = document.createElement("p");
//                                     if (subject.hasOwnProperty("teachers")) {
//                                         for (let t = 0; t < subject.teachers.length; t++) {
//                                             let teacher = subject.teachers[t].split(" ")[0];
//                                             if (teachers.innerText.length === 0) {
//                                                 teachers.innerText = teacher;
//                                             } else {
//                                                 teachers.innerText += " · ";
//                                                 teachers.innerText += teacher;
//                                             }
//                                         }
//                                     }
//                                     top.innerHTML = "\u200F" + h + ". " + subject.name;
//                                     if (schedule.hasOwnProperty("schedule")) {
//                                         if (schedule.schedule.length > h)
//                                             time.innerHTML = schedule_minute_to_time(schedule.schedule[h]) + " - " + schedule_minute_to_time(schedule.schedule[h] + 45);
//                                     }
//                                     hide(bottom);
//                                     view.onclick = () => {
//                                         if (!visible(bottom)) {
//                                             show(bottom);
//                                         } else {
//                                             hide(bottom);
//                                         }
//                                     };
//                                     bottom.appendChild(teachers);
//                                     bottom.appendChild(time);
//                                     view.appendChild(top);
//                                     view.appendChild(bottom);
//                                     subjects.appendChild(view);
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }