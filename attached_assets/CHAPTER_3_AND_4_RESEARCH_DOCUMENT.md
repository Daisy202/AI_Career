# CHAPTER 3: RESEARCH METHODOLOGY

## 3.1 Research Design and Data Collection Approaches

This study adopts a **design science research** approach combined with **mixed methods** to develop and evaluate an AI-driven framework for personalized career and academic guidance for pre-university students in Zimbabwe. Design science is appropriate because the primary objective is to design, build, and evaluate an artefact—the CareerGuide ZW web application—that addresses the problem of inadequate career guidance in the Zimbabwean education system.

The research design integrates:

1. **Design and Development**: Construction of a full-stack web application comprising a React frontend, Express backend, SQLite database, and a hybrid AI recommendation system.
2. **Quantitative Data Collection**: Structured questionnaires (career assessment, feedback forms), system usage logs, and analytics on recommendation acceptance and user engagement.
3. **Qualitative Data Collection**: Open-ended feedback comments, chat session transcripts with the AI advisor, and optional interviews with career guidance counsellors and students.

**Data collection approaches** include:
- **Primary data**: Student responses from the multi-step career assessment questionnaire, feedback ratings and comments, and chat interactions with the AI career advisor.
- **Secondary data**: Career datasets (12 careers across 9 categories), university program databases (e.g., TelOne Centre for Learning, Zimbabwean universities), and job market outlook data.
- **System-generated data**: Prediction logs (inputs, recommendations, AI advice), user activity logs, and chat session histories stored in the database.

---

## 3.2 Population and Sample

**Target population**: Pre-university students in Zimbabwe (Form 4 and Form 6 level), aged approximately 16–20 years, who are making or have made subject and career choices. The population may be extended to include career guidance counsellors and teachers for validation purposes.

**Sampling method**: Purposive and convenience sampling. Participants will be recruited from secondary schools and colleges in Zimbabwe that have agreed to participate. Students with internet access and willingness to complete the assessment will be included.

**Sample size**: A minimum of 50–100 students is targeted for meaningful quantitative analysis. For qualitative components (interviews, focus groups), 10–15 participants may be sufficient.

**Inclusion criteria**:
- Pre-university students (Form 4 or Form 6) or recent school leavers
- Access to internet and a web browser
- Informed consent to participate
- Ability to complete the assessment in English

**Exclusion criteria**:
- Students below Form 4
- Participants who do not provide consent
- Incomplete or invalid assessment submissions

---

## 3.3 Research Instruments

The following research instruments were designed and implemented:

1. **Career Assessment Questionnaire (Multi-step Form)**
   - **Step 1**: Interests (8 options: Technology & Software, Healthcare & Medicine, Business & Finance, Arts & Entertainment, Engineering & Architecture, Law & Public Policy, Agriculture & Environment, Education & Training)
   - **Step 2**: Strengths (8 options: Problem Solving, Creativity, Leadership, Communication, Analytical Thinking, Teamwork, Adaptability, Attention to Detail)
   - **Step 3**: O-Level subjects (10 options including English Language, Mathematics, Biology, Chemistry, Physics, etc.)
   - **Step 4**: A-Level subjects (14 options), optional cut-off points (ZIMSEC, 0–20)
   - **Step 5**: Personality type (Holland’s RIASEC: Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
   - **Step 6**: Hobbies and extracurricular activities (free text)
   - **Step 7**: Academic performance (O-Level passes, A-Level passes, cut-off points)

2. **Feedback Form**
   - Rating scale (e.g., 1–5)
   - Helpful/not helpful indicator
   - Optional comment (free text)
   - Career name (for context)

3. **AI Chat Interface**
   - Conversational interface for career-related questions
   - Context-aware responses using student profile (interests, strengths, subjects, personality)
   - Session persistence for logged-in users

4. **System Logging**
   - Prediction logs: user inputs, career recommendations, match percentages, AI-generated advice, model version
   - User activity logs: assessment completion, profile updates, recommendation views
   - Chat session storage: user messages and AI responses

5. **Usability Instrument (Optional)**
   - System Usability Scale (SUS) or adapted version for post-use evaluation

---

## 3.4 Data Analysis Procedures

**Quantitative data** will be analysed using:
- **Descriptive statistics**: Mean, standard deviation, frequencies, and percentages for assessment responses, feedback ratings, and match percentages.
- **Inferential statistics**: t-tests or ANOVA to compare pre- and post-assessment career clarity (if applicable); correlation analysis between profile variables and recommendation acceptance.
- **Tools**: SPSS, Microsoft Excel, or R.

**Qualitative data** will be analysed using:
- **Thematic analysis**: Coding of open-ended feedback and interview transcripts to identify themes (e.g., usefulness, relevance, suggestions for improvement).
- **Content analysis**: Categorisation of chat topics and common questions.

**System data** will be analysed using:
- **Usage analytics**: Completion rates, session duration, number of recommendations viewed, feedback submission rate.
- **Recommendation analytics**: Distribution of match percentages, qualifying program counts, AI advice generation success rate.

**Validation**: The hybrid AI recommendation engine outputs will be cross-referenced with expert-verified university program data to ensure accuracy of subject requirements and eligibility.

---

---

# CHAPTER 4: DATA PRESENTATION, ANALYSIS AND INTERPRETATION

## 4.1 Introduction

This chapter presents the system architecture, implementation details, and the hybrid AI recommendation framework developed for the CareerGuide ZW platform. It describes how data is collected, processed, and presented to users, and provides a basis for interpreting evaluation results once user testing is conducted. The chapter aligns with the research objectives of designing an AI-driven framework for personalized career and academic guidance for pre-university students in Zimbabwe.

---

## 4.2 Analysis and Interpretation of Results

### 4.2.1 System Architecture and Technology Stack

The CareerGuide ZW system is built as a monorepo using pnpm workspaces. The technology stack is summarised in Table 4.1.

**Table 4.1: Technology Stack**

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React 18, TypeScript 5.9, Vite, Zustand (state management), React Hook Form, Zod (validation), Framer Motion (animations), Recharts (charts), Radix UI, Tailwind CSS |
| **Backend** | Node.js 24, Express 5, TypeScript |
| **Database** | SQLite, Drizzle ORM |
| **AI/LLM** | Ollama (local deployment), Gemma 3:1b or Llama 3.2 |
| **API** | OpenAPI 3.1 specification, Orval (code generation), Zod validation |
| **Authentication** | Express session, bcryptjs |

### 4.2.2 Hybrid AI Recommendation System

The system employs a **hybrid approach** combining:

1. **Rule-based recommendation engine** (deterministic, transparent)
2. **Large Language Model (LLM)** for personalised advice and conversational support
3. **Database-driven program matching** for Zimbabwean universities and colleges

#### Rule-Based Career Matching

The rule-based engine (`careerData.ts`) scores careers against the student profile using:

- **Interest–category mapping**: Interests (e.g., Technology & Software) are mapped to career categories (e.g., Technology, Business & Finance) with weighted scoring (up to 30 points).
- **Subject matching**: A-Level and O-Level subjects are matched against career requirements. Subject aliases (e.g., Maths/Mathematics, Accounts/Accounting) ensure robust matching.
- **Holland’s RIASEC model**: Personality types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) are mapped to career categories (e.g., Investigative → Technology, Healthcare, Social Sciences).
- **Best-fit logic**: Students with ≥2 A-Level subjects and ≥5 O-Level passes receive a bonus. O-Level-only students are prioritised for diploma programs (e.g., Technology, Business & Finance) that do not require A-Level.
- **Demand level**: Derived from job outlook (Excellent/Very High/High → High demand; Moderate/Stable/Good → Medium; else Low).

The engine returns up to six careers with match percentages (0–99%), match reasons, and demand levels.

#### LLM Component (Ollama)

The LLM is used in two ways:

1. **Personalised career advice** (`aiAdvice.ts`): A prompt is constructed with the student profile, top career fits, and a list of programs from the database. The LLM generates short, actionable advice (4–5 sentences). The output is cross-referenced with the database so only verified programs are highlighted. Parameters: temperature 0.6, max tokens 200.

2. **Chat advisor** (`ollama.ts`): A system prompt constrains the LLM to career and study guidance in Zimbabwe. The model receives the student profile as context and responds to questions about careers, universities, O-Level/A-Level requirements, and the Zimbabwean education system. Out-of-scope queries receive a standard redirect message. Parameters: temperature 0.7, max tokens 120.

**Model deployment**: Ollama runs locally; no fine-tuning is applied. The models (Gemma 3:1b or Llama 3.2) are used as pre-trained models with prompt engineering. Fine-tuning could be explored in future work using Zimbabwe-specific career and program data.

#### University Program Matching

Programs are stored in the `university_programs` table with:
- Required A-Level subjects, minimum required subject count
- Required O-Level subjects (e.g., English Language, Mathematics, Science)
- Minimum O-Level and A-Level passes
- Minimum cut-off points (where applicable)
- Program type (degree or diploma)

