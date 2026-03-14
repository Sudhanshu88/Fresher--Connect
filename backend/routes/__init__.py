from .auth_routes import auth_bp
from .company_routes import company_bp
from .job_routes import jobs_bp
from .system_routes import system_bp
from .user_routes import user_bp


def register_routes(app):
    for blueprint in (system_bp, auth_bp, jobs_bp, user_bp, company_bp):
        app.register_blueprint(blueprint)


__all__ = ["register_routes"]
