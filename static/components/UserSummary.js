export default {
  template: `
    <div class="user-summary container mt-4">
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="loadError" class="alert alert-danger" role="alert">
        {{ loadError }}
      </div>
      <div v-else>
        <div class="row">
          <div class="col-md-6">
            <h3>Total Scores per Quiz</h3>
            <canvas ref="quizScoreChart"></canvas>
          </div>
          <div class="col-md-6">
            <h3>Quizzes per Chapter</h3>
            <canvas ref="chapterQuizChart"></canvas>
          </div>
        </div>
        <button
          class="btn btn-primary"
          @click="handleExport"
          :disabled="isExporting || isDownloading"
        >
          <span v-if="isExporting">
            Exporting...
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </span>
          <span v-else-if="isDownloading">Downloading...</span>
          <span v-else>Export Quiz Data</span>
        </button>
        <div v-if="exportMessage" class="mt-2 alert" :class="{'alert-success': exportWasSuccessful, 'alert-danger': !exportWasSuccessful}" role="alert">
          {{ exportMessage }}
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      quizScores: [],
      chapterQuizCounts: [],
      isLoading: true,
      loadError: null,
      quizScoreChartInstance: null,
      chapterQuizChartInstance: null,
      isExporting: false,
      isDownloading: false,
      exportMessage: null,
      exportWasSuccessful: false,
    };
  },
  mounted() {
    this.loadUserSummary();
  },
  methods: {
    async loadUserSummary() {
      try {
        const response = await fetch('/api/user/summary', {
          headers: {
            'Authentication-Token': localStorage.getItem('auth_token'),
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const summaryData = await response.json();
        this.quizScores = summaryData.scores_per_quiz;
        this.chapterQuizCounts = summaryData.quizzes_per_chapter;

        this.$nextTick(() => {
          this.renderQuizScoreChart();
          this.renderChapterQuizChart();
        });
      } catch (err) {
        console.error('Error loading user summary:', err);
        this.loadError = 'Failed to load user summary. Please try again later.';
      } finally {
        this.isLoading = false;
      }
    },
    renderQuizScoreChart() {
      this.$nextTick(() => {
        const chartElement = this.$refs.quizScoreChart;
        if (!chartElement) {
          console.error('Quiz score chart element not found');
          return;
        }
        if (this.quizScoreChartInstance) {
          this.quizScoreChartInstance.destroy();
        }
        // 10 distinct colors
        const barColors = [
          'rgba(255, 99, 132, 0.7)',    // Red
          'rgba(54, 162, 235, 0.7)',    // Blue
          'rgba(255, 206, 86, 0.7)',    // Yellow
          'rgba(75, 192, 192, 0.7)',    // Teal
          'rgba(153, 102, 255, 0.7)',   // Purple
          'rgba(255, 159, 64, 0.7)',    // Orange
          'rgba(199, 199, 199, 0.7)',   // Grey
          'rgba(255, 87, 34, 0.7)',     // Deep Orange
          'rgba(63, 81, 181, 0.7)',     // Indigo
          'rgba(0, 200, 83, 0.7)'       // Green
        ];
        this.quizScoreChartInstance = new Chart(chartElement, {
          type: 'bar',
          data: {
            labels: this.quizScores.map(q => q.quiz),
            datasets: [{
              label: 'Total Score',
              data: this.quizScores.map(q => q.total_score),
              backgroundColor: this.quizScores.map((_, idx) => barColors[idx % barColors.length]),
              borderColor: this.quizScores.map((_, idx) => barColors[idx % barColors.length].replace('0.7', '1')),
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Total Score' }
              },
              x: {
                title: { display: true, text: 'Quiz' }
              }
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Total Score per Quiz' }
            }
          }
        });
      });
    },
    renderChapterQuizChart() {
      this.$nextTick(() => {
        const chartElement = this.$refs.chapterQuizChart;
        if (!chartElement) {
          console.error('Chapter quiz chart element not found');
          return;
        }
        if (this.chapterQuizChartInstance) {
          this.chapterQuizChartInstance.destroy();
        }
        // 10 distinct colors (same as above, or change as you like)
        const barColors = [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(255, 87, 34, 0.7)',
          'rgba(63, 81, 181, 0.7)',
          'rgba(0, 200, 83, 0.7)'
        ];
        this.chapterQuizChartInstance = new Chart(chartElement, {
          type: 'bar',
          data: {
            labels: this.chapterQuizCounts.map(c => c.chapter),
            datasets: [{
              label: 'Number of Quizzes',
              data: this.chapterQuizCounts.map(c => c.quiz_count),
              backgroundColor: this.chapterQuizCounts.map((_, idx) => barColors[idx % barColors.length]),
              borderColor: this.chapterQuizCounts.map((_, idx) => barColors[idx % barColors.length].replace('0.7', '1')),
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Quizzes' },
                ticks: { stepSize: 1 }
              },
              x: {
                title: { display: true, text: 'Chapter' }
              }
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Quizzes per Chapter' }
            }
          }
        });
      });
    },
    async handleExport() {
      this.isExporting = true;
      this.exportWasSuccessful = false;
      this.exportMessage = 'Preparing export...';
      try {
        const response = await fetch('/download-csv', {
          method: 'GET',
          headers: {
            'Authentication-Token': localStorage.getItem('auth_token'),
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const exportTask = await response.json();
        const exportTaskId = exportTask.task_id;
        this.exportMessage = 'Export task started. Checking status...';
        this.checkExportProgress(exportTaskId);
      } catch (err) {
        console.error('Error initiating export:', err);
        this.exportMessage = 'Failed to start export. Please try again later.';
        this.exportWasSuccessful = false;
      } finally {
        this.isExporting = false;
      }
    },
    async checkExportProgress(taskId) {
      try {
        const response = await fetch(`/get-csv/${taskId}`, {
          headers: {
            'Authentication-Token': localStorage.getItem('auth_token'),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            this.exportMessage = 'Export not found. It may have expired.';
          } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          this.exportWasSuccessful = false;
          return;
        }

        if (response.headers.get('Content-Type') === 'application/json') {
          const progressData = await response.json();
          if (progressData.status === 'pending') {
            this.exportMessage = `Export pending. Progress: ${progressData.progress || 'Unknown'}`;
            setTimeout(() => this.checkExportProgress(taskId), 2000);
          } else if (progressData.message) {
            this.exportMessage = progressData.message;
            this.exportWasSuccessful = false;
          } else {
            this.exportMessage = 'Unexpected server response.';
            this.exportWasSuccessful = false;
          }
        } else {
          this.exportMessage = 'Export complete. Preparing download...';
          const contentDisposition = response.headers.get('Content-Disposition');
          const fileName = contentDisposition?.split('filename=')[1]?.replace(/['"]/g, '') || 'quiz_export.csv';
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = downloadUrl;
          anchor.download = fileName;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(downloadUrl);
          this.exportMessage = 'Download complete.';
          this.exportWasSuccessful = true;
        }
      } catch (err) {
        console.error('Error checking export progress:', err);
        this.exportMessage = 'Failed to check export status. Please try again later.';
        this.exportWasSuccessful = false;
      }
    },
    async downloadExportedFile(taskId, fileName) {
      this.isDownloading = true;
      this.exportMessage = 'Downloading file...';
      try {
        const response = await fetch(`/get-csv/${taskId}`, {
          headers: {
            'Authentication-Token': localStorage.getItem('auth_token'),
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(downloadUrl);

        this.exportMessage = 'Download complete.';
        this.exportWasSuccessful = true;
      } catch (err) {
        console.error('Error downloading file:', err);
        this.exportMessage = 'Failed to download file.';
        this.exportWasSuccessful = false;
      } finally {
        this.isDownloading = false;
      }
    },
  }
};
