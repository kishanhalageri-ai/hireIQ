import pytest
from app.services.parser_service import ResumeParserService

def test_extract_skills():
    parser = ResumeParserService()
    mock_text = "I am a developer with experience in Python, Javascript, React, Docker and AWS."
    skills = parser._extract_skills(mock_text)
    
    assert "python" in skills
    assert "javascript" in skills
    assert "react" in skills
    assert "docker" in skills
    assert "aws" in skills
    assert "java" not in skills

def test_extract_email_and_phone():
    parser = ResumeParserService()
    mock_text = "Jane Doe\nEmail: jane.doe@example.com\nPhone: (123) 456-7890\nSkills: Python"
    
    parsed = parser.parse_resume(mock_text, "jane_resume.pdf")
    
    assert parsed["email"] == "jane.doe@example.com"
    assert parsed["phone"] == "(123) 456-7890"

def test_calculate_years_of_experience():
    mock_text = "I have 5 years of experience working as a Software Engineer."
    # Using the static helper
    years = ResumeParserService.calculate_years_of_experience([], mock_text)
    assert years == 5.0
