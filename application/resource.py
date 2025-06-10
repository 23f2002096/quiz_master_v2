# ===== Corrected imports =====
from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask_security import auth_required,roles_required, current_user
from flask import request,jsonify,abort
from datetime import datetime
from .models import db, User, Role,Subject,Chapter,Question,Quiz,Score,UserAnswer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import aliased
from flask_restful import marshal
from sqlalchemy import func
# from flask_caching import Cache

# ===== Initialize API =====
api = Api(prefix='/api')


# ===== Fields to Marshal =====
user_output  = {
    'id': fields.Integer,
    'username': fields.String,
    'email': fields.String,
    'full_name': fields.String,
    'qualification': fields.String,
    'dob': fields.String,
    'active': fields.Boolean,
    'fs_uniquifier': fields.String
}


# ===== User Management Resource =====
class ManageUsers(Resource):
    @marshal_with(user_output)
    def get(self):
        # fetch the role for admin
        admin_role = Role.query.filter_by(name='admin').first()
        
       
        users = User.query.filter(User.roles.any(Role.id != admin_role.id)).all()
        return users, 200

    def put(self, user_id):
        user_record  = User.query.get_or_404(user_id)
        payload  = request.get_json()
        
        if 'active' in payload :
            user_record.active = bool(payload['active']) 
            db.session.commit()
            status = 'activated' if user_record.active else 'deactivated'
            return {"message": f"User {user_record.email} {status} successfully"}, 200
            
        # no valid update found
        return {"message": "No changes applied to the user"}, 400

api.add_resource(ManageUsers, '/users', '/users/<int:user_id>')
# working

subject_input_parser  = reqparse.RequestParser()
subject_input_parser.add_argument('name', type=str, required=True, help='The name of the subject must be provided.')
subject_input_parser.add_argument('description', type=str, required=True, help='A description of the subject is required.')

chapter_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String
}

subject_output = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'chapters': fields.List(fields.Nested(chapter_fields))
}
class SubjectResourceForUser(Resource):
    @auth_required('token')
    
    def get(self):
        
        try:
            # Fetch all subjects from the database
            all_subjects = Subject.query.all()
            return marshal(all_subjects,subject_output),200
        except Exception as error:
            return {"message": f"Error to get the subjects for database: {str(error)}"}, 500
api.add_resource(SubjectResourceForUser, '/user/subjects')
# working

#change->> SubjectResourceForStudent -> SubjectResourceForUser
# /student/subjects -> /user/subjects


subject_request_parser = reqparse.RequestParser()
subject_request_parser.add_argument('name', type=str, required=True, help='Subject name is required.')
subject_request_parser.add_argument('description', type=str, required=True, help='Subject description is required.')

subject_details_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String
}

# Subject CRUD API
class SubjectManagement(Resource):
    
    @marshal_with(subject_details_fields)
    @auth_required('token')
    @roles_required('admin')
    def get(self):
        all_subjects = Subject.query.all()
        if not all_subjects:
            return [], 200
        return all_subjects

    @auth_required('token') #Rbac
    @roles_required('admin') #Rbac
    def post(self):
        
        args = subject_request_parser.parse_args()
        try:
            new_subject = Subject(name=args['name'], description=args['description'])
            db.session.add(new_subject)
            db.session.commit()
            return {
                "message": "Subject created successfully",
                "subject": marshal(new_subject, subject_details_fields)
            }, 201
        except Exception as error:
            db.session.rollback()
            return {"message": f"Failed to create subject: {str(error)}"}, 500
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, subject_id):
        
        try:
            subject_to_delete = Subject.query.get_or_404(subject_id)
            db.session.delete(subject_to_delete)
            db.session.commit()
            return {"message": "Subject deleted successfully"}, 200
        except Exception as error:
            db.session.rollback()
            return {"message": f"Failed to delete subject: {str(error)}"}, 500

    @auth_required('token')
    @roles_required('admin')
    def put(self, subject_id):
        args = subject_request_parser.parse_args()
        subject_to_update = Subject.query.get_or_404(subject_id)
        
        try:
            subject_to_update.name = args['name']
            subject_to_update.description = args['description']
            db.session.commit()
            return {"message": "Subject updated successfully",
                    "subject": marshal(subject_to_update, subject_details_fields)}, 200
        except Exception as error:
            db.session.rollback()
            return {"message": f"Failed to update subject: {str(error)}"}, 500
            
