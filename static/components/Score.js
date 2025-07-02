import UserScore from './UserScore.js';
export default {
    template: `
      <div>
        
        <UserScore v-if="userRole === 'user'" />
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
      
      UserScore,
    },
  };
  