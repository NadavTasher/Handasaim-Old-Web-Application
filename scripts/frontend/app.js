const DESKTOP_TIME_REFRESH_INTERVAL = 500;
const DESKTOP_SCHEDULE_REFRESH_INTERVAL = 60 * 5 * 1000;
const DESKTOP_SCROLL_INTERVAL = 20;
const DESKTOP_SCROLL_PAUSE_DURATION = 2 * 1000;
const MESSAGE_REFRESH_INTERVAL = 5 * 1000;
const GRADE_COOKIE = "grade";
const
    bottomColor = "#00827E",
    topColor = "#00649C";

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
        hide("ui");
        if (ORIENTATION === ORIENTATION_HORIZONTAL) {
            desktop_load();
        } else {
            mobile_load(schedule);
        }
    });

}

function glance(top) {
    get("top").innerText = top;
}

function messages_load(schedule) {
    // Set message overflow behaviour
    if (ORIENTATION === ORIENTATION_VERTICAL) {
        get("message").style.overflowY = "scroll";
    } else {
        get("message").style.overflowY = "hidden";
    }
    // Check for messages in schedule
    if (schedule.hasOwnProperty("messages")) {
        if (schedule.messages.length > 0) {
            // Sets an interval to switch messages every X(MessageRefreshInterval) seconds
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
    if (window.hasOwnProperty("android")) {
        window.android.colors(top, bottom);
    }
}

function grade_load(schedule, day, grade) {
    if (grade.hasOwnProperty("name") &&
        grade.hasOwnProperty("subjects")) {
        show("ui");
        glance(grade.name);
        switcher_close();
        sharables_load(schedule, grade);
        subjects_load(schedule.schedule, grade.subjects, "subjects", null);
        schedule_push_cookie(GRADE_COOKIE, grade.name);
    }
}

function grades_load(schedule) {
    clear("subjects");
    clear("grades");
    if (schedule.hasOwnProperty("schedule") &&
        schedule.hasOwnProperty("day") &&
        schedule.hasOwnProperty("grades")) {
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
        // Desktop only, add empty cell to grades and lesson number column
        if (ORIENTATION === ORIENTATION_HORIZONTAL) {
            get("grades").appendChild(make("div", make("p", null), ["padded", "coasted", "minimal"]));
            let column = make("div", null);
            for (let h = 0; h <= dayLength; h++) {
                column.appendChild(make("div", make("p", h.toString()), ["padded", "coasted", "minimal"]));
            }
            get("subjects").appendChild(column);
        }
        // Scan grades
        for (let c = 0; c < schedule.grades.length; c++) {
            let grade = schedule.grades[c];
            let name = make("div", make("p", grade.name), ["padded", "coasted", "minimal"]);
            if (grade.hasOwnProperty("subjects")) {
                if (ORIENTATION === ORIENTATION_HORIZONTAL) {
                    let current = make("div");
                    column(current);
                    subjects_load(schedule.schedule, grade.subjects, current, dayLength);
                    get("subjects").appendChild(current);
                } else {
                    name.onclick = () => {
                        grade_load(schedule, schedule.day, grade);
                    };
                }
            }
            get("grades").appendChild(name);
        }
    }
}

function export_grade(grade, separator = "\n") {
    if (grade.hasOwnProperty("name") &&
        grade.hasOwnProperty("subjects")) {
        let text = name + separator;
        for (let h = 0; h <= 15; h++) {
            if (grade.subjects.hasOwnProperty(h)) {
                let current = grade.subjects[h];
                if (current.hasOwnProperty("name")) {
                    text += "\u200F" + h + ". " + current.name + separator;
                }
            }
        }
        return text;
    }
    return "Invalid grade, oops.";
}

function sharables_load(schedule, grade, separator = "\n") {
    let complete = "";
    if (schedule.hasOwnProperty("grades")) {
        for (let g = 0; g < schedule.grades.length; g++) {
            let current = schedule.grades[g];
            if (current.hasOwnProperty("grade") && grade.hasOwnProperty("grade")) {
                if (current.grade === grade.grade) {
                    complete += export_grade(current, separator) + separator + separator;
                }
            }
        }
    }
    if (schedule.hasOwnProperty("messages")) {
        if (schedule.messages.length > 0) {
            complete += separator;
            for (let m = 0; m < schedule.messages.length; m++) {
                complete += "\u200F" + (m + 1) + ". " + schedule.messages[m] + separator;
            }
        }
    }
    get("share-single").onclick = messaging_share(export_grade(grade, separator));
    get("share-multiple").onclick = messaging_share(complete);
}

function messaging_share(text) {
    return () => {
        window.location = "whatsapp://send?text=" + encodeURIComponent(text);
    };
}

function teachers_text(subject) {
    let teachers = "";
    if (subject.hasOwnProperty("teachers")) {
        for (let t = 0; t < subject.teachers.length; t++) {
            let teacher = subject.teachers[t].split(" ")[0];
            if (teachers.length === 0) {
                teachers = teacher;
            } else {
                teachers += " · ";
                teachers += teacher;
            }
        }
    }
    return teachers;
}

function time_text(schedule, hour) {
    if (schedule.length > hour)
        return schedule_time(schedule[hour]) + " - " + schedule_time(schedule[hour] + 45);

    return "";
}

function subjects_load(schedule, subjects, v, dayLength = null) {
    let minimal = dayLength !== null;
    let scan = (!minimal) ? 15 : dayLength;
    clear(v);
    for (let h = 0; h <= scan; h++) {
        let subject;
        if (subjects.hasOwnProperty(h)) {
            let current = subjects[h];
            if (minimal) {
                subject = make("div", null, ["padded", "coasted", "minimal"]);
                subject.appendChild(make("p", "\u200F" + current.name));
            } else {
                subject = make("div", null, ["padded", "coasted", "maximal"]);
                let bottom = make("div");
                hide(bottom);
                row(bottom);
                bottom.appendChild(make("p", teachers_text(current)));
                bottom.appendChild(make("p", time_text(schedule, h)));
                subject.appendChild(make("p", "\u200F" + h.toString() + ". " + current.name));
                subject.appendChild(bottom);
                subject.onclick = () => {
                    if (!visible(bottom)) {
                        show(bottom);
                    } else {
                        hide(bottom);
                    }
                };
            }
        } else if (minimal) {
            // Add an empty square to make the grid complete.
            subject = make("div", null, ["padded", "minimal"]);
        }
        if (subjects.hasOwnProperty(h) || minimal)
            get(v).appendChild(subject);
    }
}

function desktop_load() {

    get("grades").setAttribute("mobile", false);

    row("subjects");
    get("subjects").setAttribute("mobile", false);

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
        glance(now.getHours() + ":" + ((now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes()));
    };
    setInterval(update, DESKTOP_TIME_REFRESH_INTERVAL);
    setInterval(load, DESKTOP_SCHEDULE_REFRESH_INTERVAL);
    update();
}

function mobile_load(schedule) {

    get("grades").setAttribute("mobile", true);

    column("subjects");
    get("subjects").setAttribute("mobile", true);

    if (schedule_has_cookie(GRADE_COOKIE)) {
        if (schedule.hasOwnProperty("schedule") && schedule.hasOwnProperty("day") && schedule.hasOwnProperty("grades")) {
            let name = schedule_pull_cookie(GRADE_COOKIE);
            for (let g = 0; g < schedule.grades.length; g++) {
                if (schedule.grades[g].hasOwnProperty("name") && schedule.grades[g].hasOwnProperty("subjects")) {
                    if (schedule.grades[g].name === name) grade_load(schedule, schedule.day, schedule.grades[g]);
                }
            }
        }
    } else {
        hide("glance");
        let tutorial = make("p", "Select a class from above");
        tutorial.style.height = "100%";
        tutorial.style.fontSize = "10vh";
        tutorial.style.color = "#FFFFFF";
        get("subjects").appendChild(tutorial);
    }
}

function switcher_open() {
    show("grades");
    get("subjects").style.height = "0";
}

function switcher_close() {
    show("glance");
    hide("grades");
    get("subjects").style.height = "100%";
}