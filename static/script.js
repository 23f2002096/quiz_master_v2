import Home from './components/Home.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import AdminQuiz from './components/AdminQuiz.js'
import Summary from './components/Summary.js'
import Navbar from './components/Navbar.js'
import Footer from './components/Footer.js'
import UserDetails from './components/UserDetails.js'
import UserQuiz from './components/UserQuiz.js'
import Score from './components/Score.js'


const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    {path:'/register', component: Register},
    {path:'/quizzes', component: AdminQuiz},
    {path:'/user', component: UserDetails},
    {path:'/summary', component: Summary},
    {path:'/quizzes/:id', component: UserQuiz},
    {path:'/score', component: Score}

]

const router = new VueRouter({
    routes // routes: routes
})

const app = new Vue({
    el: "#app",
    router, // router: router
    template: `
    <div class="container">
        <nav-bar></nav-bar>
        <router-view></router-view>
        <app-footer></app-footer>
    </div>
    `,
    components:{
        "nav-bar": Navbar,
        "app-footer":Footer,
    },
    
}) 