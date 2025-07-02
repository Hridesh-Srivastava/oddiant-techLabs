import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const IT_KEYWORDS = [
  "javascript", "python", "java", "react", "node", "sql", "cloud", "aws", "azure", "docker", "devops", "typescript", "html", "css", "mongodb", "express", "c#", "c++", "git", "linux", "agile", "jira", "scrum", "api", "rest", "graphql", "testing", "automation", "data", "ml", "ai", "security", "network", "kubernetes", "microservices"
];
const HR_KEYWORDS = [
  "recruitment", "talent", "onboarding", "payroll", "compliance", "training", "employee engagement", "hrms", "performance", "benefits", "interview", "sourcing", "hr analytics", "policy", "labor law", "diversity", "retention", "conflict", "appraisal", "organizational", "leadership"
];

function keywordScore(skills: any[] = [], keywords: string[] = []) {
  let score = 0;
  const matched: string[] = [];
  for (const skill of skills) {
    for (const kw of keywords) {
      if (typeof skill === 'string' && skill.toLowerCase().includes(kw)) {
        score += 3;
        matched.push(kw);
      }
    }
  }
  return { score: Math.min(score, 30), matched: [...new Set(matched)] };
}

export async function GET(
  request: NextRequest,
) {
  const id = request.nextUrl.pathname.split('/').pop();
  const type = request.nextUrl.searchParams.get("type"); // "candidates" or "students"
  if (!id || !type) return NextResponse.json({ error: "Missing id or type" }, { status: 400 });

  const { db } = await connectToDatabase();
  const collection = db.collection(type);
  let profile;
  try {
    profile = await collection.findOne({ _id: new ObjectId(id) });
  } catch (e) {
    return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
  }

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let score = 0;
  const feedback = [];

  // --- Skills analysis ---
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const skillCount = skills.length;
  const skillDiversity = new Set(skills.map(s => typeof s === 'string' ? s.toLowerCase() : s)).size;
  const { score: itScore, matched: itMatched } = keywordScore(skills, IT_KEYWORDS);
  const { score: hrScore, matched: hrMatched } = keywordScore(skills, HR_KEYWORDS);
  score += Math.min(skillCount * 2, 20); // up to 20 for number of skills
  score += Math.min(skillDiversity * 1, 10); // up to 10 for diversity
  score += itScore + hrScore; // up to 30 for relevant keywords
  if (skillCount > 0) feedback.push(`Skills: ${skillCount} (${skillDiversity} unique)`);
  if (itMatched.length > 0) feedback.push(`IT keywords: ${itMatched.join(", ")}`);
  if (hrMatched.length > 0) feedback.push(`HR keywords: ${hrMatched.join(", ")}`);
  if (skillCount === 0) feedback.push("No skills listed");

  // --- Experience analysis ---
  const exp = Array.isArray(profile.experience) ? profile.experience : [];
  const expCount = exp.length;
  const recentExp = exp.find(e => e && e.endDate && new Date(e.endDate).getFullYear() >= (new Date().getFullYear() - 2));
  score += Math.min(expCount * 6, 30); // up to 30 for experience count
  if (recentExp) score += 5; // bonus for recent experience
  if (expCount > 0) feedback.push(`Experience: ${expCount}${recentExp ? " (recent)" : ""}`);
  else feedback.push("No experience listed");

  // --- Education analysis ---
  const edu = Array.isArray(profile.education) ? profile.education : [];
  const eduCount = edu.length;
  const hasMasters = edu.some(e => e && e.level && typeof e.level === 'string' && e.level.toLowerCase().includes("master"));
  const hasPhD = edu.some(e => e && e.level && typeof e.level === 'string' && e.level.toLowerCase().includes("phd"));
  score += Math.min(eduCount * 5, 15); // up to 15 for education count
  if (hasMasters) score += 5;
  if (hasPhD) score += 10;
  if (eduCount > 0) feedback.push(`Education: ${eduCount}${hasMasters ? ", Masters" : ""}${hasPhD ? ", PhD" : ""}`);
  else feedback.push("No education listed");

  // --- Certifications ---
  const certs = Array.isArray(profile.certifications) ? profile.certifications : [];
  if (certs.length > 0) {
    score += Math.min(certs.length * 2, 10); // up to 10 for certifications
    feedback.push(`Certifications: ${certs.length}`);
  }

  // --- Profile completeness ---
  let completeness = 0;
  if (profile.profileOutline || profile.summary || profile.aboutMe) completeness += 1;
  if (profile.resumeUrl) completeness += 1;
  if (profile.photographUrl) completeness += 1;
  if (profile.email) completeness += 1;
  if (profile.phone) completeness += 1;
  if (completeness >= 4) {
    score += 5;
    feedback.push("Profile is mostly complete");
  } else if (completeness >= 2) {
    score += 2;
    feedback.push("Profile is partially complete");
  } else {
    feedback.push("Profile is incomplete");
  }

  // --- Additional important fields for higher score (with more weight for assets, identity, social links) ---
  if (profile.portfolioLink || profile.socialMediaLink || profile.linkedIn || (profile.onlinePresence && (profile.onlinePresence.portfolio || profile.onlinePresence.linkedin || profile.onlinePresence.github))) {
    score += 6; // increased weight
    feedback.push("Portfolio or social links provided");
  }
  if (profile.coverLetter) {
    score += 2;
    feedback.push("Cover letter provided");
  }
  if (profile.additionalInfo) {
    score += 2;
    feedback.push("Additional info provided");
  }
  if (Array.isArray(profile.preferredCities) && profile.preferredCities.length > 0) {
    score += 2;
    feedback.push("Preferred cities specified");
  }
  if (Array.isArray(profile.availableAssets) && profile.availableAssets.length > 0) {
    score += 5; // increased weight
    feedback.push("Assets listed");
  }
  if (Array.isArray(profile.identityDocuments) && profile.identityDocuments.length > 0) {
    score += 5; // increased weight
    feedback.push("Identity documents listed");
  }
  // --- Global best-practice fields (LinkedIn/Naukri) ---
  if (profile.headline || profile.title) {
    score += 2;
    feedback.push("Professional headline/title provided");
  }
  if (profile.professionalSummary || profile.summary || profile.profileOutline) {
    score += 2;
    feedback.push("Professional summary provided");
  }
  if (Array.isArray(profile.languages) && profile.languages.length > 0) {
    score += 2;
    feedback.push("Languages listed");
  }
  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    score += 2;
    feedback.push("Projects listed");
  }
  if (Array.isArray(profile.references) && profile.references.length > 0) {
    score += 2;
    feedback.push("References listed");
  }

  // --- Cap score and build feedback ---
  score = Math.max(0, Math.min(Math.round(score), 100));
  if (score < 40) feedback.push("Consider adding more skills, experience, or education for a better match.");
  else if (score < 70) feedback.push("Good profile, but could be improved with more relevant skills or recent experience.");
  else feedback.push("Strong profile for IT/HR roles.");

  return NextResponse.json({
    score,
    feedback: feedback.join(" | ")
  });
} 