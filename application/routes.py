from .database import db
from flask import current_app as app,jsonify,request,render_template,send_file
from flask_security import auth_required,roles_required,current_user
from werkzeug.security import check_password_hash,generate_password_hash
from datetime import datetime
from .tasks import create_admin_resource_csv,create_resource_csv
from .models import db
from celery.result import AsyncResult




@app.route('/',methods=['GET'])
def home():
    return render_template("index.html")


@app.route('/admin')
@auth_required('token')
@roles_required('admin')
def admin_home():
    return jsonify({
        "message":"admin login successfull"
    })


@app.route('/user/register',methods=['POST'])
def create_user():
    credentials=request.get_json()
    if not app.security.datastore.find_user(email = credentials["email"]):
        app.security.datastore.create_user(email = credentials["email"],
                                           username = credentials["username"],
                                           password = generate_password_hash(credentials["password"]),
                                           full_name=credentials["full_name"],
                                           qualification=credentials["qualification"],
                                           dob=datetime.strptime(credentials["dob"], "%Y-%m-%d"),
                                           active=True,
                                           roles = ['user'])
        db.session.commit()
        return jsonify({
            "message":"User created Successfully"
        }),201
    return jsonify({
            "message":"User already exists"
        }),400

@app.route('/user/login',methods=['POST'])
def login():
    credentials = request.get_json()
    
    email = credentials.get('email')
    password = credentials.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password must be provided."}), 400

    user = app.security.datastore.find_user(email=email)
    

    if not user:
        return jsonify({"message": "User Not Found"}), 404

    if not user.active:
        return jsonify({"message": "Your account is deactivated. Please contact the administrator."}), 403

    if check_password_hash(user.password, credentials.get("password")): 
        return jsonify({
            "token": user.get_auth_token(),
            "email": user.email,
            "role": user.roles[0].name
        })
    else:
        return jsonify({"message": "Wrong Password"}), 400
    

