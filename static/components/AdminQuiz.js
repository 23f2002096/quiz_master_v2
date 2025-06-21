
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
        const res = await fetch('/api/chapters', {
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          }
        });

        const chapterList = await res.json();

        // Set chapters with empty quizzes initially
        this.chapters = [];
        for (let i = 0; i < chapterList.length; i++) {
          const chap = chapterList[i];
          chap.quizzes = [];
          this.chapters.push(chap);
        }

        // Now fetch quizzes for each chapter
        for (let i = 0; i < this.chapters.length; i++) {
          const chap = this.chapters[i];
          const quizRes = await fetch(`/api/quizzes/${chap.id}`, {
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json'
            }
          });

          if (quizRes.ok) {
            const quizList = await quizRes.json();
            const quizzesWithQuestions = [];

            for (let j = 0; j < quizList.length; j++) {
              const quiz = quizList[j];
              const quesRes = await fetch(`/api/quizzes/${quiz.id}/questions`, {
                headers: {
                  'Authentication-Token': this.token,
                  'Content-Type': 'application/json'
                }
              });

              if (quesRes.ok) {
                const questionList = await quesRes.json();
                quiz.questions = Array.isArray(questionList) ? questionList : [];
              } else {
                quiz.questions = [];
              }

              quizzesWithQuestions.push(quiz);
            }

            this.$set(chap, 'quizzes', quizzesWithQuestions);
          } else {
            this.$set(chap, 'quizzes', []);
          }
        }
      } catch (err) {
        console.log('Something went wrong while loading chapters:', err);
      }
    },

        openQuestionModal(quizId) {
      // Reset question form
      this.questionForm = {
        title: '',
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: ''
      };

      // Set quizId and open modal
      this.currentQuizId = quizId;
      this.showQuestionModal = true;
      this.isEditingQuestion = false;
    },

        closeQuestionModal() {
      // Simply hide the modal
      this.showQuestionModal = false;
    },

        editQuestion(quizId, ques) {
      this.questionForm = {
        id: ques.id,
        title: ques.title || '',
        question: ques.question || '',
        option1: (ques.options && ques.options.option1) || '',
        option2: (ques.options && ques.options.option2) || '',
        option3: (ques.options && ques.options.option3) || '',
        option4: (ques.options && ques.options.option4) || '',
        answer: ques.answer || ''
      };

      this.currentQuizId = quizId;
      this.isEditingQuestion = true;
      this.showQuestionModal = true;
    },

    async submitQuestion() {
      // Start loader
      this.isLoading = true;

      // Prepare URL and HTTP method based on editing or new
      let endpoint = '';
      let httpMethod = '';
      if (this.isEditingQuestion) {
        endpoint = `/api/quizzes/${this.currentQuizId}/questions/${this.questionForm.id}`;
        httpMethod = 'PUT';
      } else {
        endpoint = `/api/quizzes/${this.currentQuizId}/questions`;
        httpMethod = 'POST';
      }

      // Build the data for the question
      let dataToSend = {
        title: this.questionForm.title,
        question: this.questionForm.question,
        options: {
          option1: this.questionForm.option1,
          option2: this.questionForm.option2,
          option3: this.questionForm.option3 ? this.questionForm.option3 : null,
          option4: this.questionForm.option4 ? this.questionForm.option4 : null
        },
        answer: this.questionForm.answer
      };

      try {
        const res = await fetch(endpoint, {
          method: httpMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token
          },
          body: JSON.stringify(dataToSend)
        });

        if (res.ok) {
          console.log('Question was saved successfully.');
          this.closeQuestionModal();
          await this.fetchChapters();
        } else {
          const msg = await res.text();
          console.log('Error while saving question:', msg);
          alert('Failed to submit the question');
        }
      } catch (err) {
        console.log('Something went wrong during question submit:', err);
      } finally {
        // Stop loader
        this.isLoading = false;
      }
    },

    async fetchQuestions(quizId) {
      // Start the process to get questions of a specific quiz
      try {
        const url = `/api/quizzes/${quizId}/questions`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const questionList = await response.json();

          // Now try to find the chapter which has this quiz
          for (let i = 0; i < this.chapters.length; i++) {
            let chapter = this.chapters[i];

            // Find the quiz inside this chapter
            for (let j = 0; j < chapter.quizzes.length; j++) {
              if (chapter.quizzes[j].id === quizId) {
                // Use Vue's reactivity to assign questions
                this.$set(chapter.quizzes[j], 'questions', questionList);
                break;
              }
            }
          }
        } else {
          console.log('Could not fetch questions. Server responded with status:', response.status);
        }
      } catch (err) {
        console.error('Something went wrong while getting questions:', err);
      }
    },

    async deleteQuestion(quizId, questionId) {
      // Ask user before deleting
      const userConfirmed = confirm("Are you sure you want to delete this question?");
      if (!userConfirmed) {
        return; // exit if user cancels
      }

      try {
        // Send request to remove the question
        const result = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token
          }
        });

        // Refresh data if successful
        if (result.ok) {
          await this.fetchChapters(); // reload updated list
        } else {
          console.warn("Failed to delete the question. Status:", result.status);
        }
      } catch (problem) {
        console.error("Error while deleting question:", problem);
      }
    },

    openQuizModal(chapterId) {
      // Prepare form for new quiz input
      this.quizForm = {
        name: "",
        time_duration: "",
        remarks: "",
        date_of_quiz: "",
        total_question: "",
        chapter_id: chapterId
      };

      this.currentQuizId = chapterId;
      this.showQuizModal = true;
      this.isEditingQuiz = false; // since we are adding new
    },

    closeQuizModal() {
      // Just hide the quiz form modal
      this.showQuizModal = false;
    },

    async submitQuiz() {
      this.isLoading = true;

      try {
        // Figure out if we're updating or creating a new quiz
        let endpoint = '';
        let httpMethod = '';

        if (this.isEditingQuiz) {
          endpoint = `/api/quizzes/${this.quizForm.id}/update`;
          httpMethod = 'PUT';
        } else {
          endpoint = `/api/quizzes/${this.quizForm.chapter_id}`;
          httpMethod = 'POST';
        }

        // Send request to backend
        const req = await fetch(endpoint, {
          method: httpMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token
          },
          body: JSON.stringify(this.quizForm)
        });

        // Check if server responded OK
        if (!req.ok) {
          const errMsg = await req.text();
          throw new Error(`Submission failed: ${req.status} ${req.statusText} - ${errMsg}`);
        }

        console.log('Quiz sent successfully.');
        this.closeQuizModal(); // hide modal after success
        await this.fetchChapters(); // refresh list
      } catch (submitError) {
        console.error('There was an error submitting the quiz:', submitError);
      } finally {
        this.isLoading = false;
      }
    },

    editQuiz(quizInfo) {
      // Just making sure date is in correct format
      let cleanedDate = quizInfo.date_of_quiz;
      if (typeof cleanedDate === 'string' && cleanedDate.includes(' ')) {
        cleanedDate = cleanedDate.split(' ')[0]; // keep only date part
      }

      this.quizForm = {
        ...quizInfo,
        date_of_quiz: cleanedDate || '',
        time_duration: quizInfo.time_duration.split(' ')[1]?.slice(0, 5) || ''
      };

      this.isEditingQuiz = true;
      this.showQuizModal = true;
    },

    async deleteQuiz(quizId) {
      const confirmDelete = confirm('Are you sure you want to delete this quiz?');
      if (!confirmDelete) return;

      try {
        const delResponse = await fetch(`/api/quizzes/${quizId}/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token
          }
        });

        if (delResponse.ok) {
          alert('Quiz removed successfully!');
          await this.fetchChapters(); // refresh data after deletion
        } else {
          const errText = await delResponse.text();
          alert('Quiz could not be deleted: ' + errText);
        }
      } catch (delError) {
        console.error('Error deleting quiz:', delError);
        alert('Something went wrong while trying to delete the quiz.');
      }
    },
  },

  mounted() {
    this.fetchChapters();

  },
};
