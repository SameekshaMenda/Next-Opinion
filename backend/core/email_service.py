import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.mime.application import MIMEApplication
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("MAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

def send_email(to, subject, body, attachments=None):
    try:
        # Force UTF-8 everywhere
        msg = MIMEMultipart()
        msg["From"] = str(Header(EMAIL_ADDRESS, "utf-8"))
        msg["To"] = str(Header(to, "utf-8"))
        msg["Subject"] = Header(subject, "utf-8")

        # Email body WITH UTF-8
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Attachments (safe)
        if attachments:
            for filename, file_bytes in attachments:
                part = MIMEApplication(file_bytes, Name=filename)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{filename}"'
                )
                msg.attach(part)

        # SMTP Send
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, to, msg.as_string())
        server.quit()

        print(f"📧 Email sent → {to}")

    except Exception as e:
        print(f"❌ Email sending failed: {e}")
