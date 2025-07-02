import AdminSummary from './AdminSummary.js';
import UserSummary from './UserSummary.js';

export default {
  template: `
    <div>
      <AdminSummary v-if="userRole === 'admin'" />
      <UserSummary v-if="userRole === 'user'" />
    </div>
  `,

  data() {
    return {
      userRole: localStorage.getItem('role'),
      authToken: localStorage.getItem('auth_token'),
    };
  },

  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
  },

  components: {
    AdminSummary,
    UserSummary,
  },
};