api.add_resource(SubjectManagement, '/subjects', '/subjects/<int:subject_id>')
# working

chapter_input_parser = reqparse.RequestParser()
chapter_input_parser.add_argument('name', type=str, required=True, help='Give Chapter name')
chapter_input_parser.add_argument('description', type=str, required=True, help='Give Chapter description')
chapter_input_parser.add_argument('subject_id', type=int, required=True, help='Give subject ID')

chapter_output_fields  = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    
    'subject_id': fields.Integer,
}

# Chapter CRUD API
class ChapterManagement(Resource):
    @auth_required('token')
    @roles_required('admin')
    @marshal_with(chapter_output_fields)
    def get(self):
        
        subject_id = request.args.get('subject_id', type=int)
        try:
            if subject_id:
                chapters = Chapter.query.filter_by(subject_id=subject_id).all()
            else:
                chapters = Chapter.query.all()
            return chapters, 200
        except Exception as error:
            return {"message": f"Unable to retrieve chapters: {str(error)}"}, 500

    @auth_required('token')
    @roles_required('admin')
    def post(self):
        
        args= chapter_input_parser.parse_args()
        try:
           
            subject = Subject.query.get_or_404(args['subject_id'])
            new_chapter = Chapter(
                name=args['name'],
                description=args['description'],
                subject_id=args['subject_id']
            )
            db.session.add(new_chapter)
            db.session.commit()
            return {"message": "Chapter successfully created."}, 201
        except Exception as error:
            return {"message": f"Error creating chapter: {str(error)}"}, 500

    @auth_required('token')
    @roles_required('admin')
    def delete(self, chapter_id):
        
        try:
            chapter_to_delete = Chapter.query.get_or_404(chapter_id)
            db.session.delete(chapter_to_delete)
            db.session.commit()
            return {"message": "Chapter successfully deleted !!"}, 200
        except Exception as error:
            return {"message": f"Error deleting chapter: {str(error)}"}, 500

    @auth_required('token')
    @roles_required('admin')
    def put(self, chapter_id):
        
        args = chapter_input_parser.parse_args()
        try:
            chapter_to_update  = Chapter.query.get_or_404(chapter_id)
            chapter_to_update.name = args['name']
            chapter_to_update.description = args['description']
            
            db.session.commit()
            return {"message": "Chapter updated successfully."}, 200
        except Exception as error:
            return {"message": f"Failed to update chapter: {str(error)}"}, 500
api.add_resource(ChapterManagement,'/chapters','/chapters/<int:chapter_id>')
# working

quiz_input_parser = reqparse.RequestParser()
quiz_input_parser.add_argument('name', type=str, required=True, help='Quiz title is mandatory.')
quiz_input_parser.add_argument('time_duration', type=str, required=True, help='Time duration must be in HH:MM format.')
quiz_input_parser.add_argument('remarks', type=str, help='Optional remarks for the quiz.')
quiz_input_parser.add_argument('chapter_id', type=int, required=True, help='Valid chapter ID is needed.')
quiz_input_parser.add_argument('date_of_quiz', type=str, required=True, help='Quiz date is required (YYYY-MM-DD).')
quiz_input_parser.add_argument('total_question', type=int, required=True, help='Number of questions must be specified.')

quiz_output_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'time_duration': fields.String,
    'remarks': fields.String,
    'chapter_id': fields.Integer,
    'date_of_quiz':fields.String,
    'total_question':fields.Integer
}

