import Admin from './AdminDashboard.js';
import User from './UserDashboard.js';


export default {
    template: `
      <div>
        <Admin v-if="userRole === 'admin'" />
        <User v-if="userRole === 'user'" />
      </div>
    `,
  
    data() {
      return {
        userRole: null,
        authToken: null,
      };
    },
  
    created() {
      this.authToken = localStorage.getItem('auth_token');
      this.userRole = localStorage.getItem('role');
  
      window.addEventListener("authChanged", () => {
        this.authToken = localStorage.getItem('auth_token');
        this.userRole = localStorage.getItem('role');
      });

      if (!this.authToken) {
          this.goToLogin();
      }
    },
  
    methods: {
      goToLogin() {
        this.$router.push('/login');
      },
    },
  
    components: {
      Admin,
      User,
    },
  };
  