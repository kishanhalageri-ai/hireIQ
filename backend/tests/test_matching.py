import pytest
from app.services.matching_service import MatchingService

def test_experience_scoring():
    matcher = MatchingService()
    # If job wants 5 years, and candidate has 2.5
    exp_score = matcher._calculate_experience_score(
        experience_list=[], 
        raw_resume="2.5 years of experience", 
        min_experience=5
    )
    assert exp_score == 50.0

    # If candidate exceeds min experience
    exp_score_exceeds = matcher._calculate_experience_score(
        experience_list=[], 
        raw_resume="8 years of experience", 
        min_experience=5
    )
    assert exp_score_exceeds == 100.0

def test_education_scoring():
    matcher = MatchingService()
    # Candidate level: Bachelor (1), job wants Master (2)
    score_partial = matcher._calculate_education_score(
        education_list=[{"degree": "Bachelor of Science", "level": "bachelor", "year": "2020"}],
        min_education="Master"
    )
    assert score_partial == 50.0

    # Candidate has Master (2), job wants Bachelor (1)
    score_meets = matcher._calculate_education_score(
        education_list=[{"degree": "Master of Science", "level": "master", "year": "2022"}],
        min_education="Bachelor"
    )
    assert score_meets == 100.0

def test_generate_recommendations():
    matcher = MatchingService()
    recs = matcher._generate_recommendations(["docker", "kubernetes"], "DevOps Engineer")
    
    assert "docker" in recs["summary"]
    assert len(recs["roadmap"]) > 0
