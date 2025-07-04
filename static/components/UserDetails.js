export default {
  template: `
    <div class="container my-5" style="max-width: 1200px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <h2 class="text-center fw-bold mb-4" style="color: #34495e;">
        User Management
      </h2>

      <!-- Search Input -->
      <div class="mb-4">
        <input
          v-model="searchText"
          @input="onSearchInput"
          type="search"
          class="form-control form-control-lg shadow-sm rounded-pill"
          placeholder="Search users by name or email..."
          style="font-size: 1.1rem;"
        />
      </div>

      <div class="table-responsive shadow rounded-4 bg-white">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light text-uppercase text-secondary">
            <tr>
              <th>Email</th>
              <th>Full Name</th>
              <th>Date of Birth</th>
              <th>Qualification</th>
              
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUserList" :key="user.userId">
              <td>{{ user.email }}</td>
              <td>{{ user.fullName }}</td>
              <td>{{ formatDateString(user.dateOfBirth) }}</td>
              <td>{{ user.qualification }}</td>
              
              <td :class="user.isActive ? 'text-success fw-semibold' : 'text-danger fw-semibold'">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </td>
              <td>
                <button
                  @click="updateUserStatus(user)"
                  :class="user.isActive ? 'btn btn-danger btn-sm fw-semibold' : 'btn btn-success btn-sm fw-semibold'"
                >
                  {{ user.isActive ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredUserList.length === 0">
              <td colspan="7" class="text-center py-4 text-muted fst-italic">
                No users found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return {
      allUsers: [],
      searchText: ''
    }
  },
  computed: {
    filteredUserList() {
      // Use Array.prototype.some for flexible field searching
      const search = this.searchText.trim().toLowerCase();
      if (!search) return this.allUsers;
      return this.allUsers.filter(user =>
        ['fullName', 'email'].some(field =>
          (user[field] || '').toLowerCase().includes(search)
        )
      );
    }
  },
  mounted() {
    this.loadAllUsers();
  },
  methods: {
    loadAllUsers() {
      // Use fetch and map API data to clear property names
      fetch('/api/users')
        .then(response => response.json())
        .then(data => {
          this.allUsers = Array.isArray(data)
            ? data.map(u => ({
                userId: u.id,
                email: u.email,
                fullName: u.full_name,
                qualification: u.qualification,
                dateOfBirth: u.dob,
                isActive: u.active
              }))
            : [];
        })
        .catch(error => {
          console.error('Failed to fetch users:', error);
          this.allUsers = [];
        });
    },
    updateUserStatus(user) {
      // Use fetch and update status with clear logic
      const newStatus = !user.isActive;
      fetch(`/api/users/${user.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      })
        .then(response => {
          if (response.ok) {
            user.isActive = newStatus;
            window.alert(
              `User ${user.email} has been ${newStatus ? 'activated' : 'deactivated'} successfully.`
            );
          } else {
            window.alert('Failed to update user status.');
          }
        })
        .catch(() => {
          window.alert('Network error. Please try again.');
        });
    },
    formatDateString(dateValue) {
      // Format as DD-MM-YYYY for clarity
      if (!dateValue) return '';
      const dateObj = new Date(dateValue);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    },
    onSearchInput() {
      // No logic needed here, but could be used for analytics or debouncing
    }
  }
}
