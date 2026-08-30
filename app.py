import os
import shutil
import io
import re
import json
import base64
import random
from datetime import datetime, time
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logo is already in static/img

app = Flask(__name__, template_folder="templates")

# X-Forwarded-* sarlavhalarini to'g'ri o'qish uchun ProxyFix (Vercel uchun HTTPS)
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# App Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'yashirin_kalit_uchun_biron_matn')

# Baza sozlamalari: Vercel/Supabase uchun DATABASE_URL qidiradi, yo'q bo'lsa mahalliy SQLite ishlatadi
database_url = os.environ.get("DATABASE_URL")
if database_url:
    # SQLAlchemy 'postgres://' emas, 'postgresql://' talab qiladi
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Vercel'da fayl yozish faqat /tmp papkasiga ruxsat etilgan
    if os.environ.get("VERCEL"):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/agrovision.db'
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///agrovision.db'
    
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB & Login
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True) # Yangi: Telefon raqam
    region = db.Column(db.String(50), nullable=True) # Yangi: Viloyat
    password_hash = db.Column(db.String(255), nullable=True) # nullable for google login
    is_admin = db.Column(db.Boolean, default=False)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    subscription_tier = db.Column(db.String(20), default='Free')
    subscription_expiry = db.Column(db.DateTime, nullable=True)
    histories = db.relationship('ScanHistory', backref='author', lazy=True)

class ScanHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    diagnosis = db.Column(db.String(255), nullable=False)
    risk_level = db.Column(db.String(50), nullable=False)
    treatment = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class MarketPrice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    emoji = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    trend_percent = db.Column(db.Float, default=0.0)
    is_up = db.Column(db.Boolean, default=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception:
        return None

# Create Database tables automatically
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"⚠️ Baza yaratishda xatolik (Balki DB ulanmagan): {e}")
        
    # Safely migrate existing users to have is_admin column if it doesn't exist
    try:
        db.session.execute(text('ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT 0'))
        db.session.commit()
    except Exception:
        db.session.rollback()
        
    # Safely migrate Google and Subscription columns
    try:
        db.session.execute(text('ALTER TABLE user ADD COLUMN google_id VARCHAR(255)'))
        db.session.commit()
    except Exception:
        db.session.rollback()
        
    try:
        db.session.execute(text('ALTER TABLE user ADD COLUMN subscription_tier VARCHAR(50) DEFAULT "Free"'))
        db.session.execute(text('ALTER TABLE user ADD COLUMN subscription_expiry DATETIME'))
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Add phone and region if not exists
    try:
        db.session.execute(text('ALTER TABLE user ADD COLUMN phone VARCHAR(20)'))
        db.session.execute(text('ALTER TABLE user ADD COLUMN region VARCHAR(50)'))
        db.session.commit()
    except Exception:
        db.session.rollback()


# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Initialize Gemini API (xavfsiz)
client = None
try:
    import google.genai as genai
    if GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            print("✅ Google Gemini API muvaffaqiyatli ulangan.")
        except Exception as e:
            print(f"⚠️ Gemini API ulanishda xatolik: {e}")
    else:
        print("⚠️ GEMINI_API_KEY topilmadi. AI skaner ishlamaydi.")
except ImportError as ie:
    print(f"⚠️ google.genai kutubxonasini yuklashda xatolik. Skaner ishlamaydi. Xato: {ie}")
except Exception as e:
    print(f"⚠️ Noma'lum xatolik google.genai da: {e}")

SYSTEM_PROMPT = """
Sen O'zbekiston sharoitini mukammal biladigan professional fitopatolog va agronom mutaxassisisan.
Senga qishloq xo'jaligi mahsuloti (sabzavot, meva, ildizmeva, barg yoki o'simlik) rasmi yuborildi.

Rasmni diqqat bilan tahlil qil va faqat quyidagi JSON formatida javob ber:
{
  "crop": "O'simlik yoki mahsulot nomi (masalan: Sabzi, Pomidor, Olma)",
  "diagnosis": "Aniqlangan kasallik yoki zararkunanda (masalan: Qora chirish / Alternarioz)",
  "risk_level": "YUQORI, O'RTA yoki PAST",
  "causes": "Nima sababdan kelib chiqqani haqida qisqa tushuntirish",
  "treatment_medicine": "Tavsiya etiladigan dori (O'zbekistonda mavjud fungitsid/insektitsid)",
  "treatment_dosage": "10 litr suvga yoki 1 tonna hosilga me'yori (dozasi)",
  "treatment_schedule": "Qo'llash tartibi va vaqti",
  "prevention": "Kelgusida hosilni saqlash va profilaktika choralari"
}

MUHIM QOIDA: JSON formatini buzmaslik uchun javobingizdagi matnlar ichida HECH QACHON qo'shtirnoq (") belgisini ishlata ko'rmang! O'zbek tilidagi harflar (O', G') va tutuq belgisi uchun faqat yakkalik tirnoq (') ishlating! Javobing faqat toza JSON bo'lsin, hech qanday boshqa matn qo'shma.
"""


