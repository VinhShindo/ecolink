const quizTimer = document.querySelector("#timer");
const quizSubmit = document.querySelector("#quiz_submit");
const quizPrev = document.querySelector("#quiz_prev");
const quizNext = document.querySelector("#quiz_next");
const quizCount = document.querySelector(".quiz_question h5");
const quizAnswers = document.querySelectorAll(".quiz_question ul li");
let quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
const quizQuestionList = document.querySelector(".quiz_numbers ul");
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

// ==== Fetch & Initialization ====
fetch("data.txt")
    .then(response => response.text())
    .then(data => {
        data = JSON.parse(data)
        multipleData = data["multipleChoice"];
        trashData = data["dragQuestion"];

        renderQuestion(multipleData);
        loadTrashItems();
        startTimer();
    })
    .catch(error => console.error('Error loading file:', error));

// ==== Multiple-Choice Logic ====
function renderQuestion(lists) {
    let render = "";
    lists = lists["quizz"];
    lists.forEach((question, index) => {
        render += `<li>${index + 1}</li>`;
        countQuestion++;
    });
    quizQuestionList.innerHTML = render;
    quizQuestions = document.querySelectorAll(".quiz_numbers ul li");
    quizQuestions[0].classList.add("active");

    quizCount.innerText = `Question ${currentIndex + 1} of ${lists.length}`;
    quizTitle.innerText = lists[currentIndex].question;
    quizAnswersItem.forEach((answer, index) => {
        answer.innerText = lists[currentIndex].answers[index];
    });

    handleQuestionList();
    handleAnswer();
}

function renderCurrentQuestion(lists) {
    lists = lists["quizz"];
    quizCount.innerText = `Question ${currentIndex + 1} of ${lists.length}`;
    quizTitle.innerText = lists[currentIndex].question;
    quizAnswersItem.forEach((answer, index) => {
        answer.innerText = lists[currentIndex].answers[index];
    });
}

function handleQuestionList() {
    quizQuestions.forEach((item, index) => {
        item.addEventListener("click", () => {
            item.scrollIntoView({ behavior: "smooth", inline: "center" });

            quizQuestions.forEach(item => item.classList.remove("active"));
            item.classList.add("active");
            currentIndex = index;

            renderCurrentQuestion(multipleData);
            quizAnswers.forEach(item => item.classList.remove("active"));

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
            quizAnswers.forEach(item => item.classList.remove("active"));
            answer.classList.add("active");
            quizQuestions[currentIndex].classList.add("selected");
            listSubmit[currentIndex] = index;
        });
    });
}

quizNext.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % countQuestion;
    quizQuestions[currentIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
    quizQuestions.forEach(item => item.classList.remove("active"));
    quizQuestions[currentIndex].classList.add("active");

    renderCurrentQuestion(multipleData);
    quizAnswers.forEach(item => item.classList.remove("active"));

    const selected = listSubmit[currentIndex];
    selected >= 0 && quizAnswers[selected].click();

    if (isSubmit) renderResults();
});

quizPrev.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + countQuestion) % countQuestion;
    quizQuestions[currentIndex].scrollIntoView({ behavior: "smooth", inline: "center" });
    quizQuestions.forEach(item => item.classList.remove("active"));
    quizQuestions[currentIndex].classList.add("active");

    renderCurrentQuestion(multipleData);
    quizAnswers.forEach(item => item.classList.remove("active"));

    const selected = listSubmit[currentIndex];
    selected >= 0 && quizAnswers[selected].click();

    if (isSubmit) renderResults();
});

function handleCheckResults(lists) {
    quizScore = 0;
    lists["quizz"].forEach((item, index) => {
        const result = lists["results"].find(r => String(r.quiz_id) === String(item.id));
        if (item.answers[listSubmit[index]] === result.answer) {
            listResults[index] = listSubmit[index];
            quizScore++;
        } else {
            quizQuestions[index].classList.add("incorrect");
            listResults[index] = item.answers.indexOf(result.answer);
        }
    });
    isSubmit = true;
}

function renderResults() {
    quizAnswers.forEach(item => {
        item.classList.remove("active", "incorrect");
    });

    if (listResults[currentIndex] === listSubmit[currentIndex]) {
        quizAnswers[listResults[currentIndex]].classList.add("active");
    } else {
        quizAnswers[listResults[currentIndex]].classList.add("active");
        quizAnswers[listSubmit[currentIndex]]?.classList.add("incorrect");
    }
}

// ==== Drag-and-Drop Trash Game ====
function loadTrashItems() {
    trashData.forEach((item, index) => {
        const el = document.createElement("div");
        el.className = "item";
        el.draggable = true;
        el.textContent = item.name;
        el.dataset.index = index;
        el.addEventListener("dragstart", dragStart);
        area.appendChild(el);
    });

    document.querySelectorAll(".bin").forEach(bin => {
        bin.addEventListener("dragover", e => e.preventDefault());
        bin.addEventListener("drop", dropItem);
    });
}

