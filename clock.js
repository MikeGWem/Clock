const twoPi = Math.PI * 2;
const fullTurn = -360;
var sizes = []; // width of numbers 0 to 59
var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"];
var years = []; // just for show
var dom = []; // days of month - 1st to 31st
var cvTime, cvSec, cvMins, cvHours, cvDay, cvDays, cvMonths, cvYears;
var clock = {
    font: "14px Arial",
    maxDrop: 0,
    dialColour: "#d2d2d2",
    timeColour: "rgba(255, 0, 0, 0.5)",
    lastMonth: -1,
    monthLen: 31,
    monthRad: null
};
function findPointOnCircle(originX, originY, radius, angleRadians) {
    let circX = radius * Math.cos(angleRadians) + originX;
    let circY = radius * Math.sin(angleRadians) + originY;
    return {x: circX, y: circY};
}
function setDays(){
    for(let i = 1; i < 32; i++){
        switch(i){
            case 1:
            case 21:
            case 31:
                dom.push(i+"st");
                break;
            case 2:
            case 22:
                dom.push(i+"nd");
                break;
            case 3:
            case 23:
                dom.push(i+"rd");
                break;
            default:
                dom.push(i+"th");
        }
    }
}
function setYears(year){
    years = [];
    for(let i = 0; i < 10; i++){
        years.push('' + year);
        year++;
    }
}
function measureDigits(){
    let max = {width: 0, height: 0};
    let cvs = document.createElement("canvas");
    let ctx = cvs.getContext("2d");
    ctx.font = clock.font;
    for(let i = 0; i < 60; i++){
        let tm = ctx.measureText(''+i);
        sizes.push(tm.width);
        if(tm.width > max.width){max.width = tm.width;}
        let height = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
        if(height > max.height){max.height = height;}
    }
    return max;
}
function measureText(text){
    let cvs = document.createElement("canvas");
    let ctx = cvs.getContext("2d");
    ctx.font = clock.font;
    let res = [];
    let width = 0;
    for(let i = 0; i < text.length; i++){
        let tm = ctx.measureText(text.charAt(i));
        res.push(tm.width);
        width += tm.width;
    }
    res.push(width);
    return res;
}
function measureDescender(text){
    let cvs = document.createElement("canvas");
    let ctx = cvs.getContext("2d");
    ctx.font = clock.font;
    let desc = 0;
    for(let i = 0; i < text.length; i++){
        let tm = ctx.measureText(text.charAt(i));
        desc = Math.max(desc, tm.actualBoundingBoxDescent);
    }
    return desc;
}
function setWheel(cvs, secRad, innerFill, nums, text, outside){
    let ctx = cvs.getContext("2d");
    let half = cvs.width / 2;
    if(outside){ // colour the dials and draw outside rim
        ctx.beginPath();
        ctx.arc(half, half, secRad.outer, 0, twoPi);
        ctx.fillStyle = clock.dialColour;
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.stroke();
        ctx.closePath();
    }
    ctx.beginPath();
    ctx.arc(half, half, secRad.inner, 0, twoPi);
    if(innerFill){ // fill the center
        ctx.fillStyle = innerFill;
        ctx.fill();
        ctx.fillStyle = "black";
    }
    ctx.stroke();
    ctx.closePath();
    let step =  twoPi / nums;
    let tick = nums === 60 ? 5 : 10; // longer for outer dials
    for(let i = 0, j = nums; i < j; i++){ // mark the tick marks around dial
        let angle = step * i - Math.PI / 2; // start at top not zero radians
        let pt = findPointOnCircle(half, half, secRad.inner, angle);
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        pt = findPointOnCircle(half, half, secRad.inner + tick, angle);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.font = clock.font;
    ctx.save();
    ctx.translate(half, half); // set the coordinate system to mid point
    if(text.length > 0){ // draw curved text around dial in each slot
        ctx.rotate(step/2);
        for(let i = 0; i < nums; i++){
            let clens = measureText(text[i]);
            let textArc = clens[clens.length-1] / (secRad.inner + clock.maxDrop);
            ctx.rotate(-textArc/2); // move back half the word length in radians
            for(let j = 0, k = text[i].length; j < k; j++){
                ctx.fillText(text[i].charAt(j), 0, -(secRad.inner + clock.maxDrop));
                ctx.rotate(clens[j] / (secRad.inner + clock.maxDrop)); // advance one char
            }
            ctx.rotate(step - textArc/2);
        }
    } else {
        ctx.rotate(step/2); // just write numbers in slots
        for(let i = 0, j = nums; i < j; i++){
            ctx.fillText('' + i, -sizes[i]/2, -(secRad.inner + clock.maxDrop));
            ctx.rotate(step);
        }
    }
    ctx.restore(); // restore coordinates and rotation
}
function numberOfDays(year, month) {
    var dte = new Date(year, month, 0);
    return dte.getDate();
}
function setMonth(secRad, step){
    let now = new Date();
    let year = now.getFullYear();
    clock.lastMonth = now.getMonth(); // months are 0 to 11
    clock.monthLen = numberOfDays(year, clock.lastMonth + 1); 
    if(!clock.monthRad){
        secRad.inner = secRad.outer;
        secRad.outer += step;
        clock.monthRad = {inner: secRad.inner, outer: secRad.outer};
        cvDays.width = cvDays.height = Math.round(clock.monthRad.outer / 2) * 4 + 4;
    }else {
        let ctx = cvDays.getContext("2d");
        ctx.clearRect(0,0,cvDays.width, cvDays.height); // ready to redraw the month dates
    }
    setWheel(cvDays, clock.monthRad, null, clock.monthLen, dom, false);
    setYears(year-1); // sets list of years from one before this
}
function sizeInnerWheel(secRad){
    let maxNum = measureDigits(); // decides dial size based upon font
    let circum = maxNum.width * 90; // the 90 and 1.7 are arbitrary
    secRad.inner = Math.ceil(circum / (twoPi));
    secRad.outer = Math.ceil(secRad.inner + maxNum.height * 1.7);
}
function markTime(cvs, secRad, mid) {
    let ctx = cvs.getContext("2d");
    cvs.width = 3;
    cvs.height = secRad.outer;
    ctx.beginPath();
    ctx.strokeStyle = clock.timeColour;
    ctx.moveTo(1, 0);
    ctx.lineTo(1, secRad.outer);
    ctx.stroke();
    ctx.closePath();
    cvs.style.top = '0px';
    cvs.style.left = (mid - 1) + 'px';
}
function runTime() {
    let now = new Date();
    let secs = now.getSeconds() + now.getMilliseconds() / 1000;
    let mins = now.getMinutes() + secs / 60;
    let hrs = now.getHours() + mins/60;
    let day = now.getDay() + hrs / 24;
    let monthDay = (now.getDate() - 1) + hrs / 24;
    let month = now.getMonth();
    if(month !== clock.lastMonth){
        setMonth(clock.monthRad, 0);
    }
    month += monthDay / clock.monthLen;
    let year = 1 + month / 12; // cos always second year on dial
    cvSec.style.transform = "rotate(" + (secs/60 * fullTurn) + "deg)";
    cvMins.style.transform = "rotate(" + (mins / 60 * fullTurn) + "deg)";
    cvHours.style.transform = "rotate(" + (hrs / 24 * fullTurn) + "deg)";
    cvDay.style.transform = "rotate(" + (day / 7 * fullTurn) + "deg)";
    cvDays.style.transform = "rotate(" + (monthDay / clock.monthLen * fullTurn) + "deg)";
    cvMonths.style.transform = "rotate(" + (month / 12 * fullTurn) + "deg)";
    cvYears.style.transform = "rotate(" + (year / 10 * fullTurn) + "deg)";
}
function positionWheels(secRad){
    let width = cvYears.width;
    cvMonths.style.top = cvMonths.style.left = (width - cvMonths.width)/2 + 'px';
    cvDays.style.top = cvDays.style.left = (width - cvDays.width)/2 + 'px';
    cvDay.style.top = cvDay.style.left = (width - cvDay.width)/2 + 'px';
    cvHours.style.top = cvHours.style.left = (width - cvHours.width)/2 + 'px';
    cvMins.style.top = cvMins.style.left = (width - cvMins.width)/2 + 'px';
    cvSec.style.top = cvSec.style.left = (width - cvSec.width)/2 + 'px';
    markTime(cvTime, secRad, width/2); // set the vertical current time marker
}
function linkToCanvas(){
    cvTime = document.getElementById("cvTime");
    cvSec = document.getElementById("cvSecs");
    cvMins = document.getElementById("cvMins");
    cvHours = document.getElementById("cvHours");
    cvDay = document.getElementById("cvDay");
    cvDays = document.getElementById("cvDays");
    cvMonths = document.getElementById("cvMonths");
    cvYears = document.getElementById("cvYears");
}
function setupWheels(){
    let secRad = {};
    sizeInnerWheel(secRad);
    cvSec.width = cvSec.height = Math.round(secRad.outer / 2) * 4 + 4;
    setWheel(cvSec, secRad, "white", 60, [], false);
    let step = secRad.outer - secRad.inner;
    secRad.inner = secRad.outer;
    secRad.outer += step;
    cvMins.width = cvMins.height = Math.round(secRad.outer / 2) * 4 + 4;
    setWheel(cvMins, secRad, null, 60, [], false); 
    secRad.inner = secRad.outer;
    secRad.outer += step;
    cvHours.width = cvHours.height = Math.round(secRad.outer / 2) * 4 + 4;
    setWheel(cvHours, secRad, null, 24, [], false);
    secRad.inner = secRad.outer;
    secRad.outer += step;
    cvDay.width = cvDay.height = Math.round(secRad.outer / 2) * 4 + 4;
    setWheel(cvDay, secRad, null, 7, days, false);
    setMonth(secRad, step);
    secRad.inner = secRad.outer;
    secRad.outer += step;
    cvMonths.width = cvMonths.height = Math.round(secRad.outer / 2) * 4 + 4;
    setWheel(cvMonths, secRad, null, 12, months, false);
    secRad.inner = secRad.outer;
    secRad.outer += step;
    cvYears.width = cvYears.height = Math.round(secRad.outer / 2) * 4 + 4;
    setWheel(cvYears, secRad, null, 10, years, true);
    positionWheels(secRad);
}
function initialise() {
    linkToCanvas();
    setDays();
    clock.maxDrop = measureDescender("gyqj"); // to position text
    setupWheels();
    setInterval(runTime, 50);
}
initialise();