import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'candidate' or 'recruiter'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="recruiter", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    company = Column(String, nullable=False)
    required_skills = Column(JSON, nullable=False)  # List of strings
    min_experience = Column(Integer, default=0)     # in years
    min_education = Column(String, nullable=True)     # Minimum degree required
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    recruiter = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    
    # Extracted fields
    parsed_name = Column(String, nullable=True)
    parsed_email = Column(String, nullable=True)
    parsed_phone = Column(String, nullable=True)
    parsed_skills = Column(JSON, default=list)            # List of strings
    parsed_education = Column(JSON, default=list)         # List of education records
    parsed_experience = Column(JSON, default=list)        # List of work experience
    parsed_projects = Column(JSON, default=list)          # List of project details
    parsed_certifications = Column(JSON, default=list)    # List of certifications
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    candidate = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    
    # Matching details
    overall_score = Column(Float, default=0.0)
    skill_match_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    projects_score = Column(Float, default=0.0)
    
    missing_skills = Column(JSON, default=list)            # List of missing skills
    recommendations = Column(JSON, default=dict)           # Roadmap & recommendations
    status = Column(String, default="Applied")            # Applied, Shortlisted, Rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
