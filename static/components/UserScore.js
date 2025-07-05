export default {
  template: `
    <div class="container mt-4">
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <h4 class="mb-0">
            <i class="fas fa-chart-bar me-2"></i>Quiz Scores
          </h4>
        </div>
        <div class="card-body">
          <div v-if="isDataLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else>
            <div v-if="noQuizScores" class="text-center text-muted py-4">
              No quiz scores available
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Quiz Name</th>
                    <th>Date Completed</th>
                    <th class="text-end">Marks Scored</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="quizScore in quizScoreList" :key="quizScore.id">
                    <td>{{ quizScore.quiz.name }}</td>
                    <td>{{ formatDateToIST(quizScore.timestamp) }}</td>
                    <td class="text-end fw-bold">
                      <span class="text-success">{{ quizScore.total_score }}</span> /
                      <span class="text-muted">{{ quizScore.quiz.total_question }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      quizScoreList: [],
      isDataLoading: true,
      userAuthToken: localStorage.getItem('auth_token')
    }
  },
  computed: {
    noQuizScores() {
      return !Array.isArray(this.quizScoreList) || this.quizScoreList.length === 0;
    }
  },
  methods: {
    formatDateToIST(utcTimestamp) {
      const utcDate = new Date(utcTimestamp);
      // IST is UTC +5:30 (330 minutes)
      utcDate.setMinutes(utcDate.getMinutes() + 330);
      return utcDate.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    loadQuizScores() {
      this.isDataLoading = true;
      fetch('/api/user/scores', {
        headers: {
          'Authentication-Token': this.userAuthToken,
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch quiz scores');
          return response.json();
        })
        .then(scoreData => {
          this.quizScoreList = scoreData;
        })
        .catch(fetchError => {
          console.error('Error loading quiz scores:', fetchError);
          this.quizScoreList = [];
        })
        .finally(() => {
          this.isDataLoading = false;
        });
    }
  },
  mounted() {
    this.loadQuizScores();
  }
}