class QuizManagement(Resource):
    @auth_required('token')
    
    @roles_required('admin')
    @marshal_with(quiz_output_fields)
    def get(self, chapter_id=None, quiz_id=None):
       
        try:
            if quiz_id:
                return Quiz.query.get_or_404(quiz_id)
            elif chapter_id:
                return Quiz.query.filter_by(chapter_id=chapter_id).all()
            return Quiz.query.all()
        except Exception as error:
            return {"message": f"Could not retrieve quiz data: {str(error)}"}, 500
    
    @auth_required('token')
    @roles_required('admin')
    def post(self, chapter_id):
        
        args = quiz_input_parser.parse_args()
        try:
            Chapter.query.get_or_404(chapter_id)
            time_duration = args['time_duration'].strip()  # Store as string

            try:
                datetime.strptime(time_duration, "%H:%M")  # Validate format
            except ValueError:
                return {"message": "Invalid time format. Use HH:MM"}, 400
            
            quiz = Quiz(
                name=args['name'],
                time_duration=time_duration,
                remarks=args['remarks'],
                chapter_id=chapter_id,
                date_of_quiz=datetime.strptime(args['date_of_quiz'], '%Y-%m-%d'),
                total_question=args['total_question']
            )
            db.session.add(quiz)
            db.session.commit()
            return {"message": "Quiz created Successfully."}, 201
        except Exception as error:
            return {"message": f"Quiz creation failed: {str(error)}"}, 500

    
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, quiz_id):
        if not quiz_id:
            return {"message": "Quiz ID is required."}, 400
        
        try:
            quiz_to_remove = Quiz.query.get_or_404(quiz_id)
            db.session.delete(quiz_to_remove)
            db.session.commit()
            return {"message": "Quiz removed successfully."}, 200
        except Exception as error:
            db.session.rollback()
            return {"message": f"Could not remove quiz: {str(error)}"}, 500
        
    @auth_required('token')
    @roles_required('admin')
    def put(self, quiz_id):
        
        args = quiz_input_parser.parse_args()
        try:
            quiz_to_update = Quiz.query.get_or_404(quiz_id)
            quiz_to_update.name = args['name']
            
           
            time_string = args['time_duration'].strip()
            # adding 00 if second is not present
            if len(time_string.split(':')) == 2:
                time_string += ":00" 
            
            try:
                quiz_to_update.time_duration = time_string
            except ValueError:
                return {"message": "Use this time formate HH:MM or HH:MM:SS"}, 400
            
            quiz_to_update.remarks = args['remarks']
            quiz_to_update.total_question = args['total_question']
            quiz_to_update.date_of_quiz = datetime.strptime(args['date_of_quiz'], '%Y-%m-%d').date()
            db.session.commit()
            return {"message": "Quiz details updated."}, 200
        except Exception as error:
            return {"message": f"Failed to update the quiz: {str(error)}"}, 500
api.add_resource(QuizManagement,'/quizzes/<int:chapter_id>','/quizzes/<int:quiz_id>')
api.add_resource(QuizManagement, '/quizzes/<int:quiz_id>/delete', endpoint='quiz_remove')
api.add_resource(QuizManagement, '/quizzes/<int:quiz_id>/update', endpoint='quiz_modify')
# as i know working

question_input_handler = reqparse.RequestParser()
question_input_handler.add_argument('question', type=str, required=True, help='You must provide a question statement.', location='json')
question_input_handler.add_argument('title', type=str, required=True, help='Title for the question is missing.', location='json')
question_input_handler.add_argument('options', type=dict, required=True, help='Answer choices are required.', location='json')
question_input_handler.add_argument('answer', type=str, required=True, help='Correct choice is missing.', location='json')

