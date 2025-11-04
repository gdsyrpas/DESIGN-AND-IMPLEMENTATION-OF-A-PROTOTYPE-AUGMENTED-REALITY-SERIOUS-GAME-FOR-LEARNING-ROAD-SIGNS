const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const quizContainer = document.getElementById('quiz-container');
const quizQuestionEl = document.getElementById('quiz-question');
const countdownTimerEl = document.getElementById('countdown-timer');
const choicesContainer = document.getElementById('choices-container');
const scoreEl = document.getElementById('score');
const toastTpl = document.getElementById('toast-template');
const streakBoardEl = document.getElementById('streak-board');
const streakCountEl = document.getElementById('streak-count');
const endGameButton = document.getElementById('end-game-button');
const statsButton = document.getElementById('stats-button');
const statsModal = document.getElementById('stats-modal');
const finalScoreEl = document.getElementById('final-score');
const correctCountEl = document.getElementById('correct-count');
const wrongCountEl = document.getElementById('wrong-count');
const avgTimeEl = document.getElementById('avg-time');
const highScoresList = document.getElementById('high-scores-list');
const closeStatsButton = document.getElementById('close-stats-button');
const introModal = document.getElementById('intro-modal');
const startButton = document.getElementById('start-button');
const scoreBoard = document.getElementById('score-board');
const nameModal = document.getElementById('name-modal');
const saveScoreButton = document.getElementById('save-score-button');
const usernameInput = document.getElementById('username-input');

// Νέες μεταβλητές για το κουμπί επανεκκίνησης και το σκορ μέσα στο κουίζ
const restartButton = document.getElementById('restart-button');
const quizScoreEl = document.getElementById('quiz-score');

let model, detections = [],
  currentSign = '',
  score = 0;
let correctStreak = 0;
let totalQuizzes = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let totalTime = 0;
let quizStartTime = 0;
let countdownInterval = null;

let lastDetectedSign = null;
let lastDetectionTime = 0;

