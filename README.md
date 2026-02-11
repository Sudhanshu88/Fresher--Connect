# FresherConnect

FresherConnect is a Flask-based job platform UI for freshers and early-career professionals.

## Frontend Pages
- Landing page (`/`)
- Login page (`/login`)
- Registration page (`/register`)
- Dashboard (`/dashboard`)
- Category jobs page (`/jobs/<category>`)

## Run Locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then open: `http://127.0.0.1:5000`

## Notes
- UI is responsive and supports mobile layouts.
- Client-side validation is enabled for auth forms.
- Dashboard supports in-page job search/filter interactions.
