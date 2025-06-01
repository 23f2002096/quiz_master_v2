
export default {
  template: `
   <div class="container-fluid bg-white py-5 min-vh-100">
  <div class="row justify-content-center">
    <div class="col-12 col-xl-11">
      <div class="mb-5 text-center">
        <h2 class="fw-bold" style="font-family: 'Segoe UI', sans-serif; color: #34495e;">
          Quiz Management
        </h2>
      </div>

      <!-- Action Row -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        
        <input
          type="text"
          class="form-control w-100 w-md-50 border-2"
          v-model="searchQuery"
          placeholder="Search quizzes or questions..."
        />
      </div>

      <!-- Chapters Cards -->
      <div v-if="filteredChapters.length" class="row g-4">
        <div v-for="chapter in filteredChapters" :key="chapter.id" class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="fw-bold text-dark">{{ chapter.name }}</h5>
              <p class="text-muted small">{{ chapter.description }}</p>
              <p class="text-muted small">Number of Quizzes: {{ chapter.quizzes?.length || 0 }}</p>

              <!-- Quizzes List -->
              <div v-if="chapter.quizzes?.length" class="mt-3">
                <h6 class="fw-semibold text-primary mb-3">Quizzes</h6>
                <div class="row g-3">
                  <div v-for="quiz in chapter.quizzes" :key="quiz.id" class="col-md-12">
                    <div class="border rounded p-3 bg-light d-flex flex-column">
                      <h6 class="mb-1">{{ quiz.name }}</h6>
                      <p class="text-muted small mb-1"><strong>Duration:</strong> {{ quiz.time_duration.split(' ')[1] || quiz.time_duration }} mins</p>
                      <p class="text-muted small mb-1"><strong>Questions:</strong> {{ quiz.total_question || 'N/A' }}</p>
                      <p class="text-muted small mb-3"><strong>Remarks:</strong> {{ quiz.remarks || 'No remarks' }}</p>

                      <div class="d-flex flex-wrap gap-2 mb-3">
                        <button class="btn btn-outline-secondary btn-sm" @click="editQuiz(quiz)">
                          <i class="fa fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm" @click="deleteQuiz(quiz.id)">
                          <i class="fa fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-outline-info btn-sm" @click="openQuestionModal(quiz.id)">
                          <i class="fa fa-plus"></i> Add Question
                        </button>
                      </div>

                      <!-- Questions List -->
                      <div v-if="quiz.questions?.length">
                        <h6 class="fw-semibold text-secondary mb-2">Questions</h6>
                        <ul class="list-unstyled small">
                          <li v-for="question in quiz.questions" :key="question.id" class="mb-2">
                            <strong>{{ question.title || 'Untitled Question' }}:</strong> {{ question.question }}
                            <div class="mt-1">
                              <button class="btn btn-outline-secondary btn-sm me-2" @click="editQuestion(quiz.id, question)">
                                <i class="fa fa-edit"></i> Edit
                              </button>
                              <button class="btn btn-outline-danger btn-sm" @click="deleteQuestion(quiz.id, question.id)">
                                <i class="fa fa-trash"></i> Delete
                              </button>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <p v-else class="text-muted small">No questions available for this quiz.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center mt-3 text-muted">
                No quizzes available for this chapter.
              </div>

              <!-- Add Quiz Button -->
              <button class="btn btn-primary btn-sm mt-auto align-self-start" @click="openQuizModal(chapter.id)" style="border-radius: 20px;">
                <i class="fa fa-plus"></i> Add Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Chapters -->
      <div v-else class="text-center mt-5 text-muted">
        <i class="fa fa-folder-open fs-3 d-block mb-2"></i>
        <p>No chapters available. Add a chapter to get started.</p>
      </div>

      <!-- Quiz Modal -->
      <div v-if="showQuizModal" class="modal fade show d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content border-0 shadow rounded-4">
            <div class="modal-header bg-light">
              <h5 class="modal-title">{{ isEditingQuiz ? 'Edit Quiz' : 'Add New Quiz' }}</h5>
              <button type="button" class="btn-close" @click="closeQuizModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitQuiz">
                <div class="mb-3">
                  <label class="form-label">Quiz Name</label>
                  <input v-model="quizForm.name" type="text" class="form-control" placeholder="Quiz Name" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Duration (HH:MM)</label>
                  <input v-model="quizForm.time_duration" type="text" class="form-control" placeholder="Duration (HH:MM)" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Number of Questions</label>
                  <input v-model="quizForm.total_question" type="number" class="form-control" placeholder="Number of Questions" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Remarks</label>
                  <input v-model="quizForm.remarks" type="text" class="form-control" placeholder="Remarks" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Date of Quiz</label>
                  <input v-model="quizForm.date_of_quiz" type="date" class="form-control" required />
                </div>
                <button :disabled="isLoading" class="btn btn-success w-100">
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isEditingQuiz ? 'Update Quiz' : 'Add Quiz' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Question Modal -->
      <div v-if="showQuestionModal" class="modal fade show d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content border-0 shadow rounded-4">
            <div class="modal-header bg-light">
              <h5 class="modal-title">{{ isEditingQuestion ? 'Edit Question' : 'Add Question' }}</h5>
              <button type="button" class="btn-close" @click="closeQuestionModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitQuestion">
                <div class="mb-3">
                  <label class="form-label">Title</label>
                  <input v-model="questionForm.title" type="text" class="form-control" placeholder="Title" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Question</label>
                  <textarea v-model="questionForm.question" class="form-control" placeholder="Question" required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Option 1</label>
                  <input v-model="questionForm.option1" type="text" class="form-control" placeholder="Option 1" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Option 2</label>
                  <input v-model="questionForm.option2" type="text" class="form-control" placeholder="Option 2" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Option 3</label>
                  <input v-model="questionForm.option3" type="text" class="form-control" placeholder="Option 3" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Option 4</label>
                  <input v-model="questionForm.option4" type="text" class="form-control" placeholder="Option 4" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Correct Answer</label>
                  <select v-model="questionForm.answer" class="form-select" required>
                    <option disabled value="">Select correct answer</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                    <option value="option4">Option 4</option>
                  </select>
                </div>
                <button :disabled="isLoading" class="btn btn-primary w-100">
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isEditingQuestion ? 'Update Question' : 'Add Question' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>



  `,

  data() {
    return {
      chapters: [],
      quizForm: { name: '', time_duration: '', chapter_id: '', remarks: '', date_of_quiz: '', total_question: '' },
      questionForm: { title: '', question: '', option1: '', option2: '', option3: '', option4: '', answer: '' },
      isLoading: false,
      showQuizModal: false,
      showQuestionModal: false,
      isEditingQuiz: false,
      isEditingQuestion: false,
      currentQuizId: null,
      token: localStorage.getItem('auth_token'),
      searchQuery: '', // Add searchQuery
    };
  },

  computed: {
    filteredChapters() {
  const query = this.searchQuery.toLowerCase();

  return this.chapters.map(chapter => ({
    ...chapter,
    quizzes: (chapter.quizzes || []).filter(quiz => {
      const quizMatch = (quiz.name || '').toLowerCase().includes(query);
      const questionMatch = (quiz.questions || []).some(question =>
        (question.title || '').toLowerCase().includes(query) ||
        (question.question || '').toLowerCase().includes(query)
      );
      return quizMatch || questionMatch;
    })
  })).filter(chapter => 
    (chapter.quizzes || []).length > 0 || 
    (chapter.name || '').toLowerCase().includes(query) || 
    (chapter.description || '').toLowerCase().includes(query)
  );
}

  },

  methods: {
    async fetchChapters() {
      try {
        const response = await fetch('/api/chapters', {
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        this.chapters = data.map(chapter => ({
          ...chapter,
          quizzes: []
        }));

        await Promise.all(this.chapters.map(async (chapter) => {
          const quizResponse = await fetch(`/api/quizzes/${chapter.id}`, {
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json',
            },
          });
          // console.log(quizResponse);

          if (quizResponse.ok) {
            const quizzes = await quizResponse.json();
            
            const quizzesWithQuestions = await Promise.all(quizzes.map(async (quiz) => {
              const questionResponse = await fetch(`/api/quizzes/${quiz.id}/questions`, {
                headers: {
                  'Authentication-Token': this.token,
                  'Content-Type': 'application/json',
                },
              });
              if (questionResponse.ok) {
                const questions = await questionResponse.json();
                
                return { ...quiz, questions: Array.isArray(questions) ? questions : [] };
              } else {
                return { ...quiz, questions: [] };
              }
            }));
            this.$set(chapter, 'quizzes', quizzesWithQuestions);
          } else {
            this.$set(chapter, 'quizzes', []);
          }
        }));
      } catch (error) {
        console.error('Failed to fetch chapters and quizzes:', error);
      }
    },

    openQuestionModal(quizId) {
      this.questionForm = {
        title: '',
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: ''
      };
      this.currentQuizId = quizId;
      this.showQuestionModal = true;
      this.isEditingQuestion = false;
    },

    closeQuestionModal() {
      this.showQuestionModal = false;
    },

    editQuestion(quizId, question) {
      this.questionForm = {
        id: question.id,
        title: question.title,
        question: question.question,
        option1: question.options.option1 || '',
        option2: question.options.option2 || '',
        option3: question.options.option3 || '',
        option4: question.options.option4 || '',
        answer: question.answer
      };
      this.currentQuizId = quizId;
      this.isEditingQuestion = true;
      this.showQuestionModal = true;
    },

    async submitQuestion() {
      this.isLoading = true;
      try {
        const url = this.isEditingQuestion
          ? `/api/quizzes/${this.currentQuizId}/questions/${this.questionForm.id}`
          : `/api/quizzes/${this.currentQuizId}/questions`;
        const method = this.isEditingQuestion ? 'PUT' : 'POST';

        const questionData = {
          title: this.questionForm.title,
          question: this.questionForm.question,
          options: {
            option1: this.questionForm.option1,
            option2: this.questionForm.option2, 
            option3: this.questionForm.option3 || null,
            option4: this.questionForm.option4 || null
          },
          answer: this.questionForm.answer
        };

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
          body: JSON.stringify(questionData),
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorMessage}`);
        }

        console.log('Question submitted successfully.');
        this.closeQuestionModal();
        await this.fetchChapters();
      } catch (error) {
        console.error('Failed to submit question:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchQuestions(quizId) {
      try {
        const response = await fetch(`/api/quizzes/${quizId}/questions`, {
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const questions = await response.json();
          
          this.chapters.forEach(chapter => {
            const quiz = chapter.quizzes.find(q => q.id === quizId);
            if (quiz) {
              this.$set(quiz, 'questions', questions);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    },

    async deleteQuestion(quizId, questionId) {
      if (!confirm('Are you sure you want to delete this question?')) return;

      try {
        const response = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
        });

        if (response.ok) {
          await this.fetchChapters();
        }
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    },
    openQuizModal(chapterId) {
      this.quizForm = { name: '', time_duration: '', remarks: '', date_of_quiz: '', total_question: '', chapter_id: chapterId };
      this.currentQuizId = chapterId;
      this.showQuizModal = true;
      this.isEditingQuiz = false;
    },

    closeQuizModal() {
      this.showQuizModal = false;
    },

    async submitQuiz() {
      this.isLoading = true;
      try {
        const url = this.isEditingQuiz
          ? `/api/quizzes/${this.quizForm.id}/update`
          : `/api/quizzes/${this.quizForm.chapter_id}`;
        const method = this.isEditingQuiz ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
          body: JSON.stringify(this.quizForm),
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorMessage}`);
        }

        console.log('Quiz submitted successfully.');
        this.closeQuizModal();
        await this.fetchChapters();
      } catch (error) {
        console.error('Failed to submit quiz:', error);
      } finally {
        this.isLoading = false;
      }
    },

    editQuiz(quiz) {
      // If quiz.date_of_quiz is "2025-05-23 00:00:00", extract "2025-05-23"
      let dateOnly = quiz.date_of_quiz;
      if (typeof dateOnly === 'string' && dateOnly.includes(' ')) {
        dateOnly = dateOnly.split(' ')[0];
      }
      this.quizForm = { ...quiz, date_of_quiz: quiz.date_of_quiz.split('T')[0],
        time_duration: quiz.time_duration.split(' ')[1]?.slice(0,5)
       };
      this.isEditingQuiz = true;
      this.showQuizModal = true;
    },

    async deleteQuiz(quizId) {
      if (!confirm('Are you sure you want to delete this quiz?')) return;
      try {
        const response = await fetch(`/api/quizzes/${quizId}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token,
          },
        });

        if (response.ok) {
          alert('Quiz deleted successfully.');
          await this.fetchChapters();
        } else {
          const errorText = await response.text();
          alert(`Failed to delete quiz: ${errorText}`);
        }
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        alert('An error occurred while trying to delete the quiz.');
      }
    },
  },

  mounted() {
    this.fetchChapters();

  },
};