const signQuizData = {
  "stop sign": {
    name: "Stop",
    question: "Τι συμβολίζει η πινακίδα STOP;",
    correctAnswer: "Σταμάτα και παραχώρησε προτεραιότητα",
    choices: ["Σταμάτα και παραχώρησε προτεραιότητα", "Υποχρεωτική στάση για έλεγχο", "Παρκάρισμα"]
  },
  "parking meter": {
    name: "Στάθμευση",
    question: "Τι συμβολίζει η πινακίδα Στάθμευσης;",
    correctAnswer: "Στάθμευση με πληρωμή",
    choices: ["Στάθμευση με πληρωμή", "Απαγόρευση", "Απαγορεύεται το παρκάρισμα"]
  },
  "bicycle": {
    name: "Ποδηλατόδρομος",
    question: "Τι συμβολίζει η πινακίδα Ποδηλατόδρομου;",
    correctAnswer: "Αποκλειστικά ποδήλατα",
    choices: ["Λεωφορεία", "Αποκλειστικά ποδήλατα", "Μόνο μοτοσυκλέτες και ποδήλατα"]
  },
  "fire hydrant": {
    name: "Απαγορεύεται Η Στάθμευση",
    question: "Τι συμβολίζει αυτή η πινακίδα;",
    correctAnswer: "Απαγορεύεται η στάθμευση",
    choices: ["Απαγορεύεται η στάθμευση", "Αποφυγή κυκλοφοριακής συμφόρησης", "Στάθμευση"]
  },
  "bus": {
    name: "Λωρίδα Λεωφορείων",
    question: "Ποιος επιτρέπεται να κινείται σε αυτή τη λωρίδα;",
    correctAnswer: "Μόνο λεωφορεία και ταξί",
    choices: ["Μόνο λεωφορεία και ταξί", "Όλα τα δημόσια μέσα μεταφοράς", "Ποδήλατο"]
  },
  "traffic cone": {
    name: "Εργασίες Οδοποιίας",
    question: "Τι πρέπει να κάνεις όταν βλέπεις αυτή την πινακίδα;",
    correctAnswer: "Κίνδυνος ή εργασίες στο δρόμο",
    choices: ["Κίνδυνος ή εργασίες στο δρόμο", "Ταχύτητα", "Σηματοδότηση χώρου για εκδηλώσεις"]
  },
  "pedestrian crossing": {
    name: "Διάβαση Πεζών",
    question: "Τι συμβολίζει η πινακίδα Διάβασης Πεζών;",
    correctAnswer: "Διάβαση πεζών",
    choices: ["Διάβαση πεζών", "Προσοχή Παίζουν Παιδιά", "Οχήματα"]
  },
  "no parking": {
    name: "Απαγόρευση Στάθμευσης",
    question: "Τι συμβολίζει η πινακίδα Απαγόρευσης Στάθμευσης;",
    correctAnswer: "Απαγορεύεται η στάθμευση",
    choices: ["Απαγορεύεται η στάθμευση", "Επιτρέπεται η στάθμευση", "Στάση Και Στάθμευση"]
  },
  "one way": {
    name: "Μονόδρομος",
    question: "Τι συμβολίζει η πινακίδα Μονόδρομου;",
    correctAnswer: "Μονόδρομος",
    choices: ["Διπλής Κυκλοφορίας", "Μονόδρομος", "Αδιέξοδο"]
  },
  "traffic light": {
    name: "Φανάρια",
    question: "Τι συμβολίζει η πινακίδα Φαναριών;",
    correctAnswer: "Φωτεινοί σηματοδότες",
    choices: ["Χωρίς Σηματοδότηση", "Φωτεινοί σηματοδότες", "Προσοχή"]
  },
  "crossroad": {
    name: "Σταυροδρόμι",
    question: "Τι συμβολίζει η πινακίδα Σταυροδρομίου;",
    correctAnswer: "Διασταύρωση",
    choices: ["Διασταύρωση", "Στροφή", "Δρόμος Με Στροφές"]
  },
  "yield": {
    name: "Παραχώρηση Προτεραιότητας",
    question: "Τι συμβολίζει η πινακίδα Παραχώρησης Προτεραιότητας;",
    correctAnswer: "Παραχώρηση προτεραιότητας",
    choices: ["Παραχώρηση προτεραιότητας", "Έχεις Προτεραιότητα", "Σταμάτα"]
  },
  "speed limit": {
    name: "Όριο Ταχύτητας",
    question: "Τι συμβολίζει η πινακίδα Ορίου Ταχύτητας;",
    correctAnswer: "Όριο Ταχύτητας",
    choices: ["Απαγορεύεται Η Προσπέραση", "Όριο Ταχύτητας", "Αρχή Κατοικημένης Περιοχής"]
  },
  "no entry": {
    name: "Απαγορεύεται Η Είσοδος",
    question: "Τι συμβολίζει η πινακίδα Απαγόρευσης Εισόδου;",
    correctAnswer: "Απαγορεύεται η είσοδος",
    choices: ["Απαγορεύεται η είσοδος", "Μονόδρομος", "Διπλής Κυκλοφορίας"]
  },
  "roundabout": {
    name: "Κυκλικός Κόμβος",
    question: "Τι συμβολίζει η πινακίδα Κυκλικού Κόμβου;",
    correctAnswer: "Κυκλικός Κόμβος",
    choices: ["Κυκλικός Κόμβος", "Διασταύρωση", "Τέλος Οδού"]
  },
  "slippery road": {
    name: "Ολισθηρός Δρόμος",
    question: "Τι συμβολίζει η πινακίδα Ολισθηρός Δρόμος;",
    correctAnswer: "Ολισθηρός Δρόμος",
    choices: ["Καλός Δρόμος", "Επιτρέπεται Η Προσπέραση", "Ολισθηρός Δρόμος"]
  }
};

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      },
      audio: false
    });
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (error) {
    console.error("Σφάλμα στην πρόσβαση στην κάμερα:", error);
    showToast("Αδυναμία πρόσβασης στην κάμερα. Βεβαιωθείτε ότι επιτρέψατε την πρόσβαση.");
    return Promise.reject("Αδυναμία πρόσβασης στην κάμερα.");
  }
}

