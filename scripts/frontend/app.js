const DESKTOP_TIME_REFRESH_INTERVAL = 500;
const DESKTOP_SCHEDULE_REFRESH_INTERVAL = 60 * 5 * 1000;
const DESKTOP_SCROLL_INTERVAL = 20;
const DESKTOP_SCROLL_PAUSE_DURATION = 2 * 1000;
const MESSAGE_REFRESH_INTERVAL = 5 * 1000;
const GRADE_COOKIE = "grade";
const
    bottomColor = "#00827E",
    topColor = "#00649C";

const SIZE = "8vh";

const TIGHT_X = {
    style: {
        maxWidth: SIZE,
        minWidth: SIZE,
        width: SIZE,
    }
};

const TIGHT_Y = {
    style: {
        maxHeight: SIZE,
        minHeight: SIZE,
        height: SIZE,
    }
};

const SUBJECT = {
    style: {
        backgroundColor: "#ddddee",
        borderRadius: "1vh",
        borderColor: "transparent",
        padding: "1vh",
        margin: "1vh"
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
            overflowX: "scroll"
        },
        column: true
    }
};

const DESKTOP = {
    grades: {
        style: {
            overflowX: "hidden",
            margin: "0"
        }
    },
    subjects: {
        style: {
            overflowX: "hidden"
        },
        row: true
    }
};

const ORIENTATION = screen.width > screen.height;
const ORIENTATION_HORIZONTAL = true;
const ORIENTATION_VERTICAL = false;

let messageInterval;

function load() {
    view("home");
    background_load(topColor, bottomColor);
    schedule_load((schedule) => {
        messages_load(schedule);
        grades_load(schedule, null);
        if (ORIENTATION === ORIENTATION_HORIZONTAL) {
            apply(DESKTOP);
            desktop_load();
        } else {
            apply(MOBILE);
            mobile_load(schedule);
        }
    });

}

function glance(top, bottom) {
    get("top").innerText = top;
    get("bottom").innerText = bottom;
}

function messages_load(schedule) {
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
            messageInterval = setInterval(next, MESSAGE_REFRESH_INTERVAL);
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

function grade_load(schedule, day, grade) {
    if (grade.hasOwnProperty("name") && grade.hasOwnProperty("subjects")) {
        schedule_push_cookie(GRADE_COOKIE, grade.name);
        glance(grade.name, schedule_day(day));
        subjects_load(schedule, grade.subjects, "subjects", null);
    }
}

function grades_load(schedule) {
    clear("subjects");
    clear("grades");
    if (schedule.hasOwnProperty("schedule")) {
        if (schedule.hasOwnProperty("day")) {
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
                    get("grades").appendChild(make("div", make("p", null), [TIGHT_X, TIGHT_Y, SUBJECT]));
                    let column = make("div", null);
                    for (let h = 0; h <= dayLength; h++) {
                        column.appendChild(make("div", make("p", h.toString()), [TIGHT_X, TIGHT_Y, SUBJECT]));
                    }
                    get("subjects").appendChild(column);
                }
                // Scan grades
                for (let c = 0; c < schedule.grades.length; c++) {
                    let grade = schedule.grades[c];
                    let name = make("div", make("p", grade.name), [TIGHT_X, TIGHT_Y, SUBJECT]);
                    if (grade.hasOwnProperty("subjects")) {
                        if (ORIENTATION === ORIENTATION_HORIZONTAL) {
                            let column = document.createElement("div");

                            apply({
                                style: {
                                    flexDirection: "column"
                                }
                            }, column);

                            subjects_load(schedule.schedule, grade.subjects, column, dayLength);

                            get("subjects").appendChild(column);
                        } else {
                            name.onclick = () => grade_load(schedule.schedule, schedule.day, grade);
                        }
                    }
                    get("grades").appendChild(name);
                }
            }
        }
    }
}

function subjects_load(schedule, subjects, v, dayLength = null) {
    let minimal = dayLength !== null;
    let scan = (!minimal) ? 15 : dayLength;
    clear(v);
    for (let h = 0; h <= scan; h++) {
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
                    apply(TIGHT_Y, top);
                    apply(TIGHT_Y, bottom);
                    apply({
                        style: {
                            alignSelf: "start", margin: "1vh"
                        }
                    }, top);
                    apply({
                        style: {
                            flexDirection: "row",
                            justifyContent: "space-evenly",
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
                        time.innerHTML = schedule_time(schedule[h]) + " - " + schedule_time(schedule[h] + 45);

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

function desktop_load() {
    // Scroll load
    let desktopScrollDirection = true, desktopScrollPaused = false;
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
    let update = () => {
        let now = new Date();
        glance(now.getHours() + ":" + ((now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes()), now.getDate() + "." + (now.getMonth() + 1) + "." + now.getFullYear());
    };
    setInterval(update, DESKTOP_TIME_REFRESH_INTERVAL);
    setInterval(load, DESKTOP_SCHEDULE_REFRESH_INTERVAL);
    update();
}

function mobile_load(schedule) {
    if (schedule_has_cookie(GRADE_COOKIE)) {
        if (schedule.hasOwnProperty("schedule") && schedule.hasOwnProperty("day") && schedule.hasOwnProperty("grades")) {
            let name = schedule_pull_cookie(GRADE_COOKIE);
            for (let g = 0; g < schedule.grades.length; g++) {
                if (schedule.grades[g].hasOwnProperty("name") && schedule.grades[g].hasOwnProperty("subjects")) {
                    if (schedule.grades[g].name === name) grade_load(schedule.schedule, schedule.day, schedule.grades[g]);
                }
            }
        }
    } else {
        get("subjects").appendChild(make("p", "Select your class with the bar above!"));
    }
}