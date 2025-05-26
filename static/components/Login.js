export default {
  template: `
    <section class="vh-100" style="background: #ffffff; height: 100vh;">
      <div class="container py-5 h-100">
        <div class="row d-flex justify-content-center align-items-center h-100">
          <div class="col-md-10 col-lg-8 col-xl-8">
            <div class="card shadow-lg" style="border-radius: 1rem;">
              <div class="row g-0">
                <div class="col-md-12 d-flex align-items-center">
                  <div class="card-body p-4 p-lg-5 text-black">
                    <h1 class="display-1 text-center">Welcome to Quiz Master</h1>
                    <h3 class="display-4 text-center mb-4">Login</h3>
                    <div v-if="error" class="alert alert-danger mt-4" role="alert">
                      {{ error }}
                    </div>
                    <form @submit.prevent="login">
                      <div class="form-group mb-4">
                        <label for="email" class="form-label">Username (E-mail):</label>
                        <input type="email" id="email" class="form-control form-control-lg"
                               v-model="cred.email" placeholder="E-mail (Username)" required />
                      </div>

                      <div class="form-group mb-4">
                        <label for="password" class="form-label">Password:</label>
                        <input type="password" id="password" class="form-control form-control-lg"
                               v-model="cred.password" placeholder="Password" required />
                      </div>

                      <div class="form-group-btn mb-4 d-flex justify-content-between">
                        <button class="btn btn-primary btn-lg" type="submit">Login</button>
                        <router-link to="/register" class="btn btn-link">Don't have an account?</router-link>
                      </div>
                    </form>


                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,

  data() {
    return {
      cred: {
        email: null,
        password: null,
      },
      error: null
    };
  },

  methods: {
    async login() {
      try {
        const res = await fetch('/user/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.cred),
        });

        const credentials = await res.json();
        

        if (res.ok) {
          // ✔ Save token and role in localStorage
          localStorage.setItem('auth_token', credentials.token);
          localStorage.setItem('role', credentials.role);

          // ✔ IMPORTANT: notify other components (like navbar) to update
          window.dispatchEvent(new Event("authChanged"));

          // ✔ Redirect to home after login
          this.$router.push({ path: '/' });
        } else {
          this.error = res.status === 403
            ? "Your account is deactivated. Please contact the administrator."
            : credentials.message || "An error occurred during login.";
        }
      } catch (error) {
        console.error('Login error:', error);
        this.error = "An unexpected error occurred. Please try again later.";
      }
    }
  }
};