async function loadModel() {
  try {
    model = await cocoSsd.load();
    return Promise.resolve();
  } catch (error) {
    console.error("Σφάλμα φόρτωσης του μοντέλου:", error);
    showToast("Αδυναμία φόρτωσης του μοντέλου. Δοκιμάστε ξανά.");
    return Promise.reject("Αδυναμία φόρτωσης του μοντέλου.");
  }
}

function showToast(msg) {
  const toast = toastTpl.content.cloneNode(true).querySelector('.toast');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function playSound(name) {
  const audio = new Audio(name);
  audio.play();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function startCountdown() {
  let timeLeft = 10;
  countdownTimerEl.textContent = timeLeft;
  countdownInterval = setInterval(() => {
    timeLeft--;
    countdownTimerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      showToast("Τέλος Χρόνου! -5");
      playSound("wrong.mp3");
      score -= 5;
      wrongAnswers++;
      scoreEl.textContent = score;
      quizScoreEl.textContent = score;
      
      scoreEl.classList.add('score-pulse', 'score-wrong-glow');
      setTimeout(() => {
        scoreEl.classList.remove('score-pulse', 'score-wrong-glow');
      }, 500);

      quizScoreEl.classList.add('score-pulse', 'score-wrong-glow');
      setTimeout(() => {
        quizScoreEl.classList.remove('score-pulse', 'score-wrong-glow');
      }, 500);

      correctStreak = 0;
      updateStreakDisplay();
      hideQuiz();
    }
  }, 1000);
}

function showQuiz(signClass) {
  currentSign = signClass;
  const signData = signQuizData[signClass];
  if (!signData) return;

  scoreBoard.classList.add('hidden');
  quizContainer.classList.remove('hidden');

  quizScoreEl.textContent = score;
  quizQuestionEl.textContent = "Τι συμβολίζει η πινακίδα που σκανάρατε;";
  choicesContainer.innerHTML = '';

  const shuffledChoices = [...signData.choices];
  shuffleArray(shuffledChoices);

  shuffledChoices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = choice;
    btn.onclick = () => handleAnswer(choice);
    choicesContainer.appendChild(btn);
  });

  quizStartTime = Date.now();
  totalQuizzes++;
  startCountdown();
}

function hideQuiz() {
  clearInterval(countdownInterval);
  quizContainer.classList.add('hidden');
  choicesContainer.innerHTML = '';
  lastDetectedSign = null;
  lastDetectionTime = 0;
  scoreBoard.classList.remove('hidden');
}

function updateStreakDisplay() {
  if (correctStreak > 1) {
    streakBoardEl.classList.remove('hidden');
    streakCountEl.textContent = correctStreak;
    streakCountEl.classList.add('streak-pulse');
    setTimeout(() => {
      streakCountEl.classList.remove('streak-pulse');
    }, 300);
  } else {
    streakBoardEl.classList.add('hidden');
  }
}

function saveHighScore(username, userScore, correctAnswers, wrongAnswers, totalTime) {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  const newScore = {
      name: username,
      score: userScore,
      correct: correctAnswers,
      wrong: wrongAnswers,
      avgTime: (totalTime / correctAnswers || 0).toFixed(2)
  };
  highScores.push(newScore);
  highScores.sort((a, b) => b.score - a.score);
  localStorage.setItem('highScores', JSON.stringify(highScores.slice(0, 5)));
}

