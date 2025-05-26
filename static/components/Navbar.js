export default {
    template: `
      <div class="row border" style="border-radius: 10px;">

        <div class="col-10 fs-2 d-flex justify-content-between align-items-center" v-if="role === ''">
          <router-link to="/" class="btn btn-primary" style="all: unset; cursor: pointer;">Quiz Master</router-link>
        </div>

        <div class="col-10 fs-2 d-flex justify-content-between align-items-center" v-if="role === 'admin'">
          <router-link to="/" class="btn btn-primary" style="all: unset; cursor: pointer;">Quiz Master</router-link>
          <router-link to="/quizzes" class="btn btn-primary" style="all: unset; cursor: pointer;">Quiz</router-link>
          <router-link to="/summary" class="btn btn-primary" style="all: unset; cursor: pointer;">Summary</router-link>
          <router-link to="/user" class="btn btn-primary" style="all: unset; cursor: pointer;">Users</router-link>
        </div>

        <div class="col-10 fs-2 d-flex justify-content-between align-items-center" v-if="role === 'user'">
          <router-link to="/" class="btn btn-primary" style="all: unset; cursor: pointer;">Quiz Master</router-link>
          <router-link to="/score" class="btn btn-primary" style="all: unset; cursor: pointer;">Score</router-link>
          <router-link to="/summary" class="btn btn-primary" style="all: unset; cursor: pointer;">Summary</router-link>
        </div>

        <div class="col-2">
          <div class="mt-1" v-if="!loggedIn">
            <!-- Show Login/Register when NOT logged in -->
            <router-link class="btn btn-primary my-2" to="/login">Login</router-link>
            <router-link class="btn btn-warning my-2" to="/register">Register</router-link>
          </div>
          <div class="mt-1" v-else>
            <!-- Show Logout when logged in -->
            <button @click="logout" class="btn btn-danger my-2">Logout</button>
          </div>
        </div>

      </div>

    `,
  
    data() {
      const urlParams = new URLSearchParams(window.location.search);
      const roleFromUrl = urlParams.get('role');
      return {
        // ✔ Initialize login status from localStorage
        role: roleFromUrl || localStorage.getItem('role') || '',
        loggedIn: !!localStorage.getItem('auth_token')
      };
    },
  
    methods: {
      logout() {
        // ✔ Clear tokens and set loggedIn to false
        localStorage.removeItem('auth_token');
        localStorage.removeItem('role');
        this.loggedIn = false;
  
        // ✔ Dispatch a custom event to update other components (e.g. navbar)
        window.dispatchEvent(new Event('authChanged'));
  
        this.$router.push('/login');
      },
  
      // ✔ Method to sync the login status with localStorage
      syncLoginStatus() {
        this.loggedIn = !!localStorage.getItem('auth_token');
      }
    },
  
    mounted() {
      this.syncLoginStatus();
      window.addEventListener('scroll', this.handleScroll);
  
      // ✔ Listen for login/logout changes triggered via custom event
      window.addEventListener('authChanged', this.syncLoginStatus);
    },
    beforeDestroy() {
      window.removeEventListener('scroll', this.handleScroll);
    },
    beforeUnmount() {
      // ✔ Clean up the event listener
      window.removeEventListener('authChanged', this.syncLoginStatus);
    }
  };