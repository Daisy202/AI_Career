import { Router, type IRouter } from "express";
import {
  GetCareerInsightsQueryParams,
  GetCareerInsightsResponse,
  GetJobsQueryParams,
  GetJobsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

const MOCK_JOBS: Record<string, Array<{ title: string; company: string; location: string; salary: string | null; description: string | null; url: string | null }>> = {
  "Software Developer": [
    { title: "Junior Software Developer", company: "Cassava Smartech", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Build fintech mobile and web applications using modern frameworks", url: "https://www.linkedin.com/jobs/search/?keywords=software+developer+zimbabwe" },
    { title: "Full Stack Developer", company: "Econet Wireless", location: "Harare, Zimbabwe", salary: "USD 1,200/month", description: "Develop internal systems and customer-facing applications for Africa's leading telecoms company", url: "https://www.linkedin.com/jobs/search/?keywords=full+stack+developer+zimbabwe" },
    { title: "Frontend Developer", company: "Steward Bank", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Build banking web portals and mobile-responsive interfaces", url: "https://www.careers24.com/jobs/in-zimbabwe/software-developer" },
    { title: "Software Engineer", company: "TelOne", location: "Harare, Zimbabwe", salary: "USD 1,000/month", description: "Develop telecommunications software and internal tools", url: "https://www.mygjobsportal.com/jobs?q=software+developer&l=zimbabwe" },
    { title: "Mobile Developer (Android/iOS)", company: "Local Fintech Startup", location: "Harare, Zimbabwe", salary: "USD 700/month", description: "Build mobile payment and banking applications", url: "https://www.cvlibrary.co.uk/jobs/it-internet/zimbabwe" },
  ],
  "Data Analyst": [
    { title: "Data Analyst", company: "ZB Financial Holdings", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Analyse banking data, create dashboards and financial reports", url: "https://www.linkedin.com/jobs/search/?keywords=data+analyst+zimbabwe" },
    { title: "Business Intelligence Analyst", company: "OK Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Create BI dashboards for retail sales insights and forecasting", url: "https://www.careers24.com/jobs/in-zimbabwe/data-analyst" },
    { title: "Junior Data Scientist", company: "Cassava Smartech", location: "Harare, Zimbabwe", salary: "USD 1,000/month", description: "Build predictive models for fraud detection and customer analytics", url: "https://www.mygjobsportal.com/jobs?q=data+analyst&l=zimbabwe" },
  ],
  "Accountant": [
    { title: "Graduate Accountant", company: "Deloitte Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 600/month", description: "External audit, financial reporting under IFRS standards", url: "https://www2.deloitte.com/zw/en/careers.html" },
    { title: "Accounts Clerk", company: "Delta Beverages", location: "Harare, Zimbabwe", salary: "USD 500/month", description: "Manage accounts payable, receivable and monthly reconciliations", url: "https://www.linkedin.com/jobs/search/?keywords=accountant+zimbabwe" },
    { title: "Finance Officer", company: "World Vision Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 700/month", description: "Manage NGO financial operations and donor reporting", url: "https://www.worldvision.org/about-us/careers" },
    { title: "Tax Consultant", company: "PwC Zimbabwe", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Tax advisory and compliance services for corporate clients", url: "https://www.pwc.com/gx/en/careers/experienced-opportunities.html" },
  ],
  "Civil Engineer": [
    { title: "Graduate Civil Engineer", company: "Zimbabwe National Road Administration", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Road construction, design and maintenance projects across Zimbabwe", url: "https://www.zinara.co.zw/careers" },
    { title: "Site Engineer", company: "Chadcombe Construction", location: "Harare, Zimbabwe", salary: "USD 800/month", description: "Oversee residential and commercial building construction projects", url: "https://www.linkedin.com/jobs/search/?keywords=civil+engineer+zimbabwe" },
    { title: "Water & Sanitation Engineer", company: "ZINWA", location: "Harare, Zimbabwe", salary: "USD 850/month", description: "Water supply infrastructure development and maintenance", url: "https://www.zinwa.co.zw/careers" },
  ],
  "Teacher": [
    { title: "Secondary School Teacher (Science)", company: "St. George's College", location: "Harare, Zimbabwe", salary: "USD 400/month", description: "Teach A-Level Biology, Chemistry and Physics", url: "https://www.zimsec.co.zw" },
    { title: "Mathematics Teacher", company: "Harare High School", location: "Harare, Zimbabwe", salary: "USD 350/month", description: "Teach O-Level and A-Level Mathematics", url: "https://www.linkedin.com/jobs/search/?keywords=teacher+zimbabwe" },
  ],
  "Medical Doctor": [
    { title: "Medical Officer", company: "Parirenyatwa Group of Hospitals", location: "Harare, Zimbabwe", salary: "USD 1,500/month", description: "General medical practice in Zimbabwe's largest public hospital", url: "https://www.mohcc.gov.zw/careers" },
    { title: "Junior Doctor", company: "Avenues Clinic", location: "Harare, Zimbabwe", salary: "USD 2,000/month", description: "Clinical practice in private hospital setting", url: "https://www.linkedin.com/jobs/search/?keywords=doctor+zimbabwe" },
    { title: "General Practitioner", company: "Private Clinic", location: "Bulawayo, Zimbabwe", salary: "USD 2,500/month", description: "Run a general practice clinic serving community patients", url: "https://www.linkedin.com/jobs/search/?keywords=general+practitioner+zimbabwe" },
  ],
  "Nurse": [
    { title: "Registered Nurse", company: "Chitungwiza Hospital", location: "Chitungwiza, Zimbabwe", salary: "USD 400/month", description: "Patient care in busy public hospital ward", url: "https://www.mohcc.gov.zw/careers" },
    { title: "ICU Nurse", company: "Avenues Clinic", location: "Harare, Zimbabwe", salary: "USD 700/month", description: "Intensive care nursing in private hospital", url: "https://www.linkedin.com/jobs/search/?keywords=nurse+zimbabwe" },
  ],
  "Electrical Engineer": [
    { title: "Electrical Engineer", company: "ZESA Holdings", location: "Harare, Zimbabwe", salary: "USD 1,000/month", description: "Power generation and distribution infrastructure maintenance", url: "https://www.zesa.co.zw/careers" },
    { title: "Junior Electrical Engineer", company: "Econet Wireless", location: "Harare, Zimbabwe", salary: "USD 900/month", description: "Telecommunications network infrastructure and maintenance", url: "https://www.linkedin.com/jobs/search/?keywords=electrical+engineer+zimbabwe" },
  ],
};

const MOCK_SKILLS: Record<string, string[]> = {
  "Software Developer": ["JavaScript", "Python", "React", "Node.js", "Problem Solving", "Git", "TypeScript"],
  "Data Analyst": ["SQL", "Excel", "Python", "Power BI", "Statistics", "Communication", "Tableau"],
  "Accountant": ["IFRS", "ACCA", "Excel", "Sage", "Pastel", "Communication", "Attention to Detail"],
  "Civil Engineer": ["AutoCAD", "Structural Analysis", "Project Management", "Site Supervision", "Surveying"],
  "Teacher": ["Curriculum Planning", "Classroom Management", "Communication", "Patience", "Subject Expertise"],
  "Medical Doctor": ["Clinical Skills", "Diagnosis", "Patient Care", "Pharmacology", "Communication", "Empathy"],
  "Nurse": ["Patient Care", "Wound Dressing", "Medication Administration", "Vital Signs", "Empathy"],
  "Electrical Engineer": ["Circuit Design", "AutoCAD Electrical", "Power Systems", "PLC Programming", "Safety Standards"],
};

router.get("/insights", requireAuth, async (req, res): Promise<void> => {
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

router.get("/jobs", requireAuth, async (req, res): Promise<void> => {
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
      description: `Opportunities for qualified ${careerName} professionals in Zimbabwe`,
      url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(careerName)}+zimbabwe`,
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
