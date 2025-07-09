from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_SERVER_HOST = "localhost"
SMTP_SERVER_PORT = 1025
SENDER_ADDRESS = 'quizmaster@donotreply.in'
SENDER_PASSWORD = ''


def send_email(to_address, subject, message):
    msg = MIMEMultipart()
    msg["From"] = SENDER_ADDRESS
    msg["To"] = to_address
    msg["Subject"] = subject

    
    msg.attach(MIMEText(message, 'html'))
    client = SMTP(host=SMTP_SERVER_HOST, port=SMTP_SERVER_PORT)
    client.send_message(msg=msg)
    client.quit()
