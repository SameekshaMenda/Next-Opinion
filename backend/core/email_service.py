import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

# ------------------------------------
# BASIC EMAIL CONFIG (Gmail Example)
# ------------------------------------
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# ⚠️ Use an App Password, not your real password
EMAIL_ADDRESS = "your_email@gmail.com"
EMAIL_PASSWORD = "your_app_password_here"


def send_email(to, subject, body, attachments=None):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        # Attach files (PDF reports)
        if attachments:
            for filename, file_bytes in attachments:
                part = MIMEApplication(file_bytes, Name=filename)
                part["Content-Disposition"] = f'attachment; filename="{filename}"'
                msg.attach(part)

        # Connect & send
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, to, msg.as_string())
        server.quit()

        print(f"📧 Email successfully sent to {to}")

    except Exception as e:
        print(f"❌ Email sending failed: {e}")