def check_scan_limit(user):
    if user.subscription_tier in ['Premium', 'Business'] or user.id == 1:
        return True
    today_start = datetime.combine(datetime.today(), time.min)
    scans_today = ScanHistory.query.filter(
        ScanHistory.user_id == user.id,
        ScanHistory.timestamp >= today_start
    ).count()
    return scans_today < 2

def check_chat_limit(user):
    if user.subscription_tier in ['Premium', 'Business'] or user.id == 1:
        return True
    today_start = datetime.combine(datetime.today(), time.min)
    msgs_today = ChatMessage.query.filter(
        ChatMessage.user_id == user.id,
        ChatMessage.timestamp >= today_start,
        ChatMessage.role == 'user'
    ).count()
    return msgs_today < 5

@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template("landing.html")

@app.route("/dashboard")
@login_required
def dashboard():
    # Fetch user's recent scans
    recent_scans = ScanHistory.query.filter_by(user_id=current_user.id).order_by(ScanHistory.timestamp.desc()).limit(4).all()
    # Fetch market prices
    market_prices = MarketPrice.query.order_by(MarketPrice.id.asc()).limit(3).all()
    return render_template("index.html", user=current_user, recent_scans=recent_scans, market_prices=market_prices)

# PWA (Progressive Web App) fayllari uchun yo'llar
@app.route('/manifest.json')
def serve_manifest():
    return app.send_static_file('manifest.json')

@app.route('/sw.js')
def serve_sw():
    return app.send_static_file('sw.js')

@app.route("/scanner")
@login_required
def scanner():
    return render_template("scanner.html", user=current_user)

@app.route("/pricing")
def pricing():
    return render_template("pricing.html", user=current_user)

@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        phone = request.form.get("phone")
        region = request.form.get("region")
        
        user = User.query.filter_by(email=email).first()
        if user:
            flash("Bu email allaqachon ro'yxatdan o'tgan.", "error")
            return redirect(url_for('register'))
            
        new_user = User(
            name=name, 
            email=email, 
            password_hash=generate_password_hash(password),
            phone=phone,
            region=region
        )
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return redirect(url_for('index'))
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        user = User.query.filter_by(email=email).first()
        if user and user.password_hash and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('index'))
        elif user and not user.password_hash:
            flash("Bu akkaunt Google orqali yaratilgan. Google tugmasini bosing.", "error")
        else:
            flash("Email yoki parol noto'g'ri.", "error")
    return render_template("login.html")

# GOOGLE OAUTH SOZLAMALARI
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

@app.route("/login/google")
def login_google():
    import requests
    # Google OpenID konfiguratsiyasini olish
    try:
        google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
        authorization_endpoint = google_provider_cfg["authorization_endpoint"]
        
        from urllib.parse import urlencode
        redirect_uri = url_for('auth_google_callback', _external=True)
        # Agar qandaydir sabab bilan http bo'lib qolsa, https ga o'zgartirish (Vercel uchun qo'shimcha himoya)
        if os.environ.get("VERCEL") and redirect_uri.startswith("http://"):
            redirect_uri = redirect_uri.replace("http://", "https://", 1)
            
        request_uri = authorization_endpoint + "?" + urlencode({
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": "openid email profile",
            "response_type": "code"
        })
        return redirect(request_uri)
    except Exception as e:
        flash("Google tizimiga ulanishda xatolik! Kodingizdagi Client ID va Secret ni tekshiring.", "error")
        return redirect(url_for('login'))

