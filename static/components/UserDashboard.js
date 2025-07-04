export default {
  template: `
    <div class="container mt-4" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <!-- Search Input -->
      <div class="mb-3">
        <input
          type="search"
          class="form-control form-control-lg shadow-sm rounded-pill"
          v-model="searchText"
          placeholder="Search quizzes or subjects..."
          aria-label="Search quizzes or subjects"
        />
      </div>

      <div class="row gx-4">
        <!-- Upcoming Quizzes -->
        <div class="col-md-6 mb-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-primary text-white d-flex align-items-center">
              <i class="fas fa-calendar-alt me-2 fs-5"></i>
              <h5 class="mb-0">Upcoming Quizzes</h5>
            </div>
            <div class="card-body">
              <div v-if="filteredUpcoming.length === 0" class="text-center text-muted py-4">
                No upcoming quizzes found
              </div>
              <div v-else>
                <div v-for="quiz in filteredUpcoming" :key="quiz.id" class="mb-3 border-bottom pb-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="mb-1 fw-semibold">{{ quiz.name }}</h6>
                      <small class="text-muted" v-if="quiz.chapter && quiz.chapter.subject">
                        {{ quiz.chapter.subject.name }} &mdash; {{ quiz.chapter.name }}
                      </small>
                    </div>
                    <div class="text-end">
                      <button
                        @click="openQuizModal(quiz)"
                        class="btn btn-sm btn-outline-primary me-2"
                        aria-label="View quiz details"
                      >
                        <i class="fas fa-info-circle"></i> Details
                      </button>
                      <button
                        @click="launchQuiz(quiz)"
                        class="btn btn-sm btn-success"
                        aria-label="Start quiz"
                      >
                        <i class="fas fa-play"></i> Start
                      </button>
                    </div>
                  </div>
                  <div class="mt-2">
                    <span class="badge bg-info me-2">
                      <i class="fas fa-calendar-day me-1"></i>
                      &#128197{{ formatQuizDate(quiz.date_of_quiz) }}
                    </span>
                    <span class="badge bg-warning text-dark">
                      <i class="fas fa-clock me-1"></i>
                      &#x1F551{{ quiz.time_duration }} mins
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Quizzes -->
        <div class="col-md-6 mb-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-secondary text-white d-flex align-items-center">
              <i class="fas fa-history me-2 fs-5"></i>
              <h5 class="mb-0">Completed Quizzes</h5>
            </div>
            <div class="card-body">
              <div v-if="filteredCompleted.length === 0" class="text-center text-muted py-4">
                No completed quizzes yet
              </div>
              <div v-else>
                <div v-for="quiz in filteredCompleted" :key="quiz.id" class="mb-3 border-bottom pb-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="mb-1 fw-semibold">{{ quiz.name }}</h6>
                      <small class="text-muted" v-if="quiz.chapter && quiz.chapter.subject">
                        {{ quiz.chapter.subject.name }} &mdash; {{ quiz.chapter.name }}
                      </small>
                    </div>
                    <div class="text-end">
                      <button
                        v-if="canRetakeQuiz(quiz)"
                        @click="retakeQuiz(quiz)"
                        class="btn btn-sm btn-warning me-2"
                        aria-label="Retake quiz"
                      >
                        <i class="fas fa-redo me-1"></i> Regive
                      </button>
                      <button
                        @click="displayQuizResults(quiz)"
                        class="btn btn-sm btn-outline-info"
                        aria-label="View quiz results"
                      >
                        <i class="fas fa-chart-bar me-1"></i> Results
                      </button>
                    </div>
                  </div>
                  <div class="mt-2">
                    <span class="badge bg-info me-2">
                      <i class="fas fa-calendar-day me-1"></i>
                      &#128197{{ formatQuizDate(quiz.date_of_quiz) }}
                    </span>
                    <span class="badge bg-success">
                      <i class="fas fa-check-circle me-1"></i> Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Details Modal -->
      <div
        class="modal fade"
        :class="{ show: modalVisible }"
        tabindex="-1"
        :style="{ display: modalVisible ? 'block' : 'none' }"
        aria-modal="true"
        role="dialog"
        v-if="modalVisible"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title">{{ quizSelected?.name }}</h5>
              <button type="button" class="btn-close" aria-label="Close" @click="closeQuizModal"></button>
            </div>
            <div class="modal-body">
              <div v-if="quizSelected" class="row">
                <div class="col-md-6">
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Subject:</strong> {{ quizSelected.chapter.subject.name }}</li>
                    <li class="list-group-item"><strong>Chapter:</strong> {{ quizSelected.chapter.name }}</li>
                    <li class="list-group-item"><strong>Questions:</strong> {{ quizSelected.total_question }}</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Date:</strong> {{ formatQuizDate(quizSelected.date_of_quiz) }}</li>
                    <li class="list-group-item"><strong>Duration:</strong> {{ quizSelected.time_duration }} mins</li>
                    <li class="list-group-item">
                      <strong>Status:</strong>
                      <span :class="quizStatusClass(quizSelected)">
                        {{ quizSelected.status }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeQuizModal">Close</button>
              <button
                v-if="quizSelected?.status === 'upcoming'"
                type="button"
                class="btn btn-primary"
                @click="launchQuiz(quizSelected)"
              >
                <i class="fas fa-play me-1"></i> Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Results Modal -->
      <div
        class="modal fade"
        :class="{ show: resultsModalVisible }"
        tabindex="-1"
        :style="{ display: resultsModalVisible ? 'block' : 'none' }"
        aria-modal="true"
        role="dialog"
        v-if="resultsModalVisible"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title">Quiz Results: {{ quizSelected?.name }}</h5>
              <button type="button" class="btn-close" aria-label="Close" @click="closeResultsModal"></button>
            </div>
            <div class="modal-body">
              <div v-if="quizSelected && quizAnswers">
                <div v-for="(item, idx) in quizAnswers" :key="idx" class="mb-4">
                  <h6>Question {{ idx + 1 }}: {{ item.question }}</h6>
                  <p><strong>Correct Option:</strong> {{ item.answer }}</p>
                  <p><strong>Your Answer:</strong> {{ item.user_answer || 'Not answered' }}</p>
                  <p :class="item.is_correct ? 'text-success' : 'text-danger'">
                    {{ item.is_correct ? 'Correct' : 'Incorrect' }}
                  </p>
                </div>
              </div>
              <div v-else class="text-center text-muted py-4">
                Loading results...
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeResultsModal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      quizList: [],
      isLoading: true,
      modalVisible: false,
      quizSelected: null,
      userToken: localStorage.getItem('auth_token'),
      resultsModalVisible: false,
      quizAnswers: [],
      subjectList: [],
      searchText: "",
    };
  },
  computed: {
    filteredSubjects() {
      const term = this.searchText.toLowerCase();
      return this.subjectList.filter(sub =>
        sub.name.toLowerCase().includes(term)
      );
    },
    filteredUpcoming() {
      const term = this.searchText.toLowerCase();
      return this.upcomingQuizzes.filter(q =>
        q.name.toLowerCase().includes(term)
      );
    },
    filteredCompleted() {
      const term = this.searchText.toLowerCase();
      return this.completedQuizzes.filter(q =>
        q.name.toLowerCase().includes(term)
      );
    },
    upcomingQuizzes() {
      return this.quizList.filter(
        q => !q.is_completed && new Date(q.date_of_quiz) > new Date()
      );
    },
    completedQuizzes() {
      return this.quizList.filter(
        q => q.is_completed || new Date(q.date_of_quiz) <= new Date()
      );
    },
  },
  methods: {
    async fetchQuizList() {
      try {
        const resp = await fetch("/api/user/quizzes", {
          headers: {
            "Authentication-Token": this.userToken,
            "Content-Type": "application/json",
          },
        });
        if (!resp.ok) throw new Error("Failed to fetch quizzes");
        const arr = await resp.json();
        this.quizList = Array.isArray(arr)
          ? arr.map(q => ({ ...q, is_completed: !!q.is_completed }))
          : [];
        this.isLoading = false;
        this.ensureFlatMapPolyfill();
      } catch (err) {
        console.error("Quiz fetch error:", err);
        this.quizList = [];
        this.isLoading = false;
      }
    },
    async fetchSubjectList() {
      try {
        const resp = await fetch("/api/user/subjects", {
          headers: {
            "Authentication-Token": this.userToken,
            "Content-Type": "application/json",
          },
        });
        if (!resp.ok) throw new Error("Error fetching subjects");
        this.subjectList = await resp.json();
      } catch (err) {
        console.error("Subject fetch error:", err);
        this.subjectList = [];
      }
    },
    ensureFlatMapPolyfill() {
      if (!Array.prototype.flatMap) {
        Array.prototype.flatMap = function (cb) {
          return this.reduce((acc, x) => acc.concat(cb(x)), []);
        };
      }
    },
    formatQuizDate(dateStr) {
      const opts = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return new Date(dateStr).toLocaleDateString("en-US", opts);
    },
    quizStatusClass(q) {
      return {
        "text-success": q.is_completed,
        "text-warning": !q.is_completed,
      };
    },
    openQuizModal(q) {
      this.quizSelected = q;
      this.modalVisible = true;
    },
    closeQuizModal() {
      this.modalVisible = false;
      this.quizSelected = null;
    },
    launchQuiz(q) {
      this.$router.push(`/quizzes/${q.id}`);
    },
    canRetakeQuiz(q) {
      return new Date(q.date_of_quiz) > new Date();
    },
    retakeQuiz(q) {
      fetch(`/api/user/quizzes/${q.id}/retake`, {
        method: "POST",
        headers: {
          "Authentication-Token": this.userToken,
          "Content-Type": "application/json",
        },
      })
        .then(resp => {
          if (!resp.ok) throw new Error("Failed to allow quiz retake");
          return resp.json();
        })
        .then(data => {
          alert(data.message);
          this.reloadQuizList();
        })
        .catch(err => {
          console.error("Retake error:", err);
          alert("Failed to allow quiz retake");
        });
    },
    reloadQuizList() {
      this.isLoading = true;
      this.fetchQuizList();
    },
    onQuizFinished() {
      this.reloadQuizList();
      this.$router.push("/");
    },
    async displayQuizResults(q) {
      this.quizSelected = q;
      try {
        const resp = await fetch(`/api/user/quiz/${q.id}/result`, {
          headers: {
            "Authentication-Token": this.userToken,
            "Content-Type": "application/json",
          },
        });
        if (!resp.ok) throw new Error("Failed to fetch quiz results");
        this.quizAnswers = await resp.json();
        this.resultsModalVisible = true;
      } catch (err) {
        console.error("Quiz results fetch error:", err);
        this.quizAnswers = null;
        alert("Failed to fetch quiz results.");
      }
    },
    closeResultsModal() {
      this.resultsModalVisible = false;
      this.quizSelected = null;
      this.quizAnswers = null;
    },
  },
  mounted() {
    this.fetchQuizList();
    this.fetchSubjectList();
    this.$on("quiz-completed", this.onQuizFinished);
  },
};
