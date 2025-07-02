
export default {
    template: `
    <div class="container-fluid bg-white py-5 min-vh-100">
  <div class="row justify-content-center">
    <div class="col-12 col-xl-10">
      <h2 class="fw-bold mb-4 text-center" style="font-family: 'Segoe UI', sans-serif; color: #34495e;">
        Admin Summary
      </h2>

      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-danger rounded-3 shadow-sm" role="alert">
        {{ error }}
      </div>

      <div v-else>
        <!-- Summary Cards -->
        <div class="row mb-5 g-4">
          <div class="col-md-4">
            <div class="card shadow-sm rounded-4 border-0 h-100">
              <div class="card-body d-flex flex-column justify-content-center align-items-center">
                <h5 class="card-title fw-semibold text-secondary">Total Users</h5>
                <p class="display-4 fw-bold text-primary">{{ totalUsers }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card shadow-sm rounded-4 border-0 h-100">
              <div class="card-body d-flex flex-column justify-content-center align-items-center">
                <h5 class="card-title fw-semibold text-secondary">Total Subjects</h5>
                <p class="display-4 fw-bold text-primary">{{ totalSubjects }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card shadow-sm rounded-4 border-0 h-100">
              <div class="card-body d-flex flex-column justify-content-center align-items-center">
                <h5 class="card-title fw-semibold text-secondary">Total Quizzes</h5>
                <p class="display-4 fw-bold text-primary">{{ totalQuizzes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="row g-4 mb-5 justify-content-center">
          <div class="col-md-6 d-flex justify-content-center">
            <canvas ref="subjectsChart" class="shadow rounded-4" style="max-width: 100%; height: 300px;"></canvas>
          </div>
          <div class="col-md-6 d-flex justify-content-center">
            <canvas ref="questionsChart" class="shadow rounded-4" style="max-width: 100%; height: 300px;"></canvas>
          </div>
        </div>

        <!-- Export Button -->
        <div class="text-center">
          <button
            class="btn btn-primary rounded-pill px-4 py-2 shadow-sm"
            @click="exportData"
            :disabled="exporting"
            style="min-width: 220px;"
          >
            <span v-if="exporting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {{ exporting ? 'Exporting...' : 'Export User Performance Data' }}
          </button>
          <div v-if="exportMessage" class="mt-3 fw-semibold text-success">
            {{ exportMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    `,
    data() {
        return {
            totalUsers: 0,
            totalSubjects: 0,
            totalQuizzes: 0,
            subjectsData: [],
            loading: true,
            error: null,
            charts: [],
            exporting: false,
            exportMessage: null,
        };
    },
    mounted() {
        this.fetchSummaryData();
    },
    methods: {
        async fetchSummaryData() {
            try {
                
                const response = await fetch('/api/admin/summary', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth_token'),
                        'Content-Type': 'application/json',
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data &&
                    typeof data.total_users === 'number' &&
                    typeof data.total_quizzes === 'number' &&
                    typeof data.total_subjects === 'number') {
                    this.totalUsers = data.total_users;
                    this.totalQuizzes = data.total_quizzes;
                    this.totalSubjects = data.total_subjects;                    
                    this.subjectsData = Array.isArray(data.subjects_data) ? data.subjects_data : [];
                    this.$nextTick(() => {
                        this.createCharts();
                    });
                } else {
                    throw new Error('Invalid data structure received from API');
                }
            } catch (error) {
                this.error = 'Failed to load summary data. Please try again later.';
            } finally {
                this.loading = false;
            }
        },

        createCharts() {
            this.$nextTick(() => {
                this.destroyCharts();
                if (this.subjectsData.length > 0) {
                    const subjectsChart = this.createSubjectsChart();
                    const questionsChart = this.createQuestionsChart();
                    if (subjectsChart) this.charts.push(subjectsChart);
                    if (questionsChart) this.charts.push(questionsChart);
                } else {
                    console.warn('No subject data available so no chart will be created');
                }
            });
        },
        destroyCharts() {
            this.charts.forEach(chart => chart.destroy());
            this.charts = [];
        },
        createSubjectsChart() {
            const ctx = this.$refs.subjectsChart;
            if (!ctx) {
                console.error('Subjects Chart element not found');
                return null;
            }
            return new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.subjectsData.map(subject => subject.name),
                    datasets: [
                        {
                            label: 'Chapters',
                            data: this.subjectsData.map(subject => subject.chapters),
                            backgroundColor: 'rgba(75, 192, 192, 0.6)'
                        },
                        {
                            label: 'Quizzes',
                            data: this.subjectsData.map(subject => subject.quizzes),
                            backgroundColor: 'rgba(153, 102, 255, 0.6)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Count'
                            },
                            ticks: {
                                stepSize: 1,
                                callback: function (value) {
                                    return Math.floor(value);
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Subjects'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Chapters and Quizzes by Subject'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },

        createQuestionsChart() {
            const ctx = this.$refs.questionsChart;
            if (!ctx) {
                console.error('QuestionsChart element not found');
                return null;
            }
            return new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: this.subjectsData.map(subject => subject.name),
                    datasets: [{
                        label: 'Total Questions',
                        data: this.subjectsData.map(subject => subject.total_question),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Total Questions by Subject'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },
        async exportData() {
            this.exporting = true;
            this.exportMessage = 'Preparing export...';
            try {
                const response = await fetch('/admin/download-csv', {
                    method: 'GET',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth_token'),
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                const taskId = data.task_id;
                this.exportMessage = 'Export task started. Checking status...';
                this.checkExportStatus(taskId);
            } catch (error) {
                console.error('Error triggering export:', error);
                this.exportMessage = 'Failed to trigger export. Please try again later.';
                this.error = error.message;
            } finally {
                this.exporting = false;
            }
        },
        async checkExportStatus(taskId) {
            try {
                const response = await fetch(`/admin/get-csv/${taskId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth_token'),
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                if (response.headers.get('Content-Type') === 'application/json') {
                    const data = await response.json();
                    if (data.status === 'pending') {
                        this.exportMessage = `Export pending. Progress: ${data.message || 'Unknown'}`;
                        setTimeout(() => this.checkExportStatus(taskId), 3000);
                    } else {
                        this.exportMessage = data.message || 'Export failed. Please try again.';
                        this.error = this.exportMessage;
                    }
                } else {
                    const filename = response.headers.get('Content-Disposition').split('filename=')[1];
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    this.exportMessage = 'Download complete.';

                }

            } catch (error) {
                console.error('Error checking export status:', error);
                this.exportMessage = 'Failed to check export status. Please try again later.';
                this.error = error.message;
            }
        },

    }
}

