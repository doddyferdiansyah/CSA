/* /assets/ujian.js */

(function () {
  const STORAGE_KEY = "se_training_exam_v1";
  const PASSING_SCORE = 70;
  const TOTAL_QUESTIONS = 10;

  const DEFAULT_QUESTIONS = [
    { id: "soal-1", title: "Email Internal Palsu", type: "Klik red flag", path: "soal-1.html" },
    { id: "soal-2", title: "Chat Atasan Palsu", type: "Klik red flag", path: "soal-2.html" },
    { id: "soal-3", title: "SMS / QR / Paket Palsu", type: "Klik red flag", path: "soal-3.html" },
    { id: "soal-4", title: "Website Bank Palsu", type: "Klik URL mencurigakan", path: "soal-4.html" },
    { id: "soal-5", title: "Wi-Fi Kafe", type: "Pilih keputusan aman", path: "soal-5.html" },
    { id: "soal-6", title: "Bandingkan Halaman Login", type: "Pilih yang lebih aman", path: "soal-6.html" },
    { id: "soal-7", title: "Whiteboard Meeting", type: "Pilih data sensitif", path: "soal-7.html" },
    { id: "soal-8", title: "Temukan Risiko di Meja Kerja", type: "Klik area berisiko", path: "soal-8.html" },
    { id: "soal-9", title: "Prompt MFA / OAuth / QR", type: "Pilih yang harus ditolak", path: "soal-9.html" },
    { id: "soal-10", title: "Pesan Doxing di HP", type: "Pilih respons aman", path: "soal-10.html" }
  ];

  function createDefaultState() {
    const questions = {};
    DEFAULT_QUESTIONS.forEach((q) => {
      questions[q.id] = {
        id: q.id,
        title: q.title,
        type: q.type,
        path: q.path,
        score: null,
        completed: false,
        answeredAt: null
      };
    });

    return {
      version: 1,
      passingScore: PASSING_SCORE,
      totalQuestions: TOTAL_QUESTIONS,
      questions,
      participantName: "",
      attendanceEligible: true,
      completionEligible: false,
      lastUpdated: null
    };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = createDefaultState();
        writeState(fresh);
        return fresh;
      }

      const parsed = JSON.parse(raw);
      const base = createDefaultState();

      if (!parsed || typeof parsed !== "object") {
        writeState(base);
        return base;
      }

      // merge aman
      const merged = {
        ...base,
        ...parsed,
        questions: {
          ...base.questions,
          ...(parsed.questions || {})
        }
      };

      // pastikan semua default questions ada
      DEFAULT_QUESTIONS.forEach((q) => {
        if (!merged.questions[q.id]) {
          merged.questions[q.id] = {
            id: q.id,
            title: q.title,
            type: q.type,
            path: q.path,
            score: null,
            completed: false,
            answeredAt: null
          };
        } else {
          merged.questions[q.id].id = q.id;
          merged.questions[q.id].title = q.title;
          merged.questions[q.id].type = q.type;
          merged.questions[q.id].path = q.path;
        }
      });

      return merged;
    } catch (error) {
      console.error("Gagal membaca state ujian:", error);
      const fresh = createDefaultState();
      writeState(fresh);
      return fresh;
    }
  }

  function writeState(state) {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getState() {
    return readState();
  }

  function setParticipantName(name) {
    const state = readState();
    state.participantName = (name || "").trim();
    writeState(state);
  }

  function getParticipantName() {
    return readState().participantName || "";
  }

  function saveScore(questionId, score) {
    const state = readState();
    if (!state.questions[questionId]) {
      console.warn(`Question ID tidak ditemukan: ${questionId}`);
      return;
    }

    const safeScore = normalizeScore(score);
    state.questions[questionId].score = safeScore;
    state.questions[questionId].completed = true;
    state.questions[questionId].answeredAt = new Date().toISOString();

    state.completionEligible = getTotalScoreFromState(state) >= state.passingScore;
    writeState(state);
  }

  function normalizeScore(score) {
    const n = Number(score);
    if (Number.isNaN(n)) return 0;
    if (n < 0) return 0;
    if (n > 10) return 10;
    return Math.round(n);
  }

  function markCompleted(questionId) {
    const state = readState();
    if (!state.questions[questionId]) return;

    state.questions[questionId].completed = true;
    if (state.questions[questionId].score === null) {
      state.questions[questionId].score = 0;
    }
    state.questions[questionId].answeredAt = new Date().toISOString();
    state.completionEligible = getTotalScoreFromState(state) >= state.passingScore;
    writeState(state);
  }

  function isQuestionCompleted(questionId) {
    const state = readState();
    return Boolean(state.questions[questionId]?.completed);
  }

  function getQuestionScore(questionId) {
    const state = readState();
    const score = state.questions[questionId]?.score;
    return typeof score === "number" ? score : null;
  }

  function getQuestionState(questionId) {
    const state = readState();
    return state.questions[questionId] || null;
  }

  function getAllQuestions() {
    const state = readState();
    return DEFAULT_QUESTIONS.map((q) => state.questions[q.id]);
  }

  function getCompletedCount() {
    const state = readState();
    return Object.values(state.questions).filter((q) => q.completed).length;
  }

  function getTotalScore() {
    return getTotalScoreFromState(readState());
  }

  function getTotalScoreFromState(state) {
    return Object.values(state.questions).reduce((acc, q) => {
      return acc + (typeof q.score === "number" ? q.score : 0);
    }, 0);
  }

  function isPassed() {
    const state = readState();
    return getTotalScoreFromState(state) >= state.passingScore;
  }

  function isExamFinished() {
    return getCompletedCount() >= TOTAL_QUESTIONS;
  }

  function getUnfinishedQuestions() {
    const state = readState();
    return Object.values(state.questions).filter((q) => !q.completed);
  }

  function resetExam() {
    const fresh = createDefaultState();
    writeState(fresh);
    return fresh;
  }

  function getSummary() {
    const state = readState();
    const totalScore = getTotalScoreFromState(state);
    const completedCount = Object.values(state.questions).filter((q) => q.completed).length;
    const unfinishedCount = TOTAL_QUESTIONS - completedCount;

    return {
      totalScore,
      completedCount,
      unfinishedCount,
      isPassed: totalScore >= state.passingScore,
      isFinished: completedCount >= TOTAL_QUESTIONS,
      passingScore: state.passingScore,
      totalQuestions: TOTAL_QUESTIONS,
      attendanceEligible: true,
      completionEligible: totalScore >= state.passingScore
    };
  }

  function renderExamCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = readState();
    const questions = DEFAULT_QUESTIONS.map((q) => state.questions[q.id]);

    container.innerHTML = "";

    questions.forEach((q, index) => {
      const card = document.createElement("div");
      card.className = "exam-card";

      const badgeClass = q.completed
        ? (q.score >= 7 ? "badge-success" : q.score >= 4 ? "badge-warning" : "badge-danger")
        : "";

      const statusText = q.completed
        ? `Selesai`
        : `Belum dikerjakan`;

      const scoreText = q.completed && typeof q.score === "number"
        ? `${q.score}/10`
        : `-`;

      card.innerHTML = `
        <div class="exam-card-top">
          <div class="exam-number">${index + 1}</div>
          <div class="status-chip ${badgeClass}">${statusText}</div>
        </div>
        <div class="exam-title">${escapeHtml(q.title)}</div>
        <div class="exam-desc">${escapeHtml(q.type)}</div>
        <div class="exam-meta">ID: ${escapeHtml(q.id)}</div>
        <div class="exam-status">
          <div class="exam-score">Skor: ${scoreText}</div>
          <a class="btn btn-secondary" href="${escapeAttribute(q.path)}">Buka Soal</a>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function renderDashboardStats(config = {}) {
    const summary = getSummary();

    setText(config.totalScoreId, `${summary.totalScore}/100`);
    setText(config.completedCountId, `${summary.completedCount}/${summary.totalQuestions}`);
    setText(config.unfinishedCountId, `${summary.unfinishedCount}`);
    setText(config.passStatusId, summary.isPassed ? "Lulus" : "Belum lulus");

    const passEl = getElement(config.passStatusId);
    if (passEl) {
      passEl.classList.remove("success-text", "warning-text", "danger-text");
      if (summary.isPassed) {
        passEl.classList.add("success-text");
      } else if (summary.totalScore >= 40) {
        passEl.classList.add("warning-text");
      } else {
        passEl.classList.add("danger-text");
      }
    }
  }

  function renderResultPage(config = {}) {
    const summary = getSummary();
    const totalScore = summary.totalScore;
    const resultTitle = getElement(config.titleId);
    const resultSummary = getElement(config.summaryId);
    const resultList = getElement(config.listId);
    const completionBtn = getElement(config.completionButtonId);
    const attendanceBtn = getElement(config.attendanceButtonId);
    const participantNameEl = getElement(config.participantNameId);

    if (participantNameEl) {
      participantNameEl.textContent = getParticipantName() || "Peserta";
    }

    if (resultTitle) {
      if (summary.isPassed) {
        resultTitle.textContent = "Selamat, Anda lulus uji pemahaman";
        resultTitle.className = "success-text";
      } else if (summary.isFinished) {
        resultTitle.textContent = "Ujian selesai, tetapi skor belum memenuhi batas lulus";
        resultTitle.className = "warning-text";
      } else {
        resultTitle.textContent = "Ujian belum selesai";
        resultTitle.className = "danger-text";
      }
    }

    if (resultSummary) {
      if (summary.isPassed) {
        resultSummary.textContent = `Anda menyelesaikan seluruh soal dengan skor ${totalScore}/100. Anda berhak melanjutkan ke Certificate of Completion.`;
      } else if (summary.isFinished) {
        resultSummary.textContent = `Anda sudah menyelesaikan seluruh soal, tetapi skor Anda baru ${totalScore}/100. Batas lulus saat ini adalah ${summary.passingScore}/100.`;
      } else {
        resultSummary.textContent = `Anda baru menyelesaikan ${summary.completedCount} dari ${summary.totalQuestions} soal. Selesaikan seluruh soal untuk melihat hasil akhir.`;
      }
    }

    if (resultList) {
      resultList.innerHTML = "";
      const bullets = [
        `Total skor Anda: ${totalScore}/100`,
        `Soal selesai: ${summary.completedCount} dari ${summary.totalQuestions}`,
        `Batas lulus: ${summary.passingScore}/100`,
        summary.completionEligible
          ? "Status completion: memenuhi syarat"
          : "Status completion: belum memenuhi syarat",
        "Certificate of Attendance tetap dapat diberikan kepada peserta training sesuai kebijakan penyelenggara."
      ];

      bullets.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        resultList.appendChild(li);
      });
    }

    if (completionBtn) {
      completionBtn.style.display = summary.completionEligible ? "inline-flex" : "none";
    }

    if (attendanceBtn) {
      attendanceBtn.style.display = "inline-flex";
    }
  }

  function bindResetButton(buttonId, options = {}) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener("click", function () {
      const confirmed = window.confirm(
        options.confirmMessage || "Yakin ingin mereset seluruh progres ujian?"
      );

      if (!confirmed) return;

      resetExam();

      if (options.onAfterReset === "reload") {
        window.location.reload();
        return;
      }

      if (options.redirectTo) {
        window.location.href = options.redirectTo;
        return;
      }

      window.location.reload();
    });
  }

  function bindParticipantName(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.value = getParticipantName();

    input.addEventListener("input", function () {
      setParticipantName(input.value);
    });
  }

  function setText(id, value) {
    const el = getElement(id);
    if (el) el.textContent = value;
  }

  function getElement(id) {
    if (!id) return null;
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  // Expose global helper untuk dipakai di masing-masing soal
  window.UjianApp = {
    STORAGE_KEY,
    PASSING_SCORE,
    TOTAL_QUESTIONS,
    DEFAULT_QUESTIONS,
    getState,
    saveScore,
    markCompleted,
    getQuestionScore,
    getQuestionState,
    getAllQuestions,
    getCompletedCount,
    getTotalScore,
    getSummary,
    isPassed,
    isExamFinished,
    isQuestionCompleted,
    getUnfinishedQuestions,
    resetExam,
    renderExamCards,
    renderDashboardStats,
    renderResultPage,
    bindResetButton,
    bindParticipantName,
    setParticipantName,
    getParticipantName
  };

  // Self-check dasar
  console.assert(typeof window.UjianApp.saveScore === "function", "saveScore should exist");
  console.assert(typeof window.UjianApp.getTotalScore === "function", "getTotalScore should exist");
  console.assert(window.UjianApp.DEFAULT_QUESTIONS.length === 10, "Should contain 10 default questions");
})();
