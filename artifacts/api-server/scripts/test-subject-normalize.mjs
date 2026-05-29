import { normalizeSubjectList } from "../src/lib/subjectMatch.ts";

const input = [
  "Pure Mathematics",
  "Statistics",
  "Mathematics",
  "Additional Mathematics",
  "Mechanical Mathematics",
  "History",
  "Literature in English",
  "historry",
  "pure maths",
];

const out = normalizeSubjectList(input);
console.log("in:", input.length, "out:", out.length);
console.log(out);

const expected = [
  "Pure Mathematics",
  "Statistics",
  "Mathematics",
  "Additional Mathematics",
  "Mechanical Mathematics",
  "History",
  "Literature in English",
];
const missing = expected.filter(e => !out.includes(e));
const collapsed = out.length < input.filter(s => normalizeSubjectList([s]).length).length;
console.log("missing:", missing);
console.log("all distinct math kept:", !missing.length);
