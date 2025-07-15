# Quiz Master – Web Application

Quiz Master is a multi-user web application designed for educational institutions or organizations to manage quizzes efficiently. It allows administrators to create quizzes and analyze student performance, while users (students) can attempt quizzes and track their progress over time.

---

## Features

### User Features
- **Secure Login & Registration**
- **Attempt Quizzes** and **view instant results**
- **View Quiz History** and **performance summary**
- **Receive Daily Reminders & Monthly Reports**

### Subject & Quiz Management
- Manage **multiple subjects**, **chapters**, and **quizzes**
- Create and update **multiple-choice questions**
- Store correct answers for evaluation

### Admin Dashboard
- View **top scores per subject**
- Analyze **quiz attempts per subject**
- Manage **users, quizzes, scores**
- Download **performance reports**

### Backend Jobs
- Send **daily quiz reminders** to users via email
- Send **monthly activity reports**

### Security & Performance
- **Hashed passwords** for user safety
- **Role-based access control**
- **Redis & Celery** used for efficient background task handling

---

## Technologies Used

- **Flask** – Backend framework
- **VueJS** – Frontend framework
- **Python** – Application logic
- **SQLAlchemy & SQLite3** – ORM and database
- **Redis & Celery** – Caching & background jobs
- **HTML / CSS / JS** – UI and interactivity
- **Flask-Login** – User session management

---

## How to Run the Application  

**Create virtual environment:** python3 -m venv .env  
**Activate virtual environment:**  source .env/bin/activate  
**Install dependencies:** pip install -r requirements.txt  

## These step write on diffrent terminal and activate environment in all the terminals  

**step-1 in terminal -->>** MailHog  
**step-2 in terminal -->>** sudo systemctl stop redis || redis-server  
**step-3 in terminal -->>** celery -A app.celery worker --loglevel INFO  
**step-4 in terminal -->>** celery -A app.celery beat --loglevel INFO  
**step-5 in terminal -->>** python3 app.py  

