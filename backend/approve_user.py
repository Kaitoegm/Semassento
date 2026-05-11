import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Users\User\Desktop\Programação\Análise estatística\backend")

from sqlmodel import Session, create_engine, select
from main import WaitlistEntry, PlatformUser
from dotenv import load_dotenv

load_dotenv()

email = "juankaitoegm@gmail.com"
db_path = os.getenv("DATABASE_URL")
if db_path and db_path.startswith("postgres://"):
    db_path = db_path.replace("postgres://", "postgresql://", 1)
engine = create_engine(db_path)

with Session(engine) as s:
    user = s.exec(select(PlatformUser).where(PlatformUser.email == email)).first()
    if not user:
        s.add(PlatformUser(email=email, role="admin", is_active=True))
        print("User added to PlatformUser as admin.")
    else:
        user.is_active = True
        user.role = "admin"
        print("User activated in PlatformUser.")

    wl = s.exec(select(WaitlistEntry).where(WaitlistEntry.email == email)).first()
    if wl:
        wl.status = "approved"
        print("User approved in WaitlistEntry.")
    else:
        s.add(WaitlistEntry(email=email, status="approved"))
        print("User added to WaitlistEntry as approved.")

    s.commit()
    print("Done!")
