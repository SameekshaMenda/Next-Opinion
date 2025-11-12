from core.database import db
from core.models import Notification

def send_notification(user_id, message):
    notif = Notification(user_id=user_id, message=message)
    db.session.add(notif)
    db.session.commit()
    print(f"📨 Notification → User {user_id}: {message}")
     