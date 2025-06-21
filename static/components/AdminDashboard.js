
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
      // Check if the user is logged in
      if (!this.token) {
        alert('Please log in to continue');
        return;
      }

      this.isLoading = true;

      try {
        // Sending subject data to server
        const response = await fetch('/api/subjects', {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: this.subjectForm.name,
            description: this.subjectForm.description
          }),
        });

        if (response.ok) {
          // Reset form and reload subjects
          this.subjectForm = { name: '', description: '' };
          this.closeModal();
          await this.fetchSubjects();
        } else {
          // If server sends error, show it
          const errorMsg = await response.json();
          alert('Could not add subject: ' + (errorMsg.message || 'Something went wrong'));
        }
      } catch (error) {
        console.error('Create subject error:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async updateSubject() {
      // Make sure the user is logged in
      if (!this.token) {
        alert('Please log in first to update subject');
        return;
      }

      this.isLoading = true;

      try {
        const subjectId = this.subjectForm.id;
        const payload = {
          name: this.subjectForm.name,
          description: this.subjectForm.description,
        };

        const updateResponse = await fetch(`/api/subjects/${subjectId}`, {
          method: 'PUT',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (updateResponse.ok) {
          const result = await updateResponse.json();
          alert(result.message || 'Subject updated successfully');
          this.closeModal();
          await this.fetchSubjects();
        } else {
          const errorData = await updateResponse.json();
          alert('Error updating subject: ' + (errorData.message || 'Something went wrong'));
        }
      } catch (error) {
        console.error('Update subject failed:', error);
        alert('An unexpected error occurred during subject update');
      } finally {
        this.isLoading = false;
      }
    },


    async deleteSubject(id) {
      const confirmDelete = confirm('Do you really want to remove this subject?');
      if (!confirmDelete) return;

      // Making API call to delete the subject
      try {
        const options = {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        };

        const response = await fetch(`/api/subjects/${id}`, options);

        if (response.ok) {
          // Refresh the subject list after deletion
          await this.fetchSubjects();
        } else {
          alert('Oops! Could not delete the subject.');
        }
      } catch (error) {
        console.log('Something went wrong while deleting:', error);
      }
    },


    editSubject(subject) {
      this.subjectForm = { ...subject };
      this.showModal = true;
    },

    async createOrUpdateChapter() {
      // User must be logged in
      if (!this.token) {
        alert('Please log in first to continue');
        return;
      }

      this.isLoading = true;

      try {
        let chapterUrl = '/api/chapters';
        let httpMethod = 'POST';

        // If editing, change the method and URL
        if (this.chapterForm.id) {
          chapterUrl = `/api/chapters/${this.chapterForm.id}`;
          httpMethod = 'PUT';
        }

        const sendData = {
          name: this.chapterForm.name,
          description: this.chapterForm.description,
          subject_id: this.chapterForm.subject_id,
        };

        const response = await fetch(chapterUrl, {
          method: httpMethod,
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sendData),
        });

        if (response.ok) {
          // Reset form and refresh list
          this.chapterForm = {
            id: null,
            name: '',
            description: '',
            subject_id: this.currentSubjectId,
          };
          this.closeChapterModal();
          await this.fetchSubjects();
        } else {
          const error = await response.json();
          const action = this.chapterForm.id ? 'update' : 'create';
          alert(`Could not ${action} chapter: ${error.message || 'Something went wrong'}`);
        }
      } catch (error) {
        const doing = this.chapterForm.id ? 'updating' : 'creating';
        console.log('Chapter error:', error);
        alert(`Error occurred while ${doing} the chapter`);
      } finally {
        this.isLoading = false;
      }
    },

    async deleteChapter(id) {
      const confirmDelete = confirm('Do you want to delete this chapter?');

      if (!confirmDelete) {
        return;
      }

      try {
        const options = {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json',
          },
        };

        const response = await fetch(`/api/chapters/${id}`, options);

        if (response.status === 200) {
          // Refresh subjects and chapters after successful deletion
          await this.fetchSubjects();
        } else {
          alert('Unable to delete chapter. Please try again.');
        }
      } catch (error) {
        console.log('Error while deleting chapter:', error);
      }
    },

    editChapter(chapterToEdit) {
      // Set the form values using a new object
      this.chapterForm = {
        id: chapterToEdit.id || null,
        name: chapterToEdit.name || '',
        description: chapterToEdit.description || '',
        subject_id: this.currentSubjectId || '',
      };

      // Open the modal for editing
      this.showChapterModal = true;
    }
  },

  mounted() {
    this.fetchSubjects();
  },
};