For each recommended career, programs are filtered by career category. Each program is evaluated for:
- Subject eligibility (A-Level and O-Level)
- Pass count eligibility
- Cut-off points (for chance analysis: high/equal/low)

Qualifying programs are prioritised; diploma programs are surfaced for O-Level-only students. AI-recommended programs (from the LLM advice) are displayed first.

### 4.2.3 Career and Program Dataset

**Career dataset**: 12 careers across 9 categories:
- Technology: Software Developer, Data Analyst
- Business & Finance: Accountant
- Engineering: Civil Engineer, Electrical Engineer
- Education: Secondary School Teacher
- Healthcare: Medical Doctor, Nurse
- Law: Lawyer
- Agriculture: Agricultural Scientist
- Media & Communication: Journalist / Media Professional
- Social Sciences: Psychologist

Each career includes: description, required skills, A-Level subjects, university programs, average salary, job outlook, and keywords for matching.

**Program dataset**: University and college programs (e.g., TelOne Centre for Learning) including degrees and HEXCO-certified diplomas. Example programs: Diploma in Software Engineering, Diploma in Digital Marketing, Bachelor of Engineering Honours Degree Telecommunications Engineering.

### 4.2.4 Data Flow and User Journey

1. **Assessment**: User completes the 7-step questionnaire. Data is validated with Zod and stored in the Zustand store (and in `student_profiles` for logged-in users).
2. **Recommendation request**: Frontend sends profile to `POST /api/recommend`. Backend runs the rule-based engine, fetches programs from the database, matches programs to careers, and calls the LLM for advice.
3. **Response**: Recommendations (careers, match percentages, matched programs, AI advice) are returned. Predictions are logged to `AICareer.logs`.
4. **Chat**: User can ask follow-up questions via `POST /api/chat`. Messages are stored in `chat_sessions` and `chat_messages` for logged-in users.
5. **Feedback**: User can rate and comment via `POST /api/feedback`. Data is stored in the `feedback` table.

### 4.2.5 Logging and Observability

The system logs:
- **Predictions**: User inputs, career recommendations, match reasons, qualifying programs, AI advice, model version (e.g., `rule-based-v1`).
- **User activity**: Assessment completion, profile updates, recommendation views.
- **Errors**: API failures, Ollama connection issues.
- **Admin actions**: Program creation, updates, bulk uploads.

Logs are written to `data/logs/AICareer.logs` in JSON format for analysis and debugging.

### 4.2.6 Interpretation

The hybrid design addresses several requirements:

- **Transparency**: Rule-based scoring provides explainable match reasons (e.g., subject fit, interest alignment, diploma path).
- **Personalisation**: The LLM adds contextual, natural-language advice tailored to the student’s profile and available programs.
- **Accuracy**: Program recommendations are grounded in the database; the LLM output is cross-referenced to avoid hallucinated programs.
- **Inclusivity**: O-Level-only students receive diploma options; A-Level students see both degree and diploma paths where applicable.

Once user testing is completed, data from feedback, logs, and chat sessions can be analysed to evaluate usability, recommendation relevance, and user satisfaction.

---

## 4.3 Summary of Research Findings

1. **System implementation**: A full-stack AI-driven career guidance platform (CareerGuide ZW) has been developed using React, Express, SQLite, and Ollama. The system supports assessment, recommendations, program matching, AI advice, chat, and feedback.

2. **Hybrid AI framework**: The recommendation system combines a rule-based engine (keyword matching, Holland’s RIASEC, subject and pass requirements) with an LLM (Ollama, Gemma 3:1b or Llama 3.2) for personalised advice and conversational support. No fine-tuning is used; the LLM is applied via prompt engineering.

3. **Program matching**: University and college programs are matched to careers using required subjects, pass counts, and cut-off points. Diploma programs are prioritised for O-Level-only students.

4. **Data collection**: The system captures assessment responses, recommendation outputs, AI advice, chat transcripts, and feedback. Logging supports evaluation and future refinement.

5. **Zimbabwean context**: The system is tailored to the Zimbabwean education system (ZIMSEC, O-Level/A-Level, cut-off points) and includes programs from institutions such as TelOne Centre for Learning.

6. **Next steps**: User testing with the target population will provide data for evaluating effectiveness, usability, and recommendation quality. Findings will inform refinements to the rule-based logic, prompts, and potentially future fine-tuning of the LLM.

---

## References

*Use Harvard referencing style. Include at least 10 empirical and theoretical sources from journals where possible. Example areas: design science research, career guidance, Holland’s RIASEC, AI in education, educational technology, mixed methods, usability evaluation.*
