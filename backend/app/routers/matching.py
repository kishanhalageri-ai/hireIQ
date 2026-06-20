from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Application, Job, Resume, User
from app.schemas import ApplicationResponse, ApplicationUpdateStatus, CandidateDashboardData, RecruiterDashboardData
from app.auth import get_current_user, require_candidate, require_recruiter
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/api", tags=["Job Applications & Matching"])
matching_service = MatchingService()

@router.post("/applications/apply/{job_id}", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    # 1. Fetch job description
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )

    # 2. Fetch candidate resume
    resume = db.query(Resume).filter(Resume.candidate_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload your resume before applying"
        )

    # 3. Check if already applied
    existing_app = db.query(Application).filter(
        Application.job_id == job_id,
        Application.resume_id == resume.id
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job"
        )

    # 4. Run AI matching engine
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

    match_result = matching_service.calculate_match(resume_data, resume.raw_text, job_data)

    # 5. Create application entry
    application = Application(
        job_id=job.id,
        resume_id=resume.id,
        overall_score=match_result["overall_score"],
        skill_match_score=match_result["skill_match_score"],
        experience_score=match_result["experience_score"],
        education_score=match_result["education_score"],
        projects_score=match_result["projects_score"],
        missing_skills=match_result["missing_skills"],
        recommendations=match_result["recommendations"],
        status="Applied"
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.get("/applications/my", response_model=List[ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    # Join with Resume to filter by candidate ID
    apps = db.query(Application).join(Resume).filter(Resume.candidate_id == current_user.id).order_by(Application.created_at.desc()).all()
    return apps

@router.get("/applications/job/{job_id}", response_model=List[ApplicationResponse])
def get_applicants_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    # Verify recruiter owns the job
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or unauthorized access"
        )
    
    # Return applications ranked by overall score descending
    apps = db.query(Application).filter(Application.job_id == job_id).order_by(Application.overall_score.desc()).all()
    return apps

@router.patch("/applications/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(
    app_id: int,
    status_update: ApplicationUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    # Verify the application belongs to a job created by this recruiter
    app = db.query(Application).join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or unauthorized to update"
        )
        
    app.status = status_update.status
    db.commit()
    db.refresh(app)
    return app

# --- Dashboards ---

@router.get("/dashboard/candidate", response_model=CandidateDashboardData)
def get_candidate_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    resume = db.query(Resume).filter(Resume.candidate_id == current_user.id).first()
    apps = []
    if resume:
        apps = db.query(Application).filter(Application.resume_id == resume.id).order_by(Application.created_at.desc()).all()
        
    return {
        "resume": resume,
        "applications": apps
    }

@router.get("/dashboard/recruiter", response_model=RecruiterDashboardData)
def get_recruiter_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    # Recruiter's jobs
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
    job_ids = [job.id for job in jobs]
    
    # Calculate stats
    total_jobs = len(jobs)
    total_candidates = db.query(Application).filter(Application.job_id.in_(job_ids)).count() if job_ids else 0
    shortlisted_candidates = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.status == "Shortlisted"
    ).count() if job_ids else 0
    
    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "shortlisted_candidates": shortlisted_candidates,
        "jobs": jobs
    }
