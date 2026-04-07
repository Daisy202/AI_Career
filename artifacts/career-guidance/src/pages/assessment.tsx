import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button, Card, Progress, Checkbox, Label, Textarea, Input } from "@/components/ui-elements";
import { useCareerStore } from "@/store/use-career-store";

const subjectsList = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Geography", "History", "Commerce", "Accounting", "Economics",
  "Business Studies", "English Literature", "Art & Design", "Agriculture"
];

const oLevelSubjectsList = [
  "English Language", "Mathematics", "Biology", "Chemistry", "Physics",
  "Geography", "History", "Commerce", "Accounting", "Computer Science"
];

const interestsList = [
  "Technology & Software", "Healthcare & Medicine", "Business & Finance", 
  "Arts & Entertainment", "Engineering & Architecture", "Law & Public Policy",
  "Agriculture & Environment", "Education & Training"
];

const strengthsList = [
  "Problem Solving", "Creativity", "Leadership", "Communication", 
  "Analytical Thinking", "Teamwork", "Adaptability", "Attention to Detail"
];

const personalityTypes = [
  { id: "Realistic", label: "Realistic (Doer) - Prefer working with things, tools, and machines" },
  { id: "Investigative", label: "Investigative (Thinker) - Prefer studying and solving math or science problems" },
  { id: "Artistic", label: "Artistic (Creator) - Prefer creative activities like art, drama, crafts, dance, music" },
  { id: "Social", label: "Social (Helper) - Prefer activities that involve helping, healing, or teaching others" },
  { id: "Enterprising", label: "Enterprising (Persuader) - Prefer to lead and persuade others, sell things and ideas" },
  { id: "Conventional", label: "Conventional (Organizer) - Prefer working with numbers, records, or machines in a set way" }
];

const formSchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  strengths: z.array(z.string()).min(1, "Select at least one strength"),
  subjects: z.array(z.string()),
  oLevelSubjects: z.array(z.string()).optional().default([]),
  personalityType: z.string().min(1, "Select a personality type"),
  hobbies: z.string().optional(),
  cutOffPoints: z.coerce.number().min(0).max(20).optional().nullable(),
  oLevelPasses: z.coerce.number().min(0).max(10).optional().nullable(),
  aLevelPasses: z.coerce.number().min(0).max(5).optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