@app.route("/auth/google/callback")
def auth_google_callback():
    code = request.args.get("code")
    import requests
    try:
        google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
        token_endpoint = google_provider_cfg["token_endpoint"]
        
        token_url = token_endpoint
        redirect_uri = url_for('auth_google_callback', _external=True)
        if os.environ.get("VERCEL") and redirect_uri.startswith("http://"):
            redirect_uri = redirect_uri.replace("http://", "https://", 1)
            
        token_response = requests.post(
            token_url,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        
        # Token olingandan keyin foydalanuvchi ma'lumotlarini olish
        import json
        tokens = token_response.json()
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        userinfo_response = requests.get(
            userinfo_endpoint,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        
        user_info = userinfo_response.json()
        google_id = user_info["sub"]
        email = user_info["email"]
        name = user_info.get("name", "Foydalanuvchi")
        
        # Foydalanuvchini bazadan izlash
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            # Agar google_id bilan topilmasa, email orqali izlab ko'ramiz
            user = User.query.filter_by(email=email).first()
            if user:
                user.google_id = google_id
                db.session.commit()
            else:
                # Yangi foydalanuvchi yaratish
                user = User(name=name, email=email, google_id=google_id)
                db.session.add(user)
                db.session.commit()
                
        login_user(user)
        return redirect(url_for('index'))
    except Exception as e:
        flash("Google orqali kirish muvaffaqiyatsiz bo'ldi. API kalitlarni tekshiring.", "error")
        return redirect(url_for('login'))

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route("/history")
@login_required
def history():
    user_histories = ScanHistory.query.filter_by(user_id=current_user.id).order_by(ScanHistory.timestamp.desc()).all()
    return render_template("history.html", histories=user_histories, user=current_user)

@app.route("/radar")
@login_required
def radar():
    # Kordinatalar (Viloyat markazlari)
    region_coords = {
        "Toshkent": [41.2995, 69.2401],
        "Andijon": [40.7821, 72.3442],
        "Buxoro": [39.7747, 64.4286],
        "Farg'ona": [40.3842, 71.7843],
        "Jizzax": [40.1158, 67.8422],
        "Xorazm": [41.5500, 60.6333],
        "Namangan": [40.9983, 71.6726],
        "Navoiy": [40.0844, 65.3792],
        "Qashqadaryo": [38.8968, 65.8034],
        "Qoraqalpog'iston": [43.6061, 59.6105],
        "Samarqand": [39.6542, 66.9597],
        "Sirdaryo": [40.4939, 68.7803],
        "Surxondaryo": [37.2216, 67.2772]
    }
    
    # Bazadan oxirgi 100 ta skaner qilingan ma'lumotlarni foydalanuvchi viloyati bilan olish
    recent_scans = db.session.query(ScanHistory, User).join(User, ScanHistory.user_id == User.id).order_by(ScanHistory.timestamp.desc()).limit(100).all()
    
    map_data = []
    for scan, u in recent_scans:
        if u.region and u.region in region_coords:
            map_data.append({
                "region": u.region,
                "lat": region_coords[u.region][0],
                "lng": region_coords[u.region][1],
                "crop": scan.crop_name,
                "diagnosis": scan.diagnosis,
                "risk_level": scan.risk_level,
                "date": scan.timestamp.strftime("%Y-%m-%d")
            })
            
    return render_template("radar.html", user=current_user, map_data=map_data)

@app.route("/admin", methods=["GET", "POST"])
@login_required
def admin_panel():
    if current_user.id != 1:
        flash("Sizda admin huquqlari yo'q!", "error")
        return redirect(url_for('index'))
        
    if not session.get('admin_logged_in'):
        from flask import render_template_string
        if request.method == "POST":
            pwd = request.form.get("admin_password")
            if pwd == "admin2":
                session['admin_logged_in'] = True
                return redirect(url_for('admin_panel'))
            else:
                flash("Xato parol kiritildi!", "error")
                
        return render_template_string('''
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <title>Admin Himoyasi</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 min-h-screen flex items-center justify-center p-4">
            <div class="bg-white p-8 rounded-3xl shadow-2xl w-[400px] max-w-full">
                <div class="flex justify-center mb-6">
                    <div class="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg transform rotate-3">
                        🛡️
                    </div>
                </div>
                <h2 class="text-2xl font-extrabold mb-2 text-center text-slate-800">Admin Panel</h2>
                <p class="text-center text-slate-500 mb-6 text-sm">Davom etish uchun maxfiy parolni kiriting</p>
                
                {% with messages = get_flashed_messages(with_categories=true) %}
                    {% if messages %}
                        {% for category, message in messages %}
                            <div class="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl mb-6 text-sm text-center font-semibold">{{ message }}</div>
                        {% endfor %}
                    {% endif %}
                {% endwith %}
                
                <form method="POST" class="flex flex-col gap-4">
                    <input type="password" name="admin_password" placeholder="Parolni kiriting..." class="bg-stone-50 border border-stone-200 p-3.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-center font-mono text-lg tracking-widest" autofocus required>
                    <button type="submit" class="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl w-full transition-colors shadow-lg">Tasdiqlash</button>
                    <a href="{{ url_for('index') }}" class="text-center text-slate-400 hover:text-slate-600 text-sm mt-2 font-medium transition-colors">Ortga qaytish</a>
                </form>
            </div>
        </body>
        </html>
        ''')
        
    total_users = User.query.count()
    total_scans = ScanHistory.query.count()
    recent_users = User.query.order_by(User.id.desc()).limit(10).all()
    recent_scans = ScanHistory.query.order_by(ScanHistory.timestamp.desc()).limit(10).all()
    market_prices = MarketPrice.query.order_by(MarketPrice.id.asc()).all()
    
    return render_template("admin.html", 
                           total_users=total_users, 
                           total_scans=total_scans,
                           recent_users=recent_users,
                           recent_scans=recent_scans,
                           market_prices=market_prices,
                           user=current_user)

@app.route("/admin/market/update/<int:price_id>", methods=["POST"])
@login_required
def admin_market_update(price_id):
    if current_user.id != 1:
        flash("Ruxsat yo'q!", "error")
        return redirect(url_for('index'))
    
    mp = MarketPrice.query.get_or_404(price_id)
    new_price = request.form.get("price", type=int)
    new_trend = request.form.get("trend_percent", type=float)
    is_up = request.form.get("is_up") == "true"
    
    if new_price is not None:
        mp.price = new_price
    if new_trend is not None:
        mp.trend_percent = new_trend
    mp.is_up = is_up
    
    db.session.commit()
    flash(f"{mp.product_name} narxi muvaffaqiyatli yangilandi!", "success")
    return redirect(url_for('admin_panel'))

@app.route("/admin/upgrade/<int:user_id>", methods=["POST"])
@login_required
def admin_upgrade(user_id):
    if current_user.id != 1:
        flash("Ruxsat yo'q!", "error")
        return redirect(url_for('index'))
    
    target_user = User.query.get_or_404(user_id)
    new_tier = request.form.get("tier")
    
    if new_tier in ["Free", "Premium", "Business"]:
        target_user.subscription_tier = new_tier
        db.session.commit()
        flash(f"{target_user.name} obunasi {new_tier} ga o'zgartirildi!", "success")
        
    return redirect(url_for('admin_panel'))

@app.route("/market")
@login_required
def market():
    market_prices = MarketPrice.query.order_by(MarketPrice.id.asc()).all()
    return render_template("market.html", user=current_user, market_prices=market_prices)

@app.route("/weather")
@login_required
def weather():
    return render_template("weather.html", user=current_user)

@app.route("/chat")
@login_required
def chat():
    # Fetch chat history for this user
    chat_history = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.timestamp.asc()).all()
    return render_template("chat.html", user=current_user, history=chat_history)

CHAT_SYSTEM_PROMPT = """Sen O'zbekistonlik tajribali, muloyim va aqlli agronom-maslahatchisan. 
Sening vazifang fermerlar, dehqonlar va issiqxona egalarining qishloq xo'jaligiga oid savollariga (ekinlar, kasalliklar, o'g'itlar, dorilar, chorvachilik) aniq, ilmiy asoslangan va sodda tilda javob berishdir.
O'zbek tilida, do'stona ohangda gaplash. Faqat qishloq xo'jaligiga oid savollarga javob ber, boshqa mavzularga aralashma.
Maslahatlaringda O'zbekiston sharoitiga mos keladigan chora-tadbirlarni ayt. Matningni chiroyli va qulay qilib (bold, ro'yxat, emojilar bilan) yoz."""

@app.route("/api/chat", methods=["POST"])
def api_chat():
    if not current_user.is_authenticated:
        return jsonify({"success": False, "error": "Tizimga kiring"}), 401
        
    if not check_chat_limit(current_user):
        return jsonify({
            "success": False, 
            "error": "Free tarifida kunlik limit tugadi (Max 5 ta savol). Iltimos, Premium obunasini xarid qiling!"
        }), 403
    
    try:
        data = request.get_json()
        message = data.get("message", "")
        
        if not message:
            return jsonify({"success": False, "error": "Bo'sh xabar"}), 400
            
        if not client:
            return jsonify({"success": False, "error": "Gemini API kaliti topilmadi"}), 500
            
        # Save User Message to DB
        new_user_msg = ChatMessage(user_id=current_user.id, role="user", content=message)
        db.session.add(new_user_msg)
        
        # Fetch previous context (max last 20 messages to save tokens)
        history_records = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.timestamp.desc()).limit(20).all()
        history_records.reverse()
        
        # Build API messages array (for Gemini)
        contents = []
        for msg in history_records:
            if msg.content.strip(): # Skip empty
                role = "user" if msg.role == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg.content}]})
        
        # Add system prompt as the first message or use system instructions
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(
                    system_instruction=CHAT_SYSTEM_PROMPT,
                    temperature=0.7
                )
            )
            response_text = response.text
        except Exception as api_e:
            print(f"Gemini API Error in chat: {api_e}")
            return jsonify({"success": False, "error": f"AI xatosi: {str(api_e)}"}), 500
                
        # Save AI Response to DB
        new_ai_msg = ChatMessage(user_id=current_user.id, role="assistant", content=response_text)
        db.session.add(new_ai_msg)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "response": response_text
        })
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/chat/clear", methods=["POST"])
def clear_chat():
    if not current_user.is_authenticated:
        return jsonify({"success": False, "error": "Tizimga kiring"}), 401
    try:
        ChatMessage.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/market/sync", methods=["POST"])
