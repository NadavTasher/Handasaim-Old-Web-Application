const DESKTOP_SCROLL_INTERVAL = 7000;
const MESSAGE_REFRESH_INTERVAL = 5 * 1000;
const MILLISECONDS_TO_RELOAD = 60 * 1000 * 20;
const GRADE_COOKIE = "grade";
const
    bottomColor = "#00827E",
    topColor = "#00649C";

const ORIENTATION = screen.width > screen.height;
const ORIENTATION_HORIZONTAL = true;
const ORIENTATION_VERTICAL = false;

function load() {
    view("home");
    background_load(topColor, bottomColor);
    schedule_load((schedule) => {
        messages_load(schedule);
        grades_load(schedule, null);
        hide("ui");
        if (ORIENTATION === ORIENTATION_HORIZONTAL) {
            desktop_load(schedule);
        } else {
            mobile_load(schedule);
        }
    });

}

function glance(top, bottom) {
    get("top").innerText = top;
    get("bottom").innerText = bottom;
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
            setInterval(next, MESSAGE_REFRESH_INTERVAL);
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
        glance(grade.name, schedule_day(schedule.day));
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
                    complete += current.name;
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
    get("share-single").onclick = messaging_share(grade.name + export_grade(grade, separator));
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

function desktop_load(schedule) {

    get("grades").setAttribute("mobile", false);

    row("subjects");
    get("subjects").setAttribute("mobile", false);

    // Scroll load
    let scrollable = get("subjects");
    let height = parseInt(getComputedStyle(scrollable).height);
    let min = 0;
    let max = scrollable.scrollHeight - height;
    let desktopScrollDirection = true, desktopScrollPaused = false;
    let targetScroll = scrollable.scrollTop;
    setInterval(() => {
        if (!desktopScrollPaused) {
            if (targetScroll >= max ||
                targetScroll <= min)
                desktopScrollDirection = !(targetScroll >= max);
            let toAdd = (desktopScrollDirection ? 1 : -1) * height;
            targetScroll += toAdd;
            scrollable.scrollBy(0, toAdd);
        }
    }, DESKTOP_SCROLL_INTERVAL);
    setInterval(() => {
        let now = new Date();
        glance(now.getHours() + ":" + ((now.getMinutes() < 10) ? "0" + now.getMinutes() : now.getMinutes()), "");
    }, 10000);
    setTimeout(() => window.location.reload(true), MILLISECONDS_TO_RELOAD);
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
        hide("dashboard");
        hide("grades");
        let tutorial = make("div");
        let icon = make("img");
        let text1 = make("p", "Welcome!");
        let text2 = make("p", "This is the official schedule app for Handasaim High, Herzliya.");
        let button = make("button", "Let's begin, shall we?");
        tutorial.style.height = "100%";
        text1.style.fontSize = "8vh";
        text1.style.color = "#FFFFFF";
        text1.style.direction = "ltr";
        text1.style.margin = "2vh 0";
        text2.style.fontSize = "4vh";
        text2.style.color = "#FFFFFF";
        text2.style.direction = "ltr";
        text2.style.margin = "2vh 0";
        icon.src = "resources/svg/icons/app/icon_transparent.svg";
        icon.style.maxHeight = "20vh";
        button.style.direction = "ltr";
        button.onclick = () =>
            transition(tutorial, OUT, () =>
                grade_load(schedule, schedule.day, schedule.grades[0]));
        tutorial.appendChild(icon);
        tutorial.appendChild(text1);
        tutorial.appendChild(text2);
        tutorial.appendChild(button);
        get("subjects").style.height = "100%";
        get("subjects").appendChild(tutorial);
        transition(tutorial, IN);
    }

    instruct();
}

function switcher_open() {
    show("grades");
    get("subjects").style.height = "0";
}

function switcher_close() {
    show("dashboard");
    hide("grades");
    get("subjects").style.height = "100%";
}