question_response_fields  = {
    'id': fields.Integer,
    'question': fields.String,
    'title': fields.String,
    'options': fields.Raw,
    'answer': fields.String,
}
class QuestionManagement(Resource):
    @auth_required('token')
    @roles_required('admin')
    @marshal_with(question_response_fields)
    def get(self, quiz_id, question_id=None):
        user = User.query.filter_by(username='user0').first()
        print(user)           
        try:
            if question_id:
                question = Question.query.filter_by(id=question_id, quiz_id=quiz_id).first()
                if not question:
                    return {"message": "No matching question found."}, 404
                return question
            question_list = Question.query.filter_by(quiz_id=quiz_id).all()
            return question_list
        except Exception as error:
            return {"message": f"Unable to fetch questions: {str(error)}"}, 500
        

    @auth_required('token')
    @roles_required('admin')
    @marshal_with(question_response_fields)
    def post(self, quiz_id):
        args = question_input_handler.parse_args()
        try:
            print("[DEBUG] Received payload:", args)
            quiz_exists = Quiz.query.get(quiz_id)
            if not quiz_exists:
                return {"message": "Associated quiz not found."}, 404

            if args['answer'] not in args['options']:
                return {"message": "Correct answer must match an option key"}, 400

            new_question = Question(
                question=args['question'],
                title=args['title'],
                options=args['options'],
                answer=args['answer'],
                quiz_id=quiz_id,
                chapter_id=quiz_exists.chapter_id
            )
            
            
            db.session.add(new_question)
            db.session.commit()
            
            return new_question, 201
        except IntegrityError:
            db.session.rollback()
            return {"message": "Question already exists or violates constraints"}, 400
        except Exception as error:
            db.session.rollback()
            return {"message": f"Failed to create Question: {str(error)}"}, 500

    @auth_required('token')
    @roles_required('admin')
    def delete(self, quiz_id, question_id):
        try:
            question_to_delete = Question.query.filter_by(id=question_id, quiz_id=quiz_id).first()
            if not question_to_delete :
                    return {"message": "Question not found."}, 404
            db.session.delete(question_to_delete)
            db.session.commit()
            return {"message": "Question deleted successfully."}, 200
        except Exception as error:
            db.session.rollback()
            return {"message": f"Error during deletion: {str(error)}"}, 500
        
    @auth_required('token')
    @roles_required('admin')
    @marshal_with(question_response_fields)
    def put(self, quiz_id, question_id):
        args = question_input_handler.parse_args()
        try:
            question_to_update = Question.query.filter_by(quiz_id=quiz_id, id=question_id).first_or_404()
            if not question_to_update:
                return {"message": "Question not found for update."}, 404
            
            if args['answer'] not in args['options']:
                return {"message": "Correct answer must match an option key"}, 400
            
            quiz = Quiz.query.get_or_404(quiz_id)
    
            question_to_update.question = args['question']
            question_to_update.title = args['title']
            question_to_update.options = args['options']
            question_to_update.answer = args['answer']
            question_to_update.chapter_id = quiz.chapter_id
            
            db.session.commit()
            return question_to_update, 200
        except Exception as error:
            db.session.rollback()
            return {"message": f"Failed to update the question: {str(error)}"}, 500

api.add_resource(
    QuestionManagement,
    '/quizzes/<int:quiz_id>/questions',
    '/quizzes/<int:quiz_id>/questions/<int:question_id>'
)
# ###############################validated

user_quiz_output  = {
    'id': fields.Integer,
    'name': fields.String,
    'time_duration': fields.String,
    'date_of_quiz': fields.DateTime(dt_format='iso8601'),
    'total_question': fields.Integer,
    'is_completed': fields.Boolean,
    'chapter': fields.Nested({
        'name': fields.String,
        'subject': fields.Nested({
            'name': fields.String
        })
    }),
    'status': fields.String
}

