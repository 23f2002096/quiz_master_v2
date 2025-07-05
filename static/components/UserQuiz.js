export default {
  template: `
    <div v-if="loadingQuiz" class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else>
      <div class="container-fluid quiz-container bg-light py-4 px-2 px-md-5">
        <!-- Quiz Header -->
        <div class="quiz-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 p-3 rounded shadow bg-white position-relative">
          <div class="quiz-info mb-2 mb-md-0">
            <h2 class="quiz-title text-primary mb-1">{{ quizDetails.name }}</h2>
            <p class="quiz-subtitle text-muted mb-0" v-if="quizDetails?.chapter?.subject">
              {{ quizDetails.chapter.subject.name }} - {{ quizDetails.chapter.name }}
            </p>
          </div>
          <div class="timer-section d-flex align-items-center bg-light rounded px-3 py-2 shadow-sm">
            <i class="fas fa-clock text-danger fa-lg me-2"></i>
            <span class="time-text h4 mb-0 font-weight-bold" :class="{ 'text-danger': secondsLeft < 60 }">{{ displayTime }}</span>
            <button 
              @click="toggleTimerPause"
              class="btn btn-sm btn-outline-secondary ms-3"
              :aria-label="timerPaused ? 'Resume Timer' : 'Pause Timer'"
            >
              <i class="fas" :class="timerPaused ? 'fa-play' : 'fa-pause'"></i>
            </button>
          </div>
          <!-- Progress Bar -->
          <div class="position-absolute w-100" style="bottom: -8px; left: 0;">
            <div class="progress" style="height: 6px;">
              <div 
                class="progress-bar bg-primary"
                role="progressbar"
                :style="{ width: progressPercent + '%' }"
                :aria-valuenow="progressPercent"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        </div>

        <!-- Question Navigation -->
        <div class="question-navigation mb-4">
          <div class="d-flex flex-wrap gap-2 justify-content-center">
            <button 
              v-for="(q, idx) in totalQuestions"
              :key="idx"
              class="btn btn-sm question-nav-btn rounded-circle"
              :class="{
                'btn-primary text-white shadow': idx === activeQuestionIndex,
                'btn-outline-primary': idx !== activeQuestionIndex
              }"
              @click="navigateToQuestion(idx)"
              :aria-current="idx === activeQuestionIndex"
              :tabindex="0"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>

        <!-- Question Section -->
        <div class="question-section" v-if="currentQuestion">
          <div class="card question-card shadow border-0" style="background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%);">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3 rounded-top">
              <span class="question-number h5 mb-0">
                <i class="fas fa-question-circle me-2"></i>
                Question {{ activeQuestionIndex + 1 }}: {{ currentQuestion.title }}
              </span>
              <span class="marks h5 mb-0"><i class="fas fa-star text-warning me-1"></i>1 mark</span>
            </div>
            <div class="card-body">
              <p 
                class="question-statement text-center mb-4 lead text-dark fw-semibold"
                style="font-size: 1.25rem; font-family: 'Georgia', serif; color: #222; letter-spacing: 0.5px;"
              >
                {{ currentQuestion.question }}
              </p>
              <div class="options-list">
                <div class="row justify-content-center">
                  <div class="col-md-10">
                    <div class="row g-3">
                      <div 
                        v-for="(option, optIdx) in currentQuestion.options"
                        :key="optIdx"
                        class="col-md-6"
                      >
                        <div class="form-check option-item">
                          <input 
                            type="radio"
                            :name="'question'+activeQuestionIndex"
                            :id="'option'+optIdx"
                            class="form-check-input"
                            :value="option"
                            v-model="selectedAnswers[activeQuestionIndex]"
                          >
                          <label 
                            :for="'option'+optIdx"
                            class="form-check-label option-label px-2 py-2 rounded"
                            :class="{
                              'bg-primary text-white fw-bold shadow-sm': selectedAnswers[activeQuestionIndex] === option,
                              'bg-light': selectedAnswers[activeQuestionIndex] !== option
                            }"
                            style="font-size: 1rem; font-family: 'Georgia', serif; color: #333; letter-spacing: 0.5px; cursor: pointer; transition: background 0.2s, color 0.2s;"
                          >
                            {{ option }}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz Controls -->
        <div class="quiz-controls mt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <button 
            class="btn btn-secondary px-4"
            @click="goToPreviousQuestion"
            :disabled="activeQuestionIndex === 0"
          >
            <i class="fas fa-chevron-left me-2"></i>Previous
          </button>
          <button 
            class="btn btn-success px-4"
            @click="submitQuizAnswers"
            :disabled="submittingQuiz"
            v-if="activeQuestionIndex === totalQuestions - 1"
          >
            Submit<i class="fas fa-check ms-2"></i>
          </button>
          <button 
            class="btn btn-primary px-4"
            @click="goToNextQuestion"
            v-else
          >
            Next<i class="fas fa-chevron-right ms-2"></i>
          </button>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      quizDetails: { chapter: { subject: {} } },
      questions: [],
      activeQuestionIndex: 0,
      secondsLeft: 0,
      timerPaused: false,
      loadingQuiz: true,
      timerInterval: null,
      selectedAnswers: [],
      userToken: localStorage.getItem('auth_token'),
      submittingQuiz: false
    };
  },

  computed: {
    currentQuestion() {
      return this.questions[this.activeQuestionIndex] || null;
    },
    totalQuestions() {
      return this.questions.length;
    },
    displayTime() {
      let s = this.secondsLeft;
      const h = Math.floor(s / 3600);
      s -= h * 3600;
      const m = Math.floor(s / 60);
      s -= m * 60;
      return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
    },
    progressPercent() {
      if (!this.totalQuestions) return 0;
      return Math.round(((this.activeQuestionIndex + 1) / this.totalQuestions) * 100);
    }
  },

  methods: {
    loadQuizData() {
      this.loadingQuiz = true;
      const quizId = this.$route.params.id;
      fetch(`/api/user/quiz/${quizId}`, {
        headers: { 'Authentication-Token': this.userToken }
      })
        .then(res => res.json())
        .then(data => {
          this.quizDetails = data.quiz;
          this.questions = data.questions;
          this.selectedAnswers = Array(this.questions.length).fill(null);
          // Timer setup
          let totalSecs = 600;
          if (this.quizDetails.time_duration) {
            const [h, m] = this.quizDetails.time_duration.split(':').map(Number);
            totalSecs = (h || 0) * 3600 + (m || 0) * 60;
          }
          this.secondsLeft = totalSecs;

          // If completed or expired, redirect
          const now = Date.now();
          const due = new Date(this.quizDetails.due_date).getTime();
          if (this.quizDetails.is_completed || now > due) {
            this.$router.replace('/completed-quizzes');
          } else {
            this.startQuizTimer();
          }
        })
        .catch(() => {
          alert('Failed to load quiz.');
        })
        .finally(() => {
          this.loadingQuiz = false;
        });
    },

    startQuizTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (!this.timerPaused && this.secondsLeft > 0) {
          this.secondsLeft--;
        }
        if (this.secondsLeft === 0) {
          clearInterval(this.timerInterval);
          this.submitQuizAnswers();
        }
      }, 1000);
    },

    toggleTimerPause() {
      this.timerPaused = !this.timerPaused;
    },

    navigateToQuestion(idx) {
      this.activeQuestionIndex = idx;
    },

    goToNextQuestion() {
      if (this.activeQuestionIndex < this.totalQuestions - 1) {
        this.activeQuestionIndex++;
      }
    },

    goToPreviousQuestion() {
      if (this.activeQuestionIndex > 0) {
        this.activeQuestionIndex--;
      }
    },

    submitQuizAnswers() {
      if (this.submittingQuiz) return;
      this.submittingQuiz = true;
      if (this.timerInterval) clearInterval(this.timerInterval);

      // Convert answers array to object
      const answersObject = {};
      this.selectedAnswers.forEach((ans, idx) => {
        if (ans !== null && ans !== undefined) {
          answersObject[(idx + 1).toString()] = ans;
        }
      });

      fetch(`/api/user/quiz/${this.quizDetails.id}/submit`, {
        method: 'POST',
        headers: {
          'Authentication-Token': this.userToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersObject })
      })
        .then(async res => {
          if (!res.ok) {
            let msg = 'Failed to submit quiz.';
            try {
              const err = await res.json();
              msg = err.message || msg;
            } catch {}
            throw new Error(msg);
          }
          return res.json();
        })
        .then(() => {
          this.$emit('quiz-completed', this.quizDetails.id);
          this.$router.push('/');
        })
        .catch(err => {
          alert(err.message || 'Submission failed.');
        })
        .finally(() => {
          this.submittingQuiz = false;
        });
    }
  },

  mounted() {
    this.loadQuizData();
  },

  beforeDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
};
