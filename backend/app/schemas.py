from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Token & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = Field(..., description="Role must be 'candidate' or 'recruiter'")

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Job Schemas ---
class JobCreate(BaseModel):
    title: str
    description: str
    company: str
    required_skills: List[str]
    min_experience: int = 0
    min_education: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    company: str
    required_skills: List[str]
    min_experience: int
    min_education: Optional[str]
    recruiter_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Resume Schemas ---
class ResumeResponse(BaseModel):
    id: int
    candidate_id: int
    filename: str
    parsed_name: Optional[str] = None
    parsed_email: Optional[str] = None
    parsed_phone: Optional[str] = None
    parsed_skills: List[str] = []
    parsed_education: List[Any] = []
    parsed_experience: List[Any] = []
    parsed_projects: List[Any] = []
    parsed_certifications: List[Any] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    resume_id: int
    overall_score: float
    skill_match_score: float
    experience_score: float
    education_score: float
    projects_score: float
    missing_skills: List[str]
    recommendations: Dict[str, Any]
    status: str
    created_at: datetime
    job: Optional[JobResponse] = None
    resume: Optional[ResumeResponse] = None

    class Config:
        from_attributes = True

class ApplicationUpdateStatus(BaseModel):
    status: str = Field(..., description="Status e.g. Applied, Shortlisted, Rejected")

# --- Dashboard & Stats Schemas ---
class CandidateDashboardData(BaseModel):
    resume: Optional[ResumeResponse] = None
    applications: List[ApplicationResponse] = []

class RecruiterDashboardData(BaseModel):
    total_jobs: int
    total_candidates: int
    shortlisted_candidates: int
    jobs: List[JobResponse] = []
