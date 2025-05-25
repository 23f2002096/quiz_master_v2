from .database import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime


class RolesUsers(db.Model):
    id=db.Column(db.Integer(), primary_key=True)
    user_id=db.Column('user_id', db.Integer(), db.ForeignKey('user.id'))
    role_id=db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))

class User(db.Model,UserMixin):
    id=db.Column(db.Integer,primary_key=True)
    username=db.Column(db.String(32),unique=True,nullable=False)
    password=db.Column(db.String(256), nullable=False)
    full_name=db.Column(db.String(64), nullable=True)
    email=db.Column(db.String,unique=True)
    qualification=db.Column(db.String(64), nullable=True)
    dob=db.Column(db.DateTime, nullable=True)
    active=db.Column(db.Boolean())
    scores = db.relationship('Score', backref='user', lazy=True)
    fs_uniquifier = db.Column(db.String(256), unique=True, nullable=False)
    roles= db.relationship('Role', secondary='roles_users',backref=db.backref('users', lazy='dynamic'))


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(64), unique = True, nullable = False)
    description = db.Column(db.String(256))

class Subject(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    name=db.Column(db.String(64),unique=True, nullable=False)
    description=db.Column(db.String(256), nullable=True)
    chapters = db.relationship('Chapter',back_populates='subject',lazy=True,cascade='all, delete-orphan')

class Chapter(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    name=db.Column(db.String(64), nullable=False)
    description=db.Column(db.String(256), nullable=True)
    subject_id=db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    quizzes = db.relationship('Quiz',lazy='joined',cascade='all, delete',back_populates='chapter')
    subject = db.relationship('Subject',back_populates='chapters',lazy='select',cascade='save-update')



class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    question = db.Column(db.String(256), nullable=False)
    options = db.Column(db.JSON, nullable=False)  # Store options as JSON
    answer = db.Column(db.String(100), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id', ondelete='CASCADE'), nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (db.Index('idx_question_quiz_id', 'quiz_id'),)
    

class Quiz(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    name=db.Column(db.String(128),nullable=False)
    chapter_id=db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)
    date_of_quiz=db.Column(db.DateTime, nullable=False)
    time_duration = db.Column(db.String(16), nullable=False)
    total_question=db.Column(db.Integer,nullable=False)
    remarks=db.Column(db.String(256), nullable=True)
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete')
    scores = db.relationship('Score', backref='quiz', lazy=True)
    chapter = db.relationship('Chapter', back_populates='quizzes')
    __table_args__ = (db.Index('idx_quiz_chapter_id', 'chapter_id'),)
    

class Score(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    user_id=db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quiz_id=db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    total_score=db.Column(db.Integer, nullable=False)
    time_stamp_of_attempt=db.Column(db.DateTime, nullable=False,default=datetime.utcnow)
    is_completed = db.Column(db.Boolean, default=False)


class UserAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id', ondelete='CASCADE'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id', ondelete='CASCADE'), nullable=False)
    chosen_option = db.Column(db.String(100), nullable=True)  # Option selected by the user

    __table_args__ = (
        db.UniqueConstraint('user_id', 'quiz_id', 'question_id', name='uq_user_quiz_question'),
    )

