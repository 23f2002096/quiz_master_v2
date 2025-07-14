from celery import shared_task
from flask import current_app,render_template
from .database import db
from .models import Quiz, User, Score,Role
from .mail_sender import send_email
from datetime import datetime, timedelta
from sqlalchemy import func
import csv


@shared_task(ignore_result=False)
def create_resource_csv(user_id):
    try:
        current_app.logger.info(f"Fetching quiz data for user_id={user_id}\n\n")

        quiz_res = db.session.query(
            Quiz.id.label('Quiz ID'),
            Quiz.name.label('Quiz Name'),
            Quiz.remarks.label('Quiz Remarks'),
            Score.total_score.label('Quiz Score')
        ).join(Score, Quiz.id == Score.quiz_id)\
         .filter(Score.user_id == user_id)\
         .order_by(Quiz.date_of_quiz.desc())\
         .all()

        headers = ["Quiz ID", "Quiz Name", "Quiz Remarks", "Quiz Score"]

        filename = f"user_{user_id}_quiz_data.csv"

        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()

            for row in quiz_res:
                writer.writerow({
                    "Quiz ID": row[0],
                    "Quiz Name": row[1],
                    "Quiz Remarks": row[2] or "N/A",
                    "Quiz Score": row[3]
                })

        current_app.logger.info(f"User CSV generated and saved as {filename}")
        return filename

    except Exception as e:
        current_app.logger.error(f"Error generating CSV for user {user_id}: {str(e)}\n\n")
        raise


@shared_task(ignore_result=False)
def create_admin_resource_csv():
    try:
        current_app.logger.info("Fetching aggregated quiz data for all users...")

        user_data = db.session.query(
            User.id.label('User ID'),
            User.full_name.label('User Name'),
            func.count(Score.quiz_id).label('Quizzes Given'),
            func.avg(
                (Score.total_score * 100.0 / Quiz.total_question)
            ).label('Average Score Percentage')
        ).outerjoin(Score, User.id == Score.user_id)\
        .outerjoin(Quiz, Score.quiz_id == Quiz.id)\
        .filter(User.id !=1 ).group_by(User.id)\
        .all()

        current_app.logger.warning("User data from query:")
        for row in user_data:
            current_app.logger.warning(f"User ID: {row[0]}, Name: {row[1]}, Quizzes: {row[2]}, Avg: {row[3]}")
        current_app.logger.warning(f"{user_data}")

        # Convert query result into list of dictionaries
        csv_data = [
            {
                "User ID": row[0],
                "User Name": row[1] if row[1] is not None else "Unknown",
                "Quizzes Given": row[2],
                "Average Score Percentage": f"{row[3]:.2f}%" if row[3] is not None else "N/A"
            }
            for row in user_data
        ]

        if not csv_data:
            current_app.logger.error("CSV data is empty")
            return None

        filename = "admin_user_quiz_data.csv"

        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["User ID", "User Name", "Quizzes Given", "Average Score Percentage"])
            writer.writeheader()
            writer.writerows(csv_data)

        current_app.logger.info(f"Admin CSV generated and saved as {filename}")
        return filename

    except Exception as e:
        current_app.logger.exception(f"Error generating admin CSV: {str(e)}")
        raise



@shared_task(ignore_result=True)
def send_daily_reminders():
    yesterday = datetime.utcnow() - timedelta(days=1)
    new_quizzes = Quiz.query.filter(Quiz.date_of_quiz >= yesterday).all()
    
    if new_quizzes:
        user_role = Role.query.filter_by(name='user').first()
        users = User.query.filter(User.roles.contains(user_role)).all()
        subject = "New Quizzes Available!"
        for user in users:
            body = f"Hello {user.full_name},\n\nNew quizzes have been added. Log in to attempt the quiz!!"
            quiz_names = ", ".join([quiz.name for quiz in new_quizzes])
            body += f"\n\nNew Quizzes: {quiz_names}"
            send_email(user.email, subject, body)
    return "Ok"

@shared_task(ignore_result=True)
def send_monthly_reports():
    user_role = Role.query.filter_by(name='user').first()
    users = User.query.filter(User.roles.contains(user_role)).all()
    for user in users:
        send_monthly_report_email(user)
    return "Ok"

def send_monthly_report_email(user):
    last_month = datetime.utcnow().replace(day=1) - timedelta(days=1)
    start_date = last_month.replace(day=1)
    
    scores = Score.query.filter(
        Score.user_id == user.id,
        Score.time_stamp_of_attempt >= start_date,
        Score.time_stamp_of_attempt < datetime.utcnow().replace(day=1)
    ).all()
    
    total_quizzes = len(scores)
    average_score = sum([score.total_score for score in scores]) / total_quizzes if total_quizzes > 0 else 0
    
    html_content = render_template(
        'monthly_report.html',
        user=user,
        total_quizzes=total_quizzes,
        scores=scores,
        average_score=average_score
    )
    
    subject = f"Quiz Master Monthly Report - {last_month.strftime('%B %Y')}"
    send_email(user.email, subject, html_content)
    