class UserQuizManagement(Resource):
    @auth_required('token')
    @roles_required('user')
    def get(self):
        try:
            user_id  = current_user.id
            today_date = datetime.today().date()

            UserScore = aliased(Score)

            fetched_quizzes = db.session.query(Quiz,UserScore.is_completed
                ).options(joinedload(Quiz.chapter).joinedload(Chapter.subject)
            ).outerjoin(
                UserScore,
                db.and_(
                    Quiz.id == UserScore.quiz_id,
                    UserScore.user_id == user_id
                )
            ).all()

            structured_output = []
            for quiz_entry, completed_flag in fetched_quizzes:
                status_label = 'upcoming' if quiz_entry.date_of_quiz.date() > today_date else 'completed'
                structured_output.append({
                    'id': quiz_entry.id,
                        'name': quiz_entry.name,
                        'total_question': quiz_entry.total_question,
                        'date_of_quiz': quiz_entry.date_of_quiz.date(),
                        'time_duration': quiz_entry.time_duration,
                        'is_completed': bool(completed_flag),
                        'chapter': {
                            'name': quiz_entry.chapter.name,
                            'subject': {
                                'name': quiz_entry.chapter.subject.name
                            }
                        },
                        'status': status_label
                })
            
            return marshal(structured_output, user_quiz_output), 200
        except Exception as e:
            return {"message": f"Error retrieving quizzes: {str(e)}"}, 500
    

api.add_resource(UserQuizManagement, '/user/quizzes')
# working

class UserQuizRetakeManagement(Resource):
    @auth_required('token')
    @roles_required('user')
    def post(self, quiz_id):
        try:
            user_id  = current_user.id
            quiz = Quiz.query.filter(Quiz.id == quiz_id).one_or_none()
            if quiz is None:
                return {'message': 'Quiz not found'}, 404
            
            score = Score.query.filter(
                Score.quiz_id == quiz_id,
                Score.user_id == user_id
            ).one_or_none()
            if score is None:
                return {'message': 'You have not attempted this quiz yet'}, 400
            
            setattr(score, 'is_completed', False)
            db.session.commit()
            return {'message': 'Retake access granted', 'quiz_id': quiz_id}, 200
        except Exception as error:
            db.session.rollback() 
            return {'message': str(error)}, 500

api.add_resource(UserQuizRetakeManagement, '/user/quizzes/<int:quiz_id>/retake')


question_schema  = {
    'id': fields.Integer,
    'question': fields.String,
    'title': fields.String,
    'options': fields.Raw
}

quiz_with_questions_schema  = {
    'quiz': fields.Nested(user_quiz_output),
    'questions': fields.List(fields.Nested(question_schema))
}

class UserQuizQuestionManagement(Resource):
    @auth_required('token')
    @roles_required('user')
    def get(self, quiz_id):
        
        try:
            today_date=datetime.today().date()
            user_id = current_user.id

            quiz = Quiz.query.options(
                joinedload(Quiz.chapter).joinedload(Chapter.subject)
            ).filter(Quiz.id == quiz_id).first()
            
            if quiz is None:
                abort(404, description="Quiz not found.")
            
            if quiz.date_of_quiz.date() <= today_date:
                abort(403, description="Access denied: This quiz is not yet open.")
            questions = Question.query.filter(Question.quiz_id == quiz_id).all()
            score = Score.query.filter(
                Score.user_id == user_id, Score.quiz_id == quiz.id
            ).first()
            is_completed = bool(score.is_completed) if score else False

            def build_quiz_dict(quiz, is_completed):
                return {
                    'id': quiz.id,
                    'name': quiz.name,
                    'date_of_quiz': quiz.date_of_quiz,
                    'time_duration': quiz.time_duration,
                    'is_completed': is_completed,
                    'total_question': quiz.total_question,
                    'chapter': {
                        'name': quiz.chapter.name,
                        'subject': {
                            'name': quiz.chapter.subject.name
                        }
                    },
                    'status': 'upcoming' if quiz.date_of_quiz.date() > today_date else 'completed'
                }

            quiz_dict = build_quiz_dict(quiz, is_completed)
            questions_list = [
                {
                    'id': q.id,
                    'question': q.question,
                    'title': q.title,
                    'options': q.options
                } for q in questions
            ]

            return jsonify({'quiz': quiz_dict, 'questions': questions_list})
        except Exception as error:
            abort(500, description=f"An unexpected error occurred: {str(error)}")

api.add_resource(UserQuizQuestionManagement, '/user/quiz/<int:quiz_id>')
# working

