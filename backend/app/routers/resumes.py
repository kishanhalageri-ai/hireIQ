import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Resume, User
from app.schemas import ResumeResponse
from app.auth import get_current_user, require_candidate
from app.services.parser_service import ResumeParserService

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])
parser_service = ResumeParserService()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    # Validate file extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or DOCX file."
        )

    # Read file content
    file_bytes = await file.read()
    
    # Extract text based on file format
    if ext == ".pdf":
        raw_text = parser_service.extract_text_from_pdf(file_bytes)
    else:  # .docx
        raw_text = parser_service.extract_text_from_docx(file_bytes)

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to extract text from the uploaded file. Ensure it is not empty or scanned/image-only."
        )

    # Parse details
    parsed_data = parser_service.parse_resume(raw_text, filename)

    # Save file locally
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{filename}")
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file on disk: {str(e)}"
        )

    # Check if candidate already has a resume
    existing_resume = db.query(Resume).filter(Resume.candidate_id == current_user.id).first()
    
    if existing_resume:
        # Update existing
        existing_resume.filename = filename
        existing_resume.file_path = file_path
        existing_resume.raw_text = raw_text
        existing_resume.parsed_name = parsed_data["name"]
        existing_resume.parsed_email = parsed_data["email"]
        existing_resume.parsed_phone = parsed_data["phone"]
        existing_resume.parsed_skills = parsed_data["skills"]
        existing_resume.parsed_education = parsed_data["education"]
        existing_resume.parsed_experience = parsed_data["experience"]
        existing_resume.parsed_projects = parsed_data["projects"]
        existing_resume.parsed_certifications = parsed_data["certifications"]
        db.commit()
        db.refresh(existing_resume)
        return existing_resume
    else:
        # Create new
        db_resume = Resume(
            candidate_id=current_user.id,
            filename=filename,
            file_path=file_path,
            raw_text=raw_text,
            parsed_name=parsed_data["name"],
            parsed_email=parsed_data["email"],
            parsed_phone=parsed_data["phone"],
            parsed_skills=parsed_data["skills"],
            parsed_education=parsed_data["education"],
            parsed_experience=parsed_data["experience"],
            parsed_projects=parsed_data["projects"],
            parsed_certifications=parsed_data["certifications"]
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        return db_resume

@router.get("/my", response_model=ResumeResponse)
def get_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    resume = db.query(Resume).filter(Resume.candidate_id == current_user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't uploaded a resume yet"
        )
    return resume
