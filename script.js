const questions = [];
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let viewedQuestionsCount = 1;
let baseQuestionNumber = 1;
let selectedFile = "";
let selectedLanguage = "tr-TR";
let speechSpeed = 1;

document.addEventListener("DOMContentLoaded", async () => {
  let choice = prompt("Hangi veri dosyası yüklensin? (1 = İSG 1, 2 = İSG 2, 3 = eksiltilmiş sorular)", "3");

  if (choice === "1") selectedFile = "isg.txt";
  else if (choice === "2") selectedFile = "isg2.txt";
  else if (choice === "3") selectedFile = "isg3.txt";
  else {
    alert("Geçersiz seçim! Varsayılan: İSG 2");
    selectedFile = "isg2.txt";
  }

  await loadQuestionsFromFile();
  initNormalOrder();
  displayQuestion();
  updateViewedQuestionsCount();
});

function loadQuestionsFromFile() {
  return new Promise((resolve) => {
    if (!selectedFile) return;

    if (selectedFile === "isg2.txt") baseQuestionNumber = 501;
    else baseQuestionNumber = 1;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", selectedFile, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        processFileContent(xhr.responseText);
        resolve();
      }
    };
    xhr.send();
  });
}

function processFileContent(fileContent) {
  const lines = fileContent.split("\n");
  for (let i = 0; i < lines.length; i += 6) {
    const questionText = lines[i]?.trim();
    const choices = (lines.slice(i + 1, i + 5) || []).map((choice) => choice.trim());
    const correctAnswerString = lines[i + 5]?.trim().toUpperCase();

    if (questionText && choices.length === 4 && correctAnswerString) {
      const match = questionText.match(/^(\d+)\./);
      const questionNumber = match ? parseInt(match[1], 10) : null;
      const correctAnswerIndex = choices.findIndex((c) =>
        c.toUpperCase().startsWith(correctAnswerString)
      );

      if (correctAnswerIndex !== -1) {
        questions.push({
          number: questionNumber,
          question: questionText,
          choices,
          correctAnswer: correctAnswerIndex,
        });
      }
    }
  }
}

/* === KARMA SİSTEM === */
function initShuffleSystem() {
  const savedDataKey = `${selectedFile}_shuffleData`;
  const savedData = JSON.parse(localStorage.getItem(savedDataKey));

  if (savedData && confirm("Önceden karıştırılmış liste bulundu. Kaldığın yerden devam edilsin mi?")) {
    shuffledQuestions = savedData.shuffledQuestions;
    currentQuestionIndex = savedData.currentIndex;
  } else {
    shuffledQuestions = shuffleArray([...questions]);
    currentQuestionIndex = 0;
    saveShuffleData();
  }
}

function saveShuffleData() {
  const key = `${selectedFile}_shuffleData`;
  const data = {
    shuffledQuestions,
    currentIndex: currentQuestionIndex,
  };
  localStorage.setItem(key, JSON.stringify(data));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* === GÖRÜNÜM VE NAVİGASYON === */
function displayQuestion() {
  const current = shuffledQuestions[currentQuestionIndex];
  if (!current) {
    alert("Tüm sorular tamamlandı!");
    return;
  }

  document.getElementById("question").textContent = current.question;
  const choiceButtons = document.querySelectorAll(".choice");

  choiceButtons.forEach((btn, i) => {
    btn.textContent = current.choices[i];
    btn.classList.remove("correct", "incorrect");
  });

  toggleShowAnswer();
  saveShuffleData();
}

function updateViewedQuestionsCount() {
  document.getElementById("viewedQuestionsCount").textContent = `Bakılan soru sayısı: ${currentQuestionIndex + 1}/${shuffledQuestions.length}`;
}

function nextQuestion() {
  if (currentQuestionIndex < shuffledQuestions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
    updateViewedQuestionsCount();
  } else alert("🎉 Tüm sorular bitti!");
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion();
    updateViewedQuestionsCount();
  }
}

/* === CEVAP KONTROL === */
function checkAnswer(index) {
  const current = shuffledQuestions[currentQuestionIndex];
  if (!current) return;

  const correctIndex = current.correctAnswer;
  const buttons = document.querySelectorAll(".choice");

  buttons.forEach((btn, i) => {
    btn.classList.remove("correct", "incorrect");
    if (i === correctIndex) btn.classList.add("correct");
    else if (i === index) btn.classList.add("incorrect");
  });
}