@login_required
def sync_market():
    # Faqat adminlar narxni yangilashi mumkin
    if current_user.id != 1:
        return jsonify({"success": False, "error": "Ruxsat yo'q"}), 403
        
    try:
        if not client:
            return jsonify({"success": False, "error": "Gemini API kaliti topilmadi"}), 500
        
        prompt = """Sen O'zbekiston qishloq xo'jaligi bozorlari ekspertisan. 
Sening vazifang - bozordagi bugungi O'RTACHA ULGURJI narxlarni (so'mda) taxmin qilib, JSON formatida qaytarish.
Quyidagi mahsulotlar ro'yxatini ber: Pomidor, Bodring, Kartoshka, Olma, Piyoz, Sabzi, Uzum, Qovun, Tarvuz, Go'sht.
Go'sht (Mol yoki Qo'y go'shti) narxini taxminan 120 000 so'm atrofida deb hisobla!
Har bir obyektda: 
- product_name (nomi o'zbek tilida)
- emoji (mahsulot belgisi, masalan 🍅)
- price (narxi butun raqamda, so'm)
- trend_percent (narx o'zgarishi foizda, float)
- is_up (qimmatlagan bo'lsa true, arzonlagan bo'lsa false, boolean)

Faqat valid JSON array qaytar, boshqa hech qanday tekst yozma! Format namunasi:
[
  {"product_name": "Pomidor", "emoji": "🍅", "price": 8500, "trend_percent": 2.5, "is_up": true}
]"""

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )
        
        json_str = response.text.strip()
        
        # Tozalash
        if json_str.startswith('```json'):
            json_str = json_str.split('```json')[1].split('```')[0].strip()
        elif json_str.startswith('```'):
            json_str = json_str.split('```')[1].split('```')[0].strip()
            
        data = json.loads(json_str)
        
        # Bazani tozalash va yangilarini yozish
        MarketPrice.query.delete()
        
        for item in data:
            mp = MarketPrice(
                product_name=item.get('product_name', 'Noma\'lum'),
                emoji=item.get('emoji', '📦'),
                price=item.get('price', 0),
                trend_percent=item.get('trend_percent', 0.0),
                is_up=item.get('is_up', True)
            )
            db.session.add(mp)
            
        db.session.commit()
        return jsonify({"success": True})
        
    except Exception as e:
        print(f"Market Sync Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "app": "AgroVision AI",
        "version": "1.0.0",
        "gemini_active": client is not None
    })

