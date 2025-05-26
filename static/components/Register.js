export default {
    template: `
    <section class="vh-100" style="background: #ffffff; height: 100vh;">
        <div class="container py-5 h-100">
            <div class="row d-flex justify-content-center align-items-center h-100">
                <div class="col-md-10 col-lg-8 col-xl-8"> <!-- Adjusted width for better form size -->
                    <div class="card shadow-lg" style="border-radius: 1rem;">
                        <div class="row g-0">
                            <div class="col-md-12 d-flex align-items-center">
                                <div class="card-body p-4 p-lg-5 text-black">
                                    <h1 class="display-1 text-center">Welcome to Quiz Master</h1>
                                    <h3 class="display-4 text-center mb-4">Registration</h3>
  
                                    <form @submit.prevent="register">
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
  
                                        <div class="form-group mb-4">
                                            <label for="confirm_password" class="form-label">Confirm Password:</label>
                                            <input type="password" id="confirm_password" class="form-control form-control-lg"
                                                v-model="cred.confirmPassword" placeholder="Confirm Password" required />
                                        </div>
  
                                        <div class="form-group mb-4">
                                            <label for="full_name" class="form-label">Full Name:</label>
                                            <input type="text" id="full_name" class="form-control form-control-lg"
                                                v-model="cred.fullName" placeholder="Full Name" required />
                                        </div>
  
                                        <div class="form-group mb-4">
                                            <label for="qualification" class="form-label">Qualification:</label>
                                            <input type="text" id="qualification" class="form-control form-control-lg"
                                                v-model="cred.qualification" placeholder="Qualification" required />
                                        </div>
  
                                        <div class="form-group mb-4">
                                            <label for="dob" class="form-label">Date of Birth:</label>
                                            <input type="date" id="dob" class="form-control form-control-lg"
                                                v-model="cred.dob" required />
                                        </div>
  
                                        <div class="form-group-btn mb-4 d-flex justify-content-between">
                                            <button class="btn btn-primary btn-lg" type="submit">Register</button>
                                            <router-link to="/login" class="btn btn-link">Existing user?</router-link>
                                        </div>
                                    </form>
  
                                    <div v-if="error" class="alert alert-danger mt-4" role="alert">
                                        {{ error }}
                                    </div>
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
                confirmPassword: null,
                fullName: null,
                qualification: null,
                dob: null
            },
            error: null
        };
    },
    methods: {
        async register() {
            if (this.cred.password !== this.cred.confirmPassword) {
                this.error = "Passwords do not match.";
                return;
            }
  
            try {
                const res = await fetch('/user/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: this.cred.email,
                        username: this.cred.email,  // Assuming username is the same as email
                        password: this.cred.password,
                        full_name: this.cred.fullName,
                        qualification: this.cred.qualification,
                        dob: this.cred.dob
                    }),
                });
  
                const data = await res.json();
  
                if (res.ok) {
                    alert('User registered successfully!');
                    this.$router.push({ path: '/login' });
                } else {
                    this.error = data.message || "An error occurred during registration.";
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.error = "An unexpected error occurred. Please try again later.";
            }
        },
    },
    style: `
    .form-group-btn {
        display: flex;
        justify-content: space-between;
    }
    .display-1, .display-4 {
        text-align: center;
    }
    .btn-link {
        text-decoration: none;
        color: #007bff;
    }
    .btn-link:hover {
        text-decoration: underline;
    }
    .card {
        border-radius: 1rem;
    }
    .alert {
        font-size: 0.9rem;
    }
    `
  }
  