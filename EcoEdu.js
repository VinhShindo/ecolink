// ==== DOM SELECTORS ====
const quizTimer = document.querySelector("#timer");
const quizSubmit = document.querySelector("#quiz_submit");
const quizPrev = document.querySelector("#quiz_prev");
const quizNext = document.querySelector("#quiz_next");
const quizCount = document.querySelector(".quiz_question h5");
const quizAnswers = document.querySelectorAll(".quiz_question ul li");
const quizQuestionList = document.querySelector(".quiz_numbers ul");
let quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
const quizAnswersItem = document.querySelectorAll(".quiz_answer_item");
const quizTitle = document.querySelector("#quiz_title");
const area = document.getElementById("trash-items");

let currentIndex = 0;
let listSubmit = [];
let listResults = [];
let isSubmit = false;
let countQuestion = 0;
let trashAssignment = {};
let quizScore = 0;
let dragScore = 0;
let multipleData;
let trashData;
let timer;
let remainingTime = 10 * 60;
let elapsedTime = 0;

// ==== Start Button ====
document.getElementById("start-button").addEventListener("click", () => {
    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("start-button");

    overlay.style.opacity = "0";
    startBtn.style.opacity = "0";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";

    setTimeout(() => {
        overlay.style.display = "none";
        startBtn.style.display = "none";
        overlay.style.removeProperty("opacity");
        startBtn.style.removeProperty("opacity");
    }, 600);
    startTimer();
});

// ==== Fetch Data ====
fetch("data.txt")
    .then(res => res.text())
    .then(data => {
        data = JSON.parse(data);
        multipleData = data["multipleChoice"];
        trashData = data["dragQuestion"];
        renderQuestion(multipleData);
        loadTrashItems();
        enableTouchSupport();
    })
    .catch(err => console.error('Error loading file:', err));

// ==== Multiple Choice Logic ====
function renderQuestion(data) {
    let html = "";
    data = data["quizz"];
    data.forEach((_, i) => {
        html += `<li>${i + 1}</li>`;
        countQuestion++;
    });
    quizQuestionList.innerHTML = html;
    quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
    quizQuestions[0].classList.add("active");

    quizCount.innerText = `Question ${currentIndex + 1} of ${data.length}`;
    quizTitle.innerText = data[currentIndex].question;
    quizAnswersItem.forEach((a, i) => {
        a.innerText = data[currentIndex].answers[i];
    });

    handleQuestionList();
    handleAnswer();
}

function renderCurrentQuestion(data) {
    data = data["quizz"];
    quizCount.innerText = `Question ${currentIndex + 1} of ${data.length}`;
    quizTitle.innerText = data[currentIndex].question;
    quizAnswersItem.forEach((a, i) => {
        a.innerText = data[currentIndex].answers[i];
    });
}

function handleQuestionList() {
    quizQuestions.forEach((item, index) => {
        item.addEventListener("click", () => {
            item.scrollIntoView({ behavior: "smooth", inline: "center" });
            quizQuestions.forEach(el => el.classList.remove("active"));
            item.classList.add("active");
            currentIndex = index;

            renderCurrentQuestion(multipleData);
            quizAnswers.forEach(el => el.classList.remove("active"));
            const selected = listSubmit[currentIndex];
            selected >= 0 && quizAnswers[selected].click();

            if (isSubmit) renderResults();
        });
    });
}

function handleAnswer() {
    quizAnswers.forEach((answer, index) => {
        answer.addEventListener("click", () => {
            if (isSubmit) return;
            quizAnswers.forEach(el => el.classList.remove("active"));
            answer.classList.add("active");
            quizQuestions[currentIndex].classList.add("selected");
            listSubmit[currentIndex] = index;
        });
    });
}

quizNext.addEventListener("click", () => navigateQuestion(1));
quizPrev.addEventListener("click", () => navigateQuestion(-1));

