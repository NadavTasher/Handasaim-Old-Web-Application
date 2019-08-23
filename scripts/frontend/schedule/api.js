const SCHEDULE_ENDPOINTS = [
    "files/schedule.json",
    "https://raw.githubusercontent.com/HWBB/LastResort/master/files/schedule.json"
];

const SCHEDULE_DAYS = [
    "יום כלשהו",
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת"
];

function schedule_load(callback) {
    fetch(SCHEDULE_ENDPOINTS[0], {
        method: "get"
    }).then(response => {
        response.text().then((result) => {
            callback(JSON.parse(result));
        });
    });
}

function schedule_time(minute) {
    const minutes = minute % 60;
    let time = "";
    time += (minute - minutes) / 60;
    time += ":";
    time += (minutes < 10) ? "0" : "";
    time += minutes;
    return time;
}

function schedule_day(day) {
    if (day < SCHEDULE_DAYS.length)
        return SCHEDULE_DAYS[day];
}

function schedule_has_cookie(name) {
    return schedule_pull_cookie(name) !== null;
}

function schedule_pull_cookie(name) {
    name += "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
            return decodeURIComponent(cookie.substring(name.length, cookie.length));
        }
    }
    return null;
}

function schedule_push_cookie(name, value) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + date.toUTCString() + ";domain=" + window.location.hostname + ";path=/";
}