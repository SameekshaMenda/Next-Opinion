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

# ✅ FINAL CODE: The function definition uses 'attachment_paths'
def send_email(to, subject, body, attachment_paths=None):
    """
    Sends an email with optional attachments using the SMTP configuration.
    
    Args:
        to (str): Recipient email address.
        subject (str): Email subject.
        body (str): Email body text.
        attachment_paths (list): List of local file paths to attach.
    """
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("❌ Email sending failed: MAIL_USERNAME or MAIL_PASSWORD environment variables are not set.")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = str(Header(EMAIL_ADDRESS, "utf-8"))
        msg["To"] = str(Header(to, "utf-8"))
        msg["Subject"] = Header(subject, "utf-8")

        # Email body
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Attachments
        if attachment_paths:
            for file_path in attachment_paths:
                try:
                    # Read the file content
                    with open(file_path, "rb") as f:
                        file_bytes = f.read()
                    
                    filename = os.path.basename(file_path)
                    part = MIMEApplication(file_bytes, Name=filename)
                    
                    # Add Content-Disposition header
                    part.add_header(
                        "Content-Disposition",
                        f'attachment; filename="{filename}"'
                    )
                    msg.attach(part)
                    print(f"📎 Attached file: {filename}")
                except Exception as file_err:
                    print(f"❌ Error reading or attaching file {file_path}: {file_err}")

        # SMTP Send
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, to, msg.as_string())
        server.quit()

        print(f"📧 Email sent successfully to → {to}")

    except Exception as e:
        print(f"❌ Email sending failed: {e}")