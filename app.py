from flask import Flask 
from application.database import db 
from application.models import User, Role 
from application.resource import api
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore,hash_password
from werkzeug.security import generate_password_hash
from application.celery_init import celery_init_app #new line
from celery.schedules import crontab
from application.extensions import cache


def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)
    cache.init_app(app, config={'CACHE_TYPE': 'simple'})
    api.init_app(app)
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    app.app_context().push()
    return app

app = create_app()
celery=celery_init_app(app)  # new line
celery.autodiscover_tasks()

with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin", description = "Superuser of app")
    app.security.datastore.find_or_create_role(name = "user", description = "General user of app")
    db.session.commit()
    if not app.security.datastore.find_user(email = "admin@quizmaster.ac.in"):
        app.security.datastore.create_user(email = "admin@quizmaster.ac.in",
                                           username = "admin01",
                                           password = generate_password_hash("admin"),
                                           roles = ['admin'])
        
    
    db.session.commit()

from application.routes import *

from application.tasks import send_daily_reminders, send_monthly_reports
@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab('*/2'),
        # crontab(hour=15, minute=57),
        send_daily_reminders.s(),
    )
    
    
    sender.add_periodic_task(
        # crontab(day_of_month=12, hour=15, minute=57),
        crontab('*/3'),
        send_monthly_reports.s(),
    )

if __name__ == "__main__":
    app.run()