function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.index);
}

area.addEventListener("dragover", e => e.preventDefault());
area.addEventListener("drop", e => {
    e.preventDefault();
    const idx = e.dataTransfer.getData("text");
    const item = trashData[idx];
    if (!item) return;

    trashAssignment[idx] && delete trashAssignment[idx];

    if (!area.querySelector(`.item[data-index="${idx}"]`)) {
        const el = document.createElement("div");
        el.className = "item";
        el.draggable = true;
        el.textContent = item.name;
        el.dataset.index = idx;
        el.addEventListener("dragstart", dragStart);
        area.appendChild(el);
    }

    document.querySelectorAll(`.bin .item[data-index="${idx}"]`).forEach(el => el.remove());
});

function dropItem(e) {
    e.preventDefault();
    const idx = e.dataTransfer.getData("text");
    const item = trashData[idx];
    const binType = e.currentTarget.dataset.type;

    if (!item) return;

    e.currentTarget.querySelectorAll(`.item[data-index="${idx}"]`).forEach(el => el.remove());

    trashAssignment[idx] = binType;

    const droppedEl = document.createElement("div");
    droppedEl.className = "item";
    droppedEl.draggable = true;
    droppedEl.textContent = item.name;
    droppedEl.dataset.index = idx;
    droppedEl.addEventListener("dragstart", dragStart);

    e.currentTarget.appendChild(droppedEl);
    area.querySelector(`.item[data-index="${idx}"]`)?.remove();
}

// ==== Submission & Score ====
function submitGame() {
    const progressLen = listSubmit.filter(item => item >= 0);
    if (progressLen.length != countQuestion) {
        alert("⚠️ Bạn chưa chọn hết đáp án trắc nghiệm");
        return;
    }

    if (Object.keys(trashAssignment).length < 10) {
        alert(`⚠️ Bạn cần kéo thêm ${10 - Object.keys(trashAssignment).length} món rác`);
        return;
    }

    handleCheckResults(multipleData);
    renderResults();

    dragScore = 0;
    Object.entries(trashAssignment).forEach(([idx, binType]) => {
        const item = trashData[idx];
        if (item && binType === item.type) dragScore++;
    });

    const total = quizScore + dragScore;
    let rating = total >= 25 ? "⭐ Xuất sắc" : total >= 18 ? "👍 Tốt" : "🔄 Cần cải thiện";

    document.querySelector("#select-score span").textContent = `${quizScore}/20`;
    document.querySelector("#trash-score span").textContent = `${dragScore}/10`;
    document.querySelector(".all-score span").textContent = `${total}/30 - ${rating}`;
    document.getElementById("overlay").style.display = "block";
    document.getElementById("final-score").style.display = "block";
}

document.getElementById("overlay").addEventListener("click", function (e) {
    const finalScore = document.getElementById("final-score");
    if (!finalScore.contains(e.target)) {
        finalScore.classList.add("minimized");
        this.style.backgroundColor = "transparent";
        document.getElementById("overlay").style.display = "none";
    }
});


document.getElementById("final-score").addEventListener("click", function (e) {
    if (this.classList.contains("minimized")) {
        e.stopPropagation();
        this.classList.remove("minimized");
        document.getElementById("overlay").style.display = "block";
        document.getElementById("overlay").style.backgroundColor = "rgba(0,0,0,0.7)";
    }
});

// ==== Timer ====
function startTimer() {
    timer = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(timer);
            handleAutoSubmit();
        } else {
            remainingTime--;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    quizTimer.innerText = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function handleAutoSubmit() {
    listSubmit = listSubmit.map(item => item >= 0 ? item : -1);

    handleCheckResults(multipleData);
    renderResults();

    dragScore = 0;
    Object.entries(trashAssignment).forEach(([idx, binType]) => {
        const item = trashData[idx];
        if (item && binType === item.type) dragScore++;
    });

    const total = quizScore + dragScore;
    let rating = total >= 25 ? "⭐ Xuất sắc" : total >= 18 ? "👍 Tốt" : "🔄 Cần cải thiện";

    document.querySelector("#select-score span").textContent = `${quizScore}/20`;
    document.querySelector("#trash-score span").textContent = `${dragScore}/10`;
    document.querySelector(".all-score span").textContent = `${total}/30 - ${rating}`;
    document.getElementById("overlay").style.display = "block";
    document.getElementById("final-score").style.display = "block";

    alert("⏰ Hết giờ! Bài của bạn đã được nộp tự động.");
}