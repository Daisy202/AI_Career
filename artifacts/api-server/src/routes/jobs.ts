import { Router, type IRouter } from "express";
import {
  GetCareerInsightsQueryParams,
  GetCareerInsightsResponse,
  GetJobsQueryParams,
  GetJobsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MOCK_JOBS: Record<string, Array<{ title: string; company: string; location: string; salary: string | null; description: string | null }>> = {
  "Software Developer": [
    { title: "Junior Software Developer", company: "Cassava Smartech", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Build fintech mobile and web applications" },
    { title: "Full Stack Developer", company: "Econet Wireless", location: "Harare, Zimbabwe", salary: "USD 1,200/month", description: "Develop internal systems and customer-facing apps" },
    { title: "Frontend Developer", company: "Steward Bank", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Build banking web portals" },
    { title: "Software Engineer", company: "TelOne", location: "Harare, Zimbabwe", salary: "USD 1,000/month", description: "Develop telecommunications software" },
    { title: "Mobile Developer", company: "Local Startup", location: "Bulawayo, Zimbabwe", salary: "USD 700/month", description: "Build Android and iOS applications" },
  ],
  "Data Analyst": [
    { title: "Data Analyst", company: "ZB Financial Holdings", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Analyse banking data and create reports" },
    { title: "Business Intelligence Analyst", company: "OK Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Create dashboards for sales insights" },
    { title: "Junior Data Scientist", company: "Cassava Smartech", location: "Harare, Zimbabwe", salary: "USD 1,000/month", description: "Build predictive models for fintech" },
  ],
  "Accountant": [
    { title: "Graduate Accountant", company: "Deloitte Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 600/month", description: "Audit and financial reporting" },
    { title: "Accounts Clerk", company: "Delta Beverages", location: "Harare, Zimbabwe", salary: "USD 500/month", description: "Manage accounts payable and receivable" },
    { title: "Finance Officer", company: "World Vision Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 700/month", description: "NGO financial management" },
    { title: "Tax Consultant", company: "PwC Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Tax advisory and compliance" },
  ],
  "Civil Engineer": [
    { title: "Graduate Civil Engineer", company: "Zimbabwean National Roads Administration", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Road construction and maintenance" },
    { title: "Site Engineer", company: "Chadcombe Construction", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Oversee building construction projects" },
    { title: "Water Engineer", company: "Zimbabwe National Water Authority", location: "Harare, Zimbabwe", salary: "USD 850/month", description: "Water supply infrastructure development" },
  ],
  "Teacher": [
    { title: "Secondary School Teacher (Science)", company: "St. George's College", location: "Harare, Zimbabwe", salary: "USD 400/month", description: "Teach A-Level sciences" },
    { title: "Mathematics Teacher", company: "Harare High School", location: "Harare, Zimbabwe", salary: "USD 350/month", description: "Teach O and A Level Mathematics" },
  ],
  "Medical Doctor": [
    { title: "Medical Officer", company: "Parirenyatwa Group of Hospitals", location: "Harare, Zimbabwe", salary: "USD 1,500/month", description: "General medical practice in public hospital" },
    { title: "Junior Doctor", company: "Avenues Clinic", location: "Harare, Zimbabwe", salary: "USD 2,000/month", description: "Private hospital practice" },
    { title: "GP", company: "Private Practice", location: "Bulawayo, Zimbabwe", salary: "USD 2,500/month", description: "General practice physician" },
  ],
};

const MOCK_SKILLS: Record<string, string[]> = {
  "Software Developer": ["JavaScript", "Python", "React", "Node.js", "Problem Solving", "Git", "TypeScript"],
  "Data Analyst": ["SQL", "Excel", "Python", "Power BI", "Statistics", "Communication", "Tableau"],
  "Accountant": ["IFRS", "ACCA", "Excel", "Sage", "Pastel", "Communication", "Attention to Detail"],
  "Civil Engineer": ["AutoCAD", "Structural Analysis", "Project Management", "Site Supervision", "Surveying"],
  "Teacher": ["Curriculum Planning", "Classroom Management", "Communication", "Patience", "Subject Expertise"],
  "Medical Doctor": ["Clinical Skills", "Diagnosis", "Patient Care", "Pharmacology", "Communication", "Empathy"],
};

router.get("/insights", async (req, res): Promise<void> => {
  const params = GetCareerInsightsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Career query param required" });
    return;
  }

  const careerName = params.data.career;
  const jobs = findJobsForCareer(careerName);
  const skills = findSkillsForCareer(careerName);

  let demandLevel: "High" | "Medium" | "Low";
  if (jobs.length >= 4) demandLevel = "High";
  else if (jobs.length >= 2) demandLevel = "Medium";
  else demandLevel = "Low";

  res.json(
    GetCareerInsightsResponse.parse({
      career: careerName,
      demandLevel,
      jobCount: jobs.length,
      topSkills: skills,
      averageSalary: jobs[0]?.salary ?? null,
    })
  );
});

router.get("/jobs", async (req, res): Promise<void> => {
  const params = GetJobsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Query param required" });
    return;
  }

  const jobs = findJobsForCareer(params.data.query);
  res.json(GetJobsResponse.parse(jobs));
});

function findJobsForCareer(careerName: string) {
  const lower = careerName.toLowerCase();
  for (const [key, jobs] of Object.entries(MOCK_JOBS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase().split(" ")[0])) {
      return jobs;
    }
  }
  return [
    {
      title: `${careerName} Professional`,
      company: "Various Organisations",
      location: "Zimbabwe",
      salary: "Negotiable",
      description: `Opportunities available for qualified ${careerName} professionals`,
    },
  ];
}

function findSkillsForCareer(careerName: string): string[] {
  const lower = careerName.toLowerCase();
  for (const [key, skills] of Object.entries(MOCK_SKILLS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase().split(" ")[0])) {
      return skills;
    }
  }
  return ["Communication", "Problem Solving", "Teamwork", "Analytical Thinking", "Leadership"];
}

export default router;