/* === SESLİ OKUMA === */
function setLanguage(lang) {
  selectedLanguage = lang;
}
function setSpeed(speed) {
  speechSpeed = Math.min(Math.max(speed, 0.5), 3);
  document.getElementById("speedValue").textContent = speed;
}

function readAllQuestions() {
  if (currentQuestionIndex >= shuffledQuestions.length) return alert("Tüm sorular bitti!");
  const q = shuffledQuestions[currentQuestionIndex];
  const correct = q.choices[q.correctAnswer];
  const text = `${q.question}. Doğru cevap: ${correct}.`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedLanguage;
  utterance.rate = speechSpeed;

  utterance.onend = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
      displayQuestion();
      readAllQuestions();
    } else {
      alert("Tüm sorular tamamlandı!");
    }
  };
  speechSynthesis.speak(utterance);
}

function stopReading() {
  speechSynthesis.cancel();
}

/* === AYARLAR VE YARDIMCI === */
function toggleShowAnswer() {
  const show = document.getElementById("showAnswerCheckbox")?.checked;
  const current = shuffledQuestions[currentQuestionIndex];
  if (!current) return;
  const correctIndex = current.correctAnswer;
  const buttons = document.querySelectorAll(".choice");
  buttons.forEach((btn, i) => {
    btn.classList.remove("correct");
    if (show && i === correctIndex) btn.classList.add("correct");
  });
}

function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

function goToQuestionByNumber() {
  const num = parseInt(document.getElementById("questionNumber").value);
  const index = shuffledQuestions.findIndex((q) => q.number === num);
  if (index !== -1) {
    currentQuestionIndex = index;
    displayQuestion();
    updateViewedQuestionsCount();
  } else alert("Geçersiz numara!");
}

/* === KISAYOLLAR === */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextQuestion();
  if (e.key === "ArrowLeft") previousQuestion();
  if (e.key === " ") {
    e.preventDefault();
    nextQuestion();
  }

  const keys = ["q", "w", "e", "r"];
  const index = keys.indexOf(e.key);
  if (index !== -1) {
    checkAnswer(index);
  }
});

/* === TIKLAMALAR === */
document.querySelectorAll(".choice").forEach((btn, i) =>
  btn.addEventListener("click", () => checkAnswer(i))
);

document.getElementById("speedRange")?.addEventListener("input", (e) =>
  setSpeed(e.target.value)
);

/* === MANUEL KARMA BUTONU === */
function handleShuffle() {
  if (questions.length === 0) {
    alert("Soru verisi yüklenmedi!");
    return;
  }

  // Kullanıcıdan aralık al (opsiyonel)
  const startInput = document.getElementById("shuffleStart").value;
  const endInput = document.getElementById("shuffleEnd").value;

  const start = startInput ? parseInt(startInput) : null;
  const end = endInput ? parseInt(endInput) : null;

  // Eğer başlangıç ve bitiş verilmişse, o aralığı karıştır
  let subset;
  if (start && end && start <= end) {
    subset = questions.filter(q => q.number >= start && q.number <= end);
    if (subset.length === 0) {
      alert("Belirtilen aralıkta soru bulunamadı!");
      return;
    }
    shuffledQuestions = shuffleArray([...subset]);
  }
  // Yoksa tümünü karıştır
  else {
    shuffledQuestions = shuffleArray([...questions]);
  }

  currentQuestionIndex = 0;
  saveShuffleData();
  displayQuestion();
  updateViewedQuestionsCount();

  alert("Sorular başarıyla karıştırıldı!");
}

function initNormalOrder() {
  const savedDataKey = `${selectedFile}_shuffleData`;
  const savedData = JSON.parse(localStorage.getItem(savedDataKey));

  if (savedData && confirm("Önceden karıştırılmış bir sıra bulundu. Devam edilsin mi?")) {
    shuffledQuestions = savedData.shuffledQuestions;
    currentQuestionIndex = savedData.currentIndex;
  } else {
    // Normal sıralı liste (karıştırılmamış)
    shuffledQuestions = [...questions].sort((a, b) => a.number - b.number);
    currentQuestionIndex = 0;
  }

}
