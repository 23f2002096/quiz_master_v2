# ===== Corrected imports =====
from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask_security import auth_required,roles_required, roles_accepted, current_user, hash_password
from flask import request,jsonify,abort,send_file
from datetime import datetime
from uuid import uuid4
from .models import db, User, Role,Subject,Chapter,Question,Quiz,Score,UserAnswer
from sqlalchemy.exc import SQLAlchemyError,IntegrityError
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import aliased
from flask_restful import marshal
from sqlalchemy import func
# from celery.result import AsyncResult
from io import BytesIO
import csv

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
