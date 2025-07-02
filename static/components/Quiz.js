import AdminQuiz from './AdminQuiz.js';
import UserQuiz from './UserQuiz.js';

export default {
    template: `
    <div>
      <Admin v-if="userRole === 'admin'" />
      <User v-if="userRole === 'user'" />
    </div>
  `,

  data() {
    return {
      userRole: localStorage.getItem('role'),
      authToken: localStorage.getItem('auth-token'),
    };
  },

  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
  },

  components: {
    AdminQuiz,
    UserQuiz,
  },
};
