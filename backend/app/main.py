from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, jobs, resumes, matching

# Create Database tables (simple SQLite/Postgres auto-migration for boilerplate)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database tables creation failed (expected if db is not ready yet): {e}")

app = FastAPI(
    title="HireIQ API",
    description="Production-grade AI Resume Screening & Job Matching Platform API",
    version="1.0.0"
)

@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        from app.models import User, Job, Resume, Application
        from app.auth import get_password_hash
        
        # Check if database is empty
        if db.query(User).count() == 0:
            print("Seeding default database records...")
            
            # 1. Create Recruiter
            recruiter = User(
                email="recruiter@hireiq.com",
                hashed_password=get_password_hash("password123"),
                full_name="Alex Mercer",
                role="recruiter"
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)
            
            # 2. Create Candidate
            candidate = User(
                email="candidate@hireiq.com",
                hashed_password=get_password_hash("password123"),
                full_name="Jordan Smith",
                role="candidate"
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)
            
            # 3. Create Sample Job
            job = Job(
                title="Python Backend Developer",
                company="TechCorp Solutions",
                description="We are looking for a Python Developer who loves building high-performance APIs. You will work with FastAPI, PostgreSQL, Docker, and AWS. Familiarity with machine learning models and vector search is a plus.",
                required_skills=["python", "fastapi", "postgresql", "docker", "aws"],
                min_experience=3,
                min_education="Bachelor",
                recruiter_id=recruiter.id
            )
            db.add(job)
            db.commit()
            db.refresh(job)

            # 4. Create Sample Resume
            resume = Resume(
                candidate_id=candidate.id,
                filename="jordan_smith_resume.pdf",
                file_path="/app/uploads/jordan_smith_resume.pdf",
                raw_text="Jordan Smith\nEmail: candidate@hireiq.com\nPhone: (123) 456-7890\nEducation: Bachelor of Science in Computer Science, 2021\nSkills: Python, FastAPI, Docker, SQL, JavaScript.\nProjects:\n- AI Resume Screener: Built a python backend using FastAPI and Docker to match job descriptions.",
                parsed_name="Jordan Smith",
                parsed_email="candidate@hireiq.com",
                parsed_phone="(123) 456-7890",
                parsed_skills=["python", "fastapi", "docker", "sql", "javascript"],
                parsed_education=[{"degree": "Bachelor of Science in Computer Science", "level": "bachelor", "year": "2021"}],
                parsed_experience=[{"role_details": "Software Developer (2021 - Present)", "duration": "2021 - Present", "responsibilities": []}],
                parsed_projects=[{"title": "AI Resume Screener", "description": "Built a python backend using FastAPI and Docker to match job descriptions."}],
                parsed_certifications=[]
            )
            db.add(resume)
            db.commit()
            db.refresh(resume)

            # 5. Create Sample Application
            from app.services.matching_service import MatchingService
            matcher = MatchingService()
            
            resume_data = {
                "skills": resume.parsed_skills,
                "experience": resume.parsed_experience,
                "education": resume.parsed_education,
                "projects": resume.parsed_projects,
                "certifications": resume.parsed_certifications
            }
            
            job_data = {
                "title": job.title,
                "description": job.description,
                "required_skills": job.required_skills,
                "min_experience": job.min_experience,
                "min_education": job.min_education
            }
            
            match_res = matcher.calculate_match(resume_data, resume.raw_text, job_data)
            
            application = Application(
                job_id=job.id,
                resume_id=resume.id,
                overall_score=match_res["overall_score"],
                skill_match_score=match_res["skill_match_score"],
                experience_score=match_res["experience_score"],
                education_score=match_res["education_score"],
                projects_score=match_res["projects_score"],
                missing_skills=match_res["missing_skills"],
                recommendations=match_res["recommendations"],
                status="Applied"
            )
            db.add(application)
            db.commit()
            print("Database seeded successfully with test recruiter, candidate, and scores.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# CORS configuration
origins = [
    "http://localhost:5173",  # React local dev
    "http://127.0.0.1:5173",
    "*"                       # Allow all for docker environments (customize for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(matching.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to HireIQ AI Resume Screening API. Go to /docs for OpenAPI documentation."
    }
