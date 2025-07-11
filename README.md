create envoriment: python3 -m venv .env
activate:  source .env/bin/activate
Install dependencies: pip install -r requirements.txt


s1 in terminal -->> MailHog
s2 in terminal -->> sudo systemctl stop redis || redis-server
s3 in terminal -->> celery -A app.celery worker --loglevel INFO
s4 in terminal -->> celery -A app.celery beat --loglevel INFO
s5 in terminal -->> python3 app.py