export default function AssessmentPage() {
  const [, setLocation] = useLocation();
  const { setProfile, user } = useCareerStore();
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interests: [],
      strengths: [],
      subjects: [],
      oLevelSubjects: [],
      personalityType: "",
      hobbies: "",
      cutOffPoints: null,
      oLevelPasses: null,
      aLevelPasses: null
    }
  });

  const clearRecommendations = useCareerStore(s => s.clearRecommendations);

  const onSubmit = async (data: FormValues) => {
    const hobbiesArray = data.hobbies ? data.hobbies.split(',').map(s => s.trim()).filter(Boolean) : [];
    const profileData = {
      interests: data.interests,
      strengths: data.strengths,
      subjects: data.subjects,
      oLevelSubjects: data.oLevelSubjects,
      personalityType: data.personalityType,
      hobbies: hobbiesArray,
      cutOffPoints: data.cutOffPoints,
      oLevelPasses: data.oLevelPasses,
      aLevelPasses: data.aLevelPasses
    };
    clearRecommendations(); // Invalidate cache so fresh results are fetched
    setProfile(profileData);

    if (user) {
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(profileData),
        });
      } catch {
        // ignore
      }
    }

    setLocation("/recommendations");
  };

  const nextStep = () => {
    // Basic validation before moving next
    const w = watch();
    if (step === 1 && w.interests.length === 0) return;
    if (step === 2 && w.strengths.length === 0) return;
    if (step === 3 && (w.oLevelSubjects?.length ?? 0) === 0) return;
    if (step === 5 && !w.personalityType) return;
    
    if (step < totalSteps) setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(s => s - 1);
  };

  // Helper to render checkbox grids
  const renderCheckboxGrid = (name: any, options: string[], error: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <>
              {options.map((option) => (
                <Label
                  key={option}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    field.value.includes(option) 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <Checkbox 
                    checked={field.value.includes(option)}
                    onChange={(e) => {
                      const valueCopy = [...field.value];
                      if (e.target.checked) {
                        field.onChange([...valueCopy, option]);
                      } else {
                        field.onChange(valueCopy.filter(v => v !== option));
                      }
                    }}
                  />
                  <span className="text-base font-semibold">{option}</span>
                </Label>
              ))}
            </>
          )}
        />
      </div>
      {error && <p className="text-destructive font-semibold text-sm">{error.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-5 lg:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Career Discovery Profile</h1>
          <p className="text-muted-foreground text-lg">Tell us about yourself to get AI-powered recommendations tailored for the Zimbabwean market.</p>
        </div>

        <Card className="p-6 sm:p-10 shadow-2xl border-white/50 bg-white/80 backdrop-blur-md">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-bold text-muted-foreground mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span className="text-primary">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-[400px]"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">What are your main interests?</h2>
                      <p className="text-muted-foreground">Select all that apply. What topics excite you the most?</p>
                    </div>
                    {renderCheckboxGrid("interests", interestsList, errors.interests)}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">What are your top strengths?</h2>
                      <p className="text-muted-foreground">Be honest about what you are naturally good at.</p>
                    </div>
                    {renderCheckboxGrid("strengths", strengthsList, errors.strengths)}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Select your O-Level Subjects</h2>
                      <p className="text-muted-foreground">Select all subjects you passed at O-Level. Required for diploma and degree matching.</p>
                    </div>
                    {renderCheckboxGrid("oLevelSubjects", oLevelSubjectsList, errors.oLevelSubjects)}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Select your A-Level Subjects</h2>
                      <p className="text-muted-foreground">What subjects are you taking or planning? Skip if you only have O-Level (diploma path).</p>
                    </div>
                    {renderCheckboxGrid("subjects", subjectsList, errors.subjects)}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <Label className="text-base font-semibold">A-Level Cut-off Points (Optional)</Label>
                      <p className="text-sm text-muted-foreground">Enter your ZIMSEC points (0–20) for a chance analysis. Does not affect recommendations.</p>
                      <Controller
                        name="cutOffPoints"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            placeholder="e.g. 12"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            className="max-w-[140px]"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">What is your Personality Type?</h2>
                      <p className="text-muted-foreground">Choose the one that best describes you overall.</p>
                    </div>
                    <div className="space-y-3">
                      <Controller
                        name="personalityType"
                        control={control}
                        render={({ field }) => (
                          <>
                            {personalityTypes.map((type) => (
                              <Label
                                key={type.id}
                                className={`flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                                  field.value === type.id 
                                    ? 'border-primary bg-primary/5 shadow-md' 
                                    : 'border-border hover:border-primary/50 hover:bg-muted'
                                }`}
                              >
                                <div className="pt-0.5">
                                  <input 
                                    type="radio" 
                                    className="h-5 w-5 text-primary focus:ring-primary accent-primary"
                                    checked={field.value === type.id}
                                    onChange={() => field.onChange(type.id)}
                                  />
                                </div>
                                <span className="text-base font-medium leading-tight">{type.label}</span>
                              </Label>
                            ))}
                          </>
                        )}
                      />
                      {errors.personalityType && <p className="text-destructive font-semibold text-sm">{errors.personalityType.message}</p>}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Any hobbies or extra details?</h2>
                      <p className="text-muted-foreground">Tell the AI about your extracurricular activities (Optional)</p>
                    </div>
                    <Controller
                      name="hobbies"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          placeholder="e.g. Coding club, Debate team, playing chess, writing poetry..."
                          className="min-h-[150px] text-base"
                        />
                      )}
                    />
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Academic Performance</h2>
                      <p className="text-muted-foreground">Enter your O-Level passes, A-Level passes, and cut-off points. Most programs require at least 5 O-Level and 2 A-Level passes.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2 text-center">
                        <Label className="text-lg">O-Level Passes</Label>
                        <Controller
                          name="oLevelPasses"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              type="number"
                              min={0}
                              max={10}
                              placeholder="e.g. 5"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              className="text-center text-xl h-14"
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">Min 5 for most programs</p>
                      </div>
                      <div className="space-y-2 text-center">
                        <Label className="text-lg">A-Level Passes</Label>
                        <Controller
                          name="aLevelPasses"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              type="number"
                              min={0}
                              max={5}
                              placeholder="e.g. 2"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              className="text-center text-xl h-14"
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">Min 2 for most programs</p>
                      </div>
                      <div className="space-y-2 text-center">
                        <Label className="text-lg">A-Level Points (0-20)</Label>
                        <Controller
                          name="cutOffPoints"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              type="number"
                              min={0}
                              max={20}
                              placeholder="Cut-off"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              className="text-center text-xl h-14"
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">ZIMSEC cut-off</p>
                      </div>
                    </div>

                    <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-6 mt-8 flex items-start gap-4">
                      <CheckCircle2 className="w-8 h-8 text-secondary shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-lg mb-1">Ready to discover your path?</h4>
                        <p className="text-muted-foreground text-sm">By submitting, our AI will analyze your profile and cross-reference it with the Zimbabwean job market data.</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              
              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} className="min-w-[120px]">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" variant="accent" className="min-w-[160px]">
                  Generate Matches <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