function loadHighScores() {
  let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  
  if (highScores.length > 0 && typeof highScores[0] === 'number') {
    localStorage.removeItem('highScores');
    highScores = [];
  }

  highScoresList.innerHTML = '';
  if (highScores.length === 0) {
    const li = document.createElement('li');
    li.textContent = "Δεν Υπάρχουν Ακόμα Σκορ.";
    highScoresList.appendChild(li);
    return;
  }
  highScores.forEach((s, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${index + 1}. ${s.name} - ${s.score} Πόντοι`;
    highScoresList.appendChild(li);
  });
}

function showStatsModal() {
  statsModal.classList.remove('hidden');
  // Εμφανίζει το κουμπί για επιστροφή στο παιχνίδι
  closeStatsButton.classList.remove('hidden');
  // Κρύβει το κουμπί για επανεκκίνηση
  restartButton.classList.add('hidden');
  loadHighScores();
}

function showNameModal() {
    nameModal.classList.remove('hidden');
}

function handleSaveScore() {
    const username = usernameInput.value || 'Ανώνυμος';
    saveHighScore(username, score, correctAnswers, wrongAnswers, totalTime);
    nameModal.classList.add('hidden');
    showFinalStats();
}

function showFinalStats() {
  hideQuiz();
  statsModal.classList.remove('hidden');

  finalScoreEl.textContent = score;
  correctCountEl.textContent = correctAnswers;
  wrongCountEl.textContent = wrongAnswers;
  const avgTime = (totalTime / correctAnswers || 0).toFixed(2);
  avgTimeEl.textContent = avgTime;
  
  // Κρύβει το κουμπί για επιστροφή στο παιχνίδι
  closeStatsButton.classList.add('hidden');
  // Εμφανίζει το κουμπί για επανεκκίνηση
  restartButton.classList.remove('hidden');
  loadHighScores();
}

function handleAnswer(answer) {
  clearInterval(countdownInterval);
  const correct = signQuizData[currentSign]?.correctAnswer || "";
  const responseTime = (Date.now() - quizStartTime) / 1000;
  let isCorrect = answer.toLowerCase() === correct.toLowerCase();

  const detectedObject = detections.find(d => d.class === currentSign);
  if (detectedObject) {
    drawVisualFeedback(detectedObject, isCorrect);
  }

  if (isCorrect) {
    score += 10;
    correctAnswers++;
    correctStreak++;
    totalTime += responseTime;
    scoreEl.textContent = score;
    quizScoreEl.textContent = score;
    
    scoreEl.classList.add('score-correct', 'score-pulse', 'score-correct-glow');
    setTimeout(() => {
        scoreEl.classList.remove('score-correct', 'score-pulse', 'score-correct-glow');
    }, 500);

    quizScoreEl.classList.add('score-correct', 'score-pulse', 'score-correct-glow');
    setTimeout(() => {
        quizScoreEl.classList.remove('score-pulse', 'score-correct-glow');
    }, 500);

    showToast('Σωστό! +10');
    playSound("correct.mp3");

    if (correctStreak >= 3) {
      showToast(`Combo x${correctStreak}!`);
      document.body.style.backgroundColor = "#14532d";
      setTimeout(() => {
        document.body.style.backgroundColor = "";
      }, 1000);
    }
  } else {
    score -= 5;
    wrongAnswers++;
    scoreEl.textContent = score;
    quizScoreEl.textContent = score;

    scoreEl.classList.add('score-wrong', 'score-pulse', 'score-wrong-glow');
    setTimeout(() => {
        scoreEl.classList.remove('score-pulse', 'score-wrong-glow');
    }, 500);

    quizScoreEl.classList.add('score-wrong', 'score-pulse', 'score-wrong-glow');
    setTimeout(() => {
        quizScoreEl.classList.remove('score-pulse', 'score-wrong-glow');
    }, 500);

    showToast('Λάθος! -5');
    playSound("wrong.mp3");
    correctStreak = 0;
  }

  updateStreakDisplay();
  
  hideQuiz();
}

function drawVisualFeedback(detection, isCorrect) {
  const [x, y, w, h] = detection.bbox;

  const feedbackEl = document.createElement('div');
  feedbackEl.textContent = isCorrect ? '✔️' : '❌';
  feedbackEl.className = `detection-feedback ${isCorrect ? 'correct' : 'wrong'}`;
  feedbackEl.style.left = `${x + w / 2}px`;
  feedbackEl.style.top = `${y - 20}px`;
  document.querySelector('main').appendChild(feedbackEl);
  setTimeout(() => feedbackEl.remove(), 1000);
}

async function detectFrame() {
  if (!model || video.videoWidth === 0) {
    requestAnimationFrame(detectFrame);
    return;
  }

  const predictions = await model.detect(video);
  detections = predictions.filter(p => Object.keys(signQuizData).includes(p.class) && p.score > 0.6);
  drawDetections();

  if (detections.length > 0 && quizContainer.classList.contains('hidden') && nameModal.classList.contains('hidden') && statsModal.classList.contains('hidden')) {
      const currentSignClass = detections[0].class;
      if (currentSignClass !== lastDetectedSign || (Date.now() - lastDetectionTime > 5000 && lastDetectedSign === currentSignClass)) {
        lastDetectedSign = currentSignClass;
        lastDetectionTime = Date.now();
        showQuiz(currentSignClass);
      }
  }

  requestAnimationFrame(detectFrame);
}

function drawDetections() {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  detections.forEach(d => {
    const [x, y, w, h] = d.bbox;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(d.class, x, y > 20 ? y - 5 : y + 15);
  });
}

// ΝΕΑ ΣΥΝΑΡΤΗΣΗ ΓΙΑ ΕΠΑΝΕΚΚΙΝΗΣΗ
function resetGame() {
    hideQuiz();
    statsModal.classList.add('hidden');
    nameModal.classList.add('hidden');

    video.classList.add('hidden');
    overlay.classList.add('hidden');
    scoreBoard.classList.add('hidden');
    statsButton.classList.add('hidden');
    endGameButton.classList.add('hidden');
    streakBoardEl.classList.add('hidden');

    introModal.classList.remove('hidden');
    
    // Μηδενισμός των μεταβλητών του παιχνιδιού
    score = 0;
    scoreEl.textContent = score;
    correctStreak = 0;
    totalQuizzes = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    totalTime = 0;
}

async function startGame() {
  try {
    introModal.classList.add('hidden');
    scoreBoard.classList.remove('hidden');
    statsButton.classList.remove('hidden');
    endGameButton.classList.remove('hidden');
    video.classList.remove('hidden');
    overlay.classList.remove('hidden');

    await setupCamera();
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    await loadModel();
    detectFrame();
  } catch (error) {
    console.error("Αποτυχία εκκίνησης του παιχνιδιού:", error);
    introModal.classList.remove('hidden');
    video.classList.add('hidden');
    overlay.classList.add('hidden');
    scoreBoard.classList.add('hidden');
    statsButton.classList.add('hidden');
    endGameButton.classList.add('hidden');
  }
}

window.addEventListener('load', () => {
    startButton.addEventListener('click', startGame);
    endGameButton.addEventListener('click', () => {
        hideQuiz();
        showNameModal();
    });
    saveScoreButton.addEventListener('click', handleSaveScore);
    usernameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleSaveScore();
        }
    });
    statsButton.addEventListener('click', showStatsModal);

    // ΤΩΡΑ ΤΟ ΚΟΥΜΠΙ ΚΛΕΙΣΙΜΟ ΑΠΛΑ ΚΛΕΙΝΕΙ ΤΟ ΠΑΡΑΘΥΡΟ
    closeStatsButton.addEventListener('click', () => {
        statsModal.classList.add('hidden');
    });

    // ΤΟ ΝΕΟ ΚΟΥΜΠΙ ΕΠΑΝΕΚΚΙΝΗΣΗΣ ΠΟΥ ΣΕ ΠΗΓΑΙΝΕΙ ΣΤΗΝ ΑΡΧΙΚΗ ΟΘΟΝΗ
    restartButton.addEventListener('click', resetGame);
});