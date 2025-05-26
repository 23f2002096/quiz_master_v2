
export default {
  
  template: `
    <div class="container-fluid bg-white py-5 min-vh-100">
  <div class="row justify-content-center">
    <div class="col-12 col-xl-11">
      <div class="mb-5 text-center">
        <h2 class="fw-bold" style="font-family: 'Segoe UI', sans-serif; color: #34495e;">
          Subject & Chapter Dashboard
        </h2>
      </div>

      <!-- Action Row -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <button class="btn btn-success rounded-3 px-1 py-1 shadow-sm" @click="openModal">
          <i class="bi bi-plus-circle me-2"></i> Add New Subject
        </button>
        <input type="text" class="form-control w-100 w-md-50 border-2" v-model="searchQuery"
          placeholder="Search by subject or chapter..." />
      </div>

      <!-- Subject Cards -->
      <div v-if="filteredSubjects.length" class="row g-4">
        <div v-for="subject in filteredSubjects" :key="subject.id" class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="fw-bold text-dark">{{ subject.name }}</h5>
                  <p class="text-muted small">{{ subject.description }}</p>
                </div>
                
              </div>

              <!-- Subject Buttons -->
              <div class="mt-3 d-flex flex-wrap gap-2">
                <button class="btn btn-outline-danger btn-sm" @click="deleteSubject(subject.id)">
                  <i class="bi bi-trash"></i> Delete
                </button>
                <button class="btn btn-outline-secondary btn-sm" @click="editSubject(subject)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
                <button class="btn btn-outline-info btn-sm" @click="openChapterModal(subject.id)">
                  <i class="bi bi-journal-text"></i> Manage Chapters
                </button>
              </div>

              <!-- Chapters -->
              <div v-if="subject.chapters?.length" class="mt-4">
                <h6 class="fw-semibold text-success mb-3">Chapters</h6>
                <div class="row g-3">
                  <div v-for="chapter in subject.chapters" :key="chapter.id" class="col-md-6">
                    <div class="border rounded p-3 bg-light h-100">
                      <h6 class="mb-1">{{ chapter.name }}</h6>
                      <p class="text-muted small mb-2">{{ chapter.description }}</p>
                      <div class="d-flex justify-content-end gap-2">
                        
                        <button class="btn btn-outline-secondary btn-sm" @click="editChapter(chapter)"">
                          <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        
                        <button class="btn btn-outline-danger btn-sm" @click="deleteChapter(chapter.id)">
                          <i class="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- No Data States -->
      <div v-else-if="subjects.length" class="text-center mt-5 text-muted">
        <i class="bi bi-search fs-3 d-block mb-2"></i>
        <p>No matching subjects or chapters found.</p>
      </div>
      <div v-else class="text-center mt-5 text-muted">
        <i class="bi bi-folder-x fs-3 d-block mb-2"></i>
        <p>No subjects yet. Start by adding one.</p>
      </div>

      <!-- Subject Modal -->
      <div v-if="showModal" class="modal fade show d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content border-0 shadow rounded-4">
            <div class="modal-header bg-light">
              <h5 class="modal-title">{{ subjectForm.id ? 'Edit Subject' : 'Add New Subject' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="subjectForm.id ? updateSubject() : createSubject()">
                <div class="mb-3">
                  <label class="form-label">Subject Name</label>
                  <input v-model="subjectForm.name" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea v-model="subjectForm.description" class="form-control" rows="3" required></textarea>
                </div>
                <button :disabled="isLoading" class="btn btn-success w-100">
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ subjectForm.id ? 'Update Subject' : 'Add Subject' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Chapter Modal -->
      <div v-if="showChapterModal" class="modal fade show d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content border-0 shadow rounded-4">
            <div class="modal-header bg-light">
              <h5 class="modal-title">Manage Chapter</h5>
              <button type="button" class="btn-close" @click="closeChapterModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="createOrUpdateChapter">
                <div class="mb-3">
                  <label class="form-label">Chapter Name</label>
                  <input v-model="chapterForm.name" type="text" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea v-model="chapterForm.description" class="form-control" rows="3" required></textarea>
                </div>
                <button :disabled="isLoading" class="btn btn-success w-100">
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ chapterForm.id ? 'Update Chapter' : 'Add Chapter' }}
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
      subjects: [],
      subjectForm: { name: '', description: '' },
      chapterForm: { name: '', description: '', subject_id: '' },
      isLoading: false,
      showModal: false,
      showChapterModal: false,
      token: localStorage.getItem('auth_token'),
      currentSubjectId: null,
      searchQuery: '',
    };
  },

  computed: {
    filteredSubjects() {
      const query = this.searchQuery.toLowerCase();
      return this.subjects.filter(subject => {
        const subjectMatch = subject.name.toLowerCase().includes(query) ||
                              subject.description.toLowerCase().includes(query);

        const chapterMatch = subject.chapters && subject.chapters.some(chapter =>
          chapter.name.toLowerCase().includes(query) ||
          chapter.description.toLowerCase().includes(query)
        );

        return subjectMatch || chapterMatch;
      });
    },
  },

  methods: {
    openModal() {
      this.subjectForm = { name: '', description: '' };
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    openChapterModal(subjectId) {
      this.currentSubjectId = subjectId;
      this.chapterForm = { name: '', description: '', subject_id: subjectId };
      this.showChapterModal = true;
    },

    closeChapterModal() {
      this.showChapterModal = false;
    },

    async fetchSubjects() {
      try {
        const res = await fetch('/api/subjects', {
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text); // Attempt to parse JSON
        } catch (err) {
          console.error('Error parsing JSON:', err);
          return;
        }

        // Check if the data is an array, else log the error
        if (!Array.isArray(data)) {
          return;
        }

        this.subjects = data;

        // Fetch chapters for each subject
        for (let subject of this.subjects) {
          const chapterRes = await fetch(`/api/chapters?subject_id=${subject.id}`, {
            headers: {
              'Authentication-Token': this.token,
            },
          });

          subject.chapters = chapterRes.ok ? await chapterRes.json() : [];
        }
      } catch (err) {
        console.error('Error in fetchSubjects:', err);
      }
    },

    async createSubject() {
      if (!this.token) {
        alert('Please log in first');
        return;
      }

      this.isLoading = true;

      try {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.subjectForm),
        });

        if (res.ok) {
          this.subjectForm = { name: '', description: '' };
          await this.fetchSubjects();
          this.closeModal();
        } else {
          const errorResponse = await res.json();
          alert(`Failed to create subject: ${errorResponse.message || 'Unknown error'}`);
        }
      } finally {
        this.isLoading = false;
      }
    },

    async updateSubject() {
      if (!this.token) {
        alert('Please log in first');
        return;
      }

      this.isLoading = true;

      try {
        const res = await fetch(`/api/subjects/${this.subjectForm.id}`, {
          method: 'PUT',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: this.subjectForm.name,
            description: this.subjectForm.description
          }),
        });

        if (res.ok) {
          const data = await res.json();
          alert(data.message);
          this.closeModal();
          await this.fetchSubjects();
        } else {
          const errorResponse = await res.json();
          alert(`Failed to update subject: ${errorResponse.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred while updating the subject');
      } finally {
        this.isLoading = false;
      }
    },

    async deleteSubject(subjectId) {
      if (!confirm('Are you sure?')) return;
      try {
        const res = await fetch(`/api/subjects/${subjectId}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          await this.fetchSubjects();
        } else {
          alert('Failed to delete subject');
        }
      } catch (err) {
        console.error(err);
      }
    },

    editSubject(subject) {
      this.subjectForm = { ...subject };
      this.showModal = true;
    },

    async createOrUpdateChapter() {
      if (!this.token) {
        alert('Please log in first');
        return;
      }

      this.isLoading = true;

      try {
        const method = this.chapterForm.id ? 'PUT' : 'POST';
        const url = this.chapterForm.id ? `/api/chapters/${this.chapterForm.id}` : '/api/chapters';

        const res = await fetch(url, {
          method: method,
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.chapterForm),
        });

        if (res.ok) {
          this.chapterForm = { id: null, name: '', description: '', subject_id: this.currentSubjectId };
          this.closeChapterModal();
          await this.fetchSubjects();
        } else {
          const errorResponse = await res.json();
          alert(`Failed to ${this.chapterForm.id ? 'update' : 'create'} chapter: ${errorResponse.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        alert(`An error occurred while ${this.chapterForm.id ? 'updating' : 'creating'} the chapter`);
      } finally {
        this.isLoading = false;
      }
    },

    async deleteChapter(chapterId) {
      if (!confirm('Are you sure?')) return;
      try {
        const res = await fetch(`/api/chapters/${chapterId}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          await this.fetchSubjects();
        } else {
          alert('Failed to delete chapter');
        }
      } catch (err) {
        console.error(err);
      }
    },

    editChapter(chapter) {
      this.chapterForm = { ...chapter };
      this.chapterForm.subject_id = this.currentSubjectId;
      this.showChapterModal = true;
    },
  },

  mounted() {
    this.fetchSubjects();
  },
};