function navigateQuestion(offset) {
    currentIndex = (currentIndex + offset + countQuestion) % countQuestion;
    quizQuestions[currentIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
    quizQuestions.forEach(el => el.classList.remove("active"));
    quizQuestions[currentIndex].classList.add("active");

    renderCurrentQuestion(multipleData);
    quizAnswers.forEach(el => el.classList.remove("active"));

    const selected = listSubmit[currentIndex];
    selected >= 0 && quizAnswers[selected].click();
    if (isSubmit) renderResults();
}

function handleCheckResults(data) {
    quizScore = 0;
    data["quizz"].forEach((item, i) => {
        const correct = data["results"].find(r => String(r.quiz_id) === String(item.id)).answer;
        if (item.answers[listSubmit[i]] === correct) {
            listResults[i] = listSubmit[i];
            quizScore++;
        } else {
            quizQuestions[i].classList.add("incorrect");
            listResults[i] = item.answers.indexOf(correct);
        }
    });
    isSubmit = true;
}

function renderResults() {
    quizAnswers.forEach(el => el.classList.remove("active", "incorrect"));
    const userAns = listSubmit[currentIndex];
    const correctAns = listResults[currentIndex];
    if (userAns === correctAns) {
        quizAnswers[correctAns].classList.add("active");
    } else {
        quizAnswers[correctAns]?.classList.add("active");
        quizAnswers[userAns]?.classList.add("incorrect");
    }
}

// ==== Drag-and-Drop ====
function loadTrashItems() {
    trashData.forEach((item, i) => {
        const el = document.createElement("div");
        el.className = "item";
        el.draggable = true;
        el.textContent = item.name;
        el.dataset.index = i;
        el.addEventListener("dragstart", dragStart);
        area.appendChild(el);
    });

    document.querySelectorAll(".bin").forEach(bin => {
        bin.addEventListener("dragover", e => e.preventDefault());
        bin.addEventListener("drop", dropItem);
    });
}

function dragStart(e) {
    if (isSubmit) return;
    e.dataTransfer.setData("text/plain", e.target.dataset.index);
}

area.addEventListener("dragover", e => e.preventDefault());
area.addEventListener("drop", e => {
    if (isSubmit) return;
    const idx = e.dataTransfer.getData("text");
    const item = trashData[idx];
    if (!item) return;

    trashAssignment[idx] && delete trashAssignment[idx];

    if (!area.querySelector(`.item[data-index="${idx}"]`)) {
        const el = createTrashElement(item.name, idx);
        area.appendChild(el);
    }

    document.querySelectorAll(`.bin .item[data-index="${idx}"]`).forEach(el => el.remove());
});

function dropItem(e) {
    if (isSubmit) return;
    e.preventDefault();
    const idx = e.dataTransfer.getData("text");
    const item = trashData[idx];
    const binType = e.currentTarget.dataset.type;

    if (!item) return;
    e.currentTarget.querySelectorAll(`.item[data-index="${idx}"]`).forEach(el => el.remove());

    trashAssignment[idx] = binType;
    const el = createTrashElement(item.name, idx);
    e.currentTarget.appendChild(el);
    area.querySelector(`.item[data-index="${idx}"]`)?.remove();
}

function createTrashElement(name, idx) {
    const el = document.createElement("div");
    el.className = "item";
    el.draggable = true;
    el.textContent = name;
    el.dataset.index = idx;
    el.addEventListener("dragstart", dragStart);
    return el;
}

// ==== Submission ====
function submitGame() {
    const answered = listSubmit.filter(item => item >= 0);
    if (answered.length !== countQuestion) {
        alert("⚠️ Bạn chưa chọn hết đáp án trắc nghiệm");
        return;
    }

    if (Object.keys(trashAssignment).length < 10) {
        alert(`⚠️ Bạn cần kéo thêm ${10 - Object.keys(trashAssignment).length} món rác`);
        return;
    }

    clearInterval(timer);
    handleCheckResults(multipleData);
    renderResults();
    processTrashScore();
    showScoreOverlay();
}

function processTrashScore() {
    dragScore = 0;
    document.querySelectorAll('.bin .item').forEach(item => item.innerHTML = item.textContent); // clear old symbols

    Object.entries(trashAssignment).forEach(([idx, type]) => {
        const item = trashData[idx];
        if (!item) return;

        const correct = type === item.type;
        if (correct) dragScore++;

        const symbol = correct ? " ✔" : " ❌";
        const binItem = document.querySelector(`.bin .item[data-index="${idx}"]`);
        if (binItem) {
            binItem.innerHTML = item.name + symbol;
            binItem.classList.add(correct ? "correct" : "incorrect");
        }
    });
}

function showScoreOverlay() {
    const timeUsed = `${Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:${(elapsedTime % 60).toString().padStart(2, '0')}`;
    const total = quizScore + dragScore;
    const rating = total >= 25 ? "⭐ Xuất sắc" : total >= 18 ? "👍 Tốt" : "🔄 Cần cải thiện";

    document.querySelector("#time-used span").textContent = timeUsed;
    document.querySelector("#select-score span").textContent = `${quizScore}/20`;
    document.querySelector("#trash-score span").textContent = `${dragScore}/10`;
    document.querySelector(".all-score span").textContent = `${total}/30 - ${rating}`;
    document.getElementById("overlay").style.display = "block";
    document.getElementById("final-score").style.display = "block";
}

// ==== Timer ====
function startTimer() {
    timer = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(timer);
            handleAutoSubmit();
        } else {
            remainingTime--;
            elapsedTime++;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(remainingTime / 60).toString().padStart(2, "0");
    const s = (remainingTime % 60).toString().padStart(2, "0");
    quizTimer.innerText = `${m}:${s}`;
}

function handleAutoSubmit() {
    listSubmit = listSubmit.map(item => item >= 0 ? item : -1);
    handleCheckResults(multipleData);
    renderResults();
    processTrashScore();
    showScoreOverlay();
    alert("⏰ Hết giờ! Bài của bạn đã được nộp tự động.");
}

// ==== Touch Support ====
function enableTouchSupport() {
    document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('touchstart', function (e) {
            this.touchX = e.touches[0].clientX;
            this.touchY = e.touches[0].clientY;
        });

        item.addEventListener('touchend', function (e) {
            if (isSubmit) return;

            const idx = this.dataset.index;
            const name = this.textContent.replace(/✔|❌/, '').trim();
            const touch = e.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

            if (!dropTarget) return;

            if (dropTarget.closest(".bin")) {
                const bin = dropTarget.closest(".bin");
                const type = bin.dataset.type;

                trashAssignment[idx] = type;

                document.querySelectorAll(`.item[data-index="${idx}"]`).forEach(el => el.remove());

                const el = createTrashElement(name, idx);
                bin.appendChild(el);
                enableTouchSupport();
            } else if (dropTarget.id === "trash-items" || dropTarget.closest("#trash-items")) {
                delete trashAssignment[idx];

                document.querySelectorAll(`.bin .item[data-index="${idx}"]`).forEach(el => el.remove());

                if (!area.querySelector(`.item[data-index="${idx}"]`)) {
                    const el = createTrashElement(name, idx);
                    area.appendChild(el);
                    enableTouchSupport();
                }
            }
        });
    });
}


// ==== Overlay Interactions ====
document.getElementById("overlay").addEventListener("click", function (e) {
    const scoreCard = document.getElementById("final-score");
    if (!scoreCard.contains(e.target)) {
        scoreCard.classList.add("minimized");
        this.style.backgroundColor = "transparent";
        this.style.display = "none";
    }
});

document.getElementById("final-score").addEventListener("click", function (e) {
    if (this.classList.contains("minimized")) {
        e.stopPropagation();
        this.classList.remove("minimized");
        const overlay = document.getElementById("overlay");
        overlay.style.display = "block";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
    }
});
