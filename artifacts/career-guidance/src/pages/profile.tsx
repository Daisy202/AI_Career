import { useEffect, useMemo, useState } from "react";
import { useCareerStore } from "@/store/use-career-store";
import { Card, Button, Input, Label, Textarea, Checkbox } from "@/components/ui-elements";
import {
  A_LEVEL_SUBJECT_GROUPS,
  O_LEVEL_SUBJECT_GROUPS,
  type SubjectGroup,
} from "@workspace/zimsec-subjects";

function csvToArray(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function ProfilePage() {
  const profile = useCareerStore((s) => s.profile);
  const setProfile = useCareerStore((s) => s.setProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [interests, setInterests] = useState("");
  const [strengths, setStrengths] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [oLevelSubjects, setOLevelSubjects] = useState<string[]>([]);
  const [personalityType, setPersonalityType] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [cutOffPoints, setCutOffPoints] = useState<string>("");
  const [oLevelPasses, setOLevelPasses] = useState<string>("");
  const [aLevelPasses, setALevelPasses] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setInterests((data.interests ?? []).join(", "));
        setStrengths((data.strengths ?? []).join(", "));
        setSubjects((data.subjects ?? []) as string[]);
        setOLevelSubjects((data.oLevelSubjects ?? []) as string[]);
        setPersonalityType(data.personalityType ?? "");
        setHobbies((data.hobbies ?? []).join(", "));
        setCutOffPoints(data.cutOffPoints != null ? String(data.cutOffPoints) : "");
        setOLevelPasses(data.oLevelPasses != null ? String(data.oLevelPasses) : "");
        setALevelPasses(data.aLevelPasses != null ? String(data.aLevelPasses) : "");
      })
      .finally(() => setLoading(false));
  }, [setProfile]);

  const onSave = async () => {
    setSaving(true);
    setMessage("");
    const payload = {
      interests: csvToArray(interests),
      strengths: csvToArray(strengths),
      subjects,
      oLevelSubjects,
      personalityType: personalityType || null,
      hobbies: csvToArray(hobbies),
      cutOffPoints: cutOffPoints ? Number(cutOffPoints) : null,
      oLevelPasses: oLevelPasses ? Number(oLevelPasses) : null,
      aLevelPasses: aLevelPasses ? Number(aLevelPasses) : null,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error ?? "Failed to save profile");
      } else {
        const saved = {
          interests: data.interests ?? payload.interests,
          strengths: data.strengths ?? payload.strengths,
          subjects: (data.subjects ?? payload.subjects) as string[],
          oLevelSubjects: (data.oLevelSubjects ?? payload.oLevelSubjects) as string[],
          personalityType: data.personalityType ?? payload.personalityType,
          hobbies: data.hobbies ?? payload.hobbies,
          cutOffPoints: data.cutOffPoints ?? payload.cutOffPoints,
          oLevelPasses: data.oLevelPasses ?? payload.oLevelPasses,
          aLevelPasses: data.aLevelPasses ?? payload.aLevelPasses,
        };
        setSubjects(saved.subjects);
        setOLevelSubjects(saved.oLevelSubjects);
        setProfile(saved);
        setMessage("Profile updated successfully.");
      }
    } catch {
      setMessage("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-5 lg:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <Card className="p-6 space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading profile...</p> : null}
          <div className="space-y-2">
            <Label>Interests (comma-separated)</Label>
            <Textarea value={interests} onChange={(e) => setInterests(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Strengths (comma-separated)</Label>
            <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>A-Level Subjects (select)</Label>
            <GroupedSubjectPicker
              groups={A_LEVEL_SUBJECT_GROUPS as SubjectGroup[]}
              value={subjects}
              onChange={setSubjects}
            />
          </div>
          <div className="space-y-2">
            <Label>O-Level Subjects (select)</Label>
            <GroupedSubjectPicker
              groups={O_LEVEL_SUBJECT_GROUPS as SubjectGroup[]}
              value={oLevelSubjects}
              onChange={setOLevelSubjects}
            />
          </div>
          <div className="space-y-2">
            <Label>Personality Type</Label>
            <Input value={personalityType} onChange={(e) => setPersonalityType(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hobbies (comma-separated)</Label>
            <Input value={hobbies} onChange={(e) => setHobbies(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>A-Level Cut-off (1-15)</Label>
              <Input type="number" min={1} max={15} value={cutOffPoints} onChange={(e) => setCutOffPoints(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>O-Level Passes</Label>
              <Input type="number" min={0} max={10} value={oLevelPasses} onChange={(e) => setOLevelPasses(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>A-Level Passes</Label>
              <Input type="number" min={0} max={5} value={aLevelPasses} onChange={(e) => setALevelPasses(e.target.value)} />
            </div>
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </Card>
        {profile ? null : <p className="text-xs text-muted-foreground mt-4">Complete and save your profile to improve recommendations.</p>}
      </div>
    </div>
  );
}

function GroupedSubjectPicker(props: {
  groups: SubjectGroup[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { groups, value, onChange } = props;
  const selected = useMemo(() => new Set(value), [value]);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{g.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {g.subjects.map((s) => {
              const checked = selected.has(s);
              return (
                <Label
                  key={s}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer ${
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) onChange([...value, s]);
                      else onChange(value.filter((x) => x !== s));
                    }}
                  />
                  <span className="text-sm">{s}</span>
                </Label>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Selecting subjects prevents spelling errors so matching works reliably.
      </p>
    </div>
  );
}