@app.route("/api/analyze", methods=["POST"])
def analyze():
    # Require authentication for the API
    if not current_user.is_authenticated:
        return jsonify({
            "success": False,
            "error": "Tahlil qilish uchun tizimga kiring (Ro'yxatdan o'ting)."
        }), 401

    if not check_scan_limit(current_user):
        return jsonify({
            "success": False,
            "error": "Free tarifida kunlik limit tugadi (Max 2 ta). Iltimos, Premium obunasini xarid qiling!"
        }), 403

    try:
        image_bytes = None

        # 1. Handle file upload (multipart/form-data)
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                image_bytes = file.read()

        # 2. Handle base64 or URL upload (Important for frontend preset samples!)
        b64_str = None
        if not image_bytes:
            if 'image_data' in request.form:
                b64_str = request.form['image_data']
            elif request.is_json:
                data = request.get_json()
                if 'image_data' in data:
                    b64_str = data['image_data']

        if b64_str:
            if b64_str.startswith('http'):
                import urllib.request
                req = urllib.request.Request(b64_str, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response:
                    image_bytes = response.read()
            else:
                if ',' in b64_str:
                    b64_str = b64_str.split(',', 1)[1]
                image_bytes = base64.b64decode(b64_str)

        if not image_bytes:
            return jsonify({
                "success": False,
                "error": "Rasm yuklanmadi. Iltimos, sifatli rasmni tanlang."
            }), 400

        # Load image via PIL
        img = Image.open(io.BytesIO(image_bytes))

        # Strict Gemini API execution
        if client is None:
            return jsonify({
                "success": False,
                "error": "Gemini API kaliti kiritilmagan yoki xato."
            }), 500

        try:
            from google.genai import types
            
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=[img, SYSTEM_PROMPT],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            # Parse JSON text safely
            text = response.text.strip()
            # Clean up markdown
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                if text.endswith("```"):
                    text = text[:-3]
            text = text.strip()
            
            # Additional cleanup for invalid control characters
            text = text.replace('\n', ' ').replace('\r', '')
            
            try:
                parsed_data = json.loads(text)
            except json.JSONDecodeError:
                # Fallback matching
                import re
                parsed_data = {}
                keys = ["crop", "diagnosis", "risk_level", "causes", "treatment_medicine", "treatment_dosage", "treatment_schedule", "prevention"]
                for key in keys:
                    match = re.search(f'"{key}"\s*:\s*"([^"]*)"', text)
                    if match:
                        parsed_data[key] = match.group(1)
                    else:
                        parsed_data[key] = "Topilmadi"
            
            # Save history to database
            new_history = ScanHistory(
                user_id=current_user.id,
                crop_name=parsed_data.get("crop", "Noma'lum"),
                diagnosis=parsed_data.get("diagnosis", "Aniqlanmadi"),
                risk_level=parsed_data.get("risk_level", "O'RTA"),
                treatment=parsed_data.get("treatment_medicine", "")
            )
            db.session.add(new_history)
            db.session.commit()
            
            return jsonify({
                "success": True,
                "is_demo_mode": False,
                "data": parsed_data
            })
            
        except Exception as ai_err:
            print(f"⚠️ Gemini API chaqiruvida xatolik: {ai_err}")
            return jsonify({
                "success": False,
                "error": f"Sun'iy intellekt tahlilida xatolik yuz berdi: {str(ai_err)}"
            }), 500

    except Exception as e:
        print(f"Server Error in /api/analyze: {e}")
        return jsonify({
            "success": False,
            "error": f"Tahlil jarayonida kutilmagan xatolik yuz berdi: {str(e)}"
        }), 500

@app.errorhandler(500)
def internal_error(error):
    import traceback
    return f"<h1>Server Xatoligi (500)</h1><pre>{traceback.format_exc()}</pre>", 500

@app.errorhandler(Exception)
def unhandled_exception(e):
    import traceback
    return f"<h1>Kutilmagan Xatolik</h1><pre>{traceback.format_exc()}</pre>", 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 AgroVision AI server ishga tushmoqda: http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
