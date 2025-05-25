s1 in terminal -->> MailHog
s2 -->> redis-server || sudo systemctl stop redis
s3 -->> celery -A app.celery worker --loglevel INFO
s4 -->> celery -A app.celery beat --loglevel INFO
s5 -->> python3 app.py

activate:  source .env/bin/activate