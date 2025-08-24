import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mysqldb import MySQL
from werkzeug.security import check_password_hash
from dotenv import load_dotenv
import pymysql
from flask_mysqldb import MySQL 
from flask_sqlalchemy import SQLAlchemy
 # if you keep it
# or use flask-mysql or flask-sqlalchemy with pymysql

# Ensure pymysql is used as MySQLdb
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Sudhanshu@8825',
    db='fresher_connect'
)
print("Connected!")
conn.close()
pymysql.install_as_MySQLdb()

# ---------------------------
# Flask + MySQL Configuration
# ---------------------------
load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:Sudhanshu@8825@localhost/fresher_connect"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

app.config["MYSQL_HOST"] = os.getenv("MYSQL_HOST", "localhost")
app.config["MYSQL_USER"] = os.getenv("MYSQL_USER", "root")
app.config["MYSQL_PASSWORD"] = os.getenv("MYSQL_PASSWORD", "Sudhanshu@8825")
app.config["MYSQL_DB"] = os.getenv("MYSQL_DB", "fresher_connect")
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

mysql = MySQL(app)

# ---------------------------
# Helper Functions
# ---------------------------
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT id, name, email, role FROM users WHERE id = %s",
        (user_id,)
    )
    user = cur.fetchone()
    cur.close()
    return user

def login_required(func):
    from functools import wraps
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return redirect(url_for("login"))
        return func(*args, **kwargs)
    return wrapper

# ---------------------------
# Routes
# ---------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        role = request.form.get("role", "")
        phone = request.form.get("phone", "").strip()
        location = request.form.get("location", "").strip()
        education = request.form.get("education", "").strip()
        skills_csv = request.form.get("skills", "").strip()
        summary = request.form.get("summary", "").strip()
        resume_path = request.form.get("resume_path", "").strip()

        if not name or not email or not password or role not in ["fresher", "experienced", "employer"]:
            flash("Please fill all required fields with valid values.", "error")
            return redirect(url_for("register"))

        # Convert CSV to JSON array string
        skills_list = [s.strip() for s in skills_csv.split(",") if s.strip()] if skills_csv else []

        cur = mysql.connection.cursor()
        # Duplicate check
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            flash("Email already registered. Please log in.", "error")
            return redirect(url_for("login"))

        # Insert user with hashed password
        cur.execute(
            """
            INSERT INTO users (name, email, password_hash, role, phone, location, education, skills, summary, resume_path, is_premium)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CAST(%s AS JSON), %s, %s, %s)
            """,
            (name, email, check_password_hash(password), role, phone, location, education,
             str(skills_list).replace("'", '"'), summary, resume_path, False)
        )
        mysql.connection.commit()
        cur.close()
        flash("Registration successful. Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, name, email, password_hash, role FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()

        if user and check_password_hash(user["password_hash"], password):
            session.clear()
            session["user_id"] = user["id"]
            session["user_role"] = user["role"]
            return redirect(url_for("dashboard"))

        flash("Invalid credentials. Please try again.", "error")
        return redirect(url_for("login"))

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/dashboard")
@login_required
def dashboard():
    user = current_user()
    cur = mysql.connection.cursor()
    cur.execute(
        """
        SELECT j.id, j.title, j.company_name, j.location, j.experience_level, j.job_type,
               c.name AS category_name, j.description, j.requirements, j.created_at
        FROM jobs j
        LEFT JOIN job_category_map m ON m.job_id = j.id
        LEFT JOIN job_categories c ON c.id = m.category_id
        WHERE j.is_active = TRUE
        GROUP BY j.id
        ORDER BY j.created_at DESC
        LIMIT 12
        """
    )
    jobs = cur.fetchall()

    cur.execute(
        "SELECT a.id, a.status, a.applied_at, j.title, j.company_name FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.user_id = %s ORDER BY a.applied_at DESC",
        (user["id"],)
    )
    apps = cur.fetchall()

    cur.execute(
        "SELECT * FROM payments WHERE user_id = %s ORDER BY created_at DESC",
        (user["id"],)
    )
    pays = cur.fetchall()
    cur.close()

    return render_template("dashboard.html", user=user, jobs=jobs, apps=apps, pays=pays)

@app.route("/jobs/<category>")
@login_required
def jobs_by_category(category):
    cur = mysql.connection.cursor()
    cur.execute(
        """
        SELECT j.id, j.title, j.company_name, j.location, j.experience_level, j.job_type,
               c.name AS category_name, j.description, j.requirements, j.created_at
        FROM jobs j
        JOIN job_category_map m ON m.job_id = j.id
        JOIN job_categories c ON c.id = m.category_id
        WHERE j.is_active = TRUE AND c.name = %s
        ORDER BY j.created_at DESC
        """,
        (category,)
    )
    jobs = cur.fetchall()
    cur.close()
    return render_template("jobs.html", category=category, jobs=jobs)

@app.post("/api/apply")
@login_required
def api_apply():
    user_id = session["user_id"]
    job_id = request.json.get("job_id")
    if not job_id:
        return jsonify({"ok": False, "error": "job_id_required"}), 400

    cur = mysql.connection.cursor()
    try:
        cur.execute("INSERT INTO applications (user_id, job_id, status) VALUES (%s, %s, 'applied')", (user_id, job_id))
        mysql.connection.commit()
    except Exception:
        mysql.connection.rollback()
        return jsonify({"ok": False, "error": "already_applied_or_invalid"}), 400
    finally:
        cur.close()
    return jsonify({"ok": True})

# ---------------------------
# Run App
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True)
