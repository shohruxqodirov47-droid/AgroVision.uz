import sqlite3
import sys

def make_admin(email):
    try:
        conn = sqlite3.connect('instance/agrovision.db')
    except sqlite3.OperationalError:
        try:
            conn = sqlite3.connect('agrovision.db')
        except sqlite3.OperationalError:
            print("❌ Bazani topib bo'lmadi.")
            return
            
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, name FROM user WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user:
        cursor.execute("UPDATE user SET is_admin = 1 WHERE email = ?", (email,))
        conn.commit()
        print(f"✅ MUVAFFAQIYAT! '{user[1]}' ({email}) endi ADMIN huquqiga ega.")
    else:
        print(f"❌ XATOLIK: '{email}' pochtali foydalanuvchi topilmadi. Avval saytdan ro'yxatdan o'ting.")
        
    conn.close()

if __name__ == "__main__":
    print("=== AgroVision AI: Admin Tayinlash ===")
    email = input("Admin qilmoqchi bo'lgan pochtangizni yozing (masalan: admin@mail.uz): ")
    make_admin(email.strip())
