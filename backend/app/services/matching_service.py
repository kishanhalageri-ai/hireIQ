from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class MatchingService:
    def __init__(self):
        # Initialized with the pre-cached model
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Error loading SentenceTransformer: {e}")
            self.model = None

    def calculate_match(self, resume_data: Dict[str, Any], raw_resume_text: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates match scores according to the user-defined weights:
        Score = 50% Skill Match + 20% Experience + 15% Education + 15% Projects
        """
        # 1. Skill Match Score (50%)
        skill_score, missing_skills = self._calculate_skill_score(
            resume_data.get("skills", []), 
            job_data.get("required_skills", []),
            raw_resume_text,
            job_data.get("description", "")
        )

        # 2. Experience Score (20%)
        exp_score = self._calculate_experience_score(
            resume_data.get("experience", []), 
            raw_resume_text,
            job_data.get("min_experience", 0)
        )

        # 3. Education Score (15%)
        edu_score = self._calculate_education_score(
            resume_data.get("education", []), 
            job_data.get("min_education", "")
        )

        # 4. Projects Score (15%)
        proj_score = self._calculate_projects_score(
            resume_data.get("projects", []), 
            job_data.get("description", "")
        )

        # Calculate weighted overall score
        overall_score = (
            (0.50 * skill_score) + 
            (0.20 * exp_score) + 
            (0.15 * edu_score) + 
            (0.15 * proj_score)
        )
        
        # Round scores to 2 decimal places
        overall_score = round(overall_score, 2)
        skill_score = round(skill_score, 2)
        exp_score = round(exp_score, 2)
        edu_score = round(edu_score, 2)
        proj_score = round(proj_score, 2)

        # Generate recommendations and learning roadmap
        recommendations = self._generate_recommendations(missing_skills, job_data.get("title", ""))

        return {
            "overall_score": overall_score,
            "skill_match_score": skill_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "projects_score": proj_score,
            "missing_skills": missing_skills,
            "recommendations": recommendations
        }

    def _calculate_skill_score(self, candidate_skills: List[str], required_skills: List[str], raw_resume: str, job_desc: str) -> tuple:
        """
        Combines semantic similarity between resume and job description (50%)
        with direct required skill coverage overlap (50%).
        """
        if not required_skills:
            return 100.0, []

        # Find direct matches
        cand_skills_set = set(s.lower() for s in candidate_skills)
        req_skills_set = set(s.lower() for s in required_skills)
        
        direct_matches = cand_skills_set.intersection(req_skills_set)
        missing_skills = list(req_skills_set - cand_skills_set)
        
        direct_match_ratio = len(direct_matches) / len(required_skills)
        direct_score = direct_match_ratio * 100.0

        # Semantic similarity of skills/text using sentence transformer
        semantic_score = 0.0
        if self.model and raw_resume and job_desc:
            try:
                # Embed resume text and job description
                embeddings = self.model.encode([raw_resume, job_desc])
                # Calculate cosine similarity
                similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                # Scale similarity (usually sits in 0.2 - 0.8 range for job text)
                semantic_score = float(np.clip((similarity - 0.1) / 0.7 * 100.0, 0.0, 100.0))
            except Exception as e:
                print(f"Error computing semantic skill score: {e}")
                semantic_score = direct_score
        else:
            semantic_score = direct_score

        # Combine: 50% direct skills, 50% overall semantic match
        combined_skill_score = (0.5 * direct_score) + (0.5 * semantic_score)
        return combined_skill_score, sorted(list(missing_skills))

    def _calculate_experience_score(self, experience_list: List[Dict[str, Any]], raw_resume: str, min_experience: int) -> float:
        """
        Computes experience score. If candidate meets/exceeds, they get 100%.
        Otherwise, they get a proportional score.
        """
        if min_experience <= 0:
            return 100.0

        # Estimate candidate years of experience
        from app.services.parser_service import ResumeParserService
        candidate_years = ResumeParserService.calculate_years_of_experience(experience_list, raw_resume)

        if candidate_years >= min_experience:
            return 100.0
        
        return (candidate_years / min_experience) * 100.0

    def _calculate_education_score(self, education_list: List[Dict[str, Any]], min_education: str) -> float:
        """
        Computes education level fit.
        Levels: PHD (3), MASTER (2), BACHELOR (1), NONE (0)
        """
        if not min_education:
            return 100.0

        edu_levels = {"phd": 3, "master": 2, "bachelor": 1, "": 0}
        
        # Get minimum level required
        req_level_str = min_education.lower()
        req_level = 0
        for key, val in edu_levels.items():
            if key in req_level_str:
                req_level = val
                break
        
        if req_level == 0:
            return 100.0

        # Find candidate's highest level
        cand_highest_level = 0
        for edu in education_list:
            level_str = edu.get("level", "").lower()
            for key, val in edu_levels.items():
                if key in level_str:
                    cand_highest_level = max(cand_highest_level, val)

        if cand_highest_level >= req_level:
            return 100.0
        elif cand_highest_level == 0:
            return 0.0
        else:
            # Proportional score for partial qualification (e.g., candidate has Bachelor, job wants Master)
            return (cand_highest_level / req_level) * 100.0

    def _calculate_projects_score(self, projects: List[Dict[str, Any]], job_desc: str) -> float:
        """
        Embeds project descriptions and compares them to the job description
        to assess domain alignment.
        """
        if not projects:
            return 0.0

        if not self.model or not job_desc:
            return 100.0

        project_texts = []
        for proj in projects:
            text = f"{proj.get('title', '')} {proj.get('description', '')}".strip()
            if text:
                project_texts.append(text)

        if not project_texts:
            return 0.0

        try:
            # Combine all project texts or find the best matching project
            project_embeddings = self.model.encode(project_texts)
            job_embedding = self.model.encode([job_desc])
            
            # Find similarity for each project and take the average or maximum
            similarities = cosine_similarity(project_embeddings, job_embedding)
            max_sim = float(np.max(similarities))
            
            # Map similarity to 0-100 range
            proj_score = float(np.clip((max_sim - 0.1) / 0.6 * 100.0, 0.0, 100.0))
            return proj_score
        except Exception as e:
            print(f"Error calculating projects score: {e}")
            return 50.0

    def _generate_recommendations(self, missing_skills: List[str], job_title: str) -> Dict[str, Any]:
        """
        Creates roadmap steps and suggestions for missing skills.
        """
        if not missing_skills:
            return {
                "summary": f"Outstanding fit! You possess all the specified core skills required for the {job_title} role.",
                "roadmap": ["Review the job description details for any soft-skill nuances.", "Prepare for technical interviews focusing on system design and domain architecture."]
            }

        roadmap = []
        for idx, skill in enumerate(missing_skills[:5], 1):
            roadmap.append(f"Step {idx}: Learn and master '{skill.upper()}' by completing certified courses (e.g., Coursera, Udemy) and building a hands-on project.")
        
        roadmap.append(f"Step {len(roadmap) + 1}: Build a portfolio project that integrates your new skills and deploy it to GitHub.")
        roadmap.append(f"Step {len(roadmap) + 1}: Update your resume to include your new projects and highlight technical capabilities.")

        return {
            "summary": f"To optimize your profile for the {job_title} role, we recommend bridging the gap in {len(missing_skills)} key skills.",
            "roadmap": roadmap
        }
