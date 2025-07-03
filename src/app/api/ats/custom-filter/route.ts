import { NextRequest, NextResponse } from 'next/server';

// You should set these in your environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

// Helper: Local fallback for location/state/city substring match
function matchesLocationOrState(profile: any, filters: any) {
  const locFilter = (filters.location || '').toLowerCase().trim();
  const stateFilter = (filters.state || '').toLowerCase().trim();
  if (!locFilter && !stateFilter) return false;
  const fields = [
    profile.location,
    profile.city,
    profile.currentCity,
    profile.address,
    ...(Array.isArray(profile.preferredCities) ? profile.preferredCities : []),
    ...(Array.isArray(profile.preferenceCities) ? profile.preferenceCities : []),
    ...(Array.isArray(profile.preferredLocations) ? profile.preferredLocations : []),
  ];
  const stateFields = [
    profile.state,
    profile.currentState,
    profile.address,
  ];
  // Robust stringification and logging
  const stringFields = fields.map(f => (f === undefined || f === null) ? '' : String(f).toLowerCase().trim());
  const stringStateFields = stateFields.map(f => (f === undefined || f === null) ? '' : String(f).toLowerCase().trim());
  console.log('[DEBUG] Location filter:', locFilter, '| Candidate fields:', stringFields);
  console.log('[DEBUG] State filter:', stateFilter, '| Candidate state fields:', stringStateFields);
  // Location match
  if (locFilter && stringFields.some(f => f.includes(locFilter))) return true;
  // State match
  if (stateFilter && stringStateFields.some(f => f.includes(stateFilter))) return true;
  return false;
}

// Helper: Local fallback for keyword and education filters
function matchesKeywordsAndEducation(profile: any, filters: any) {
  // Gather all searchable text fields
  const textFields = [
    profile.name,
    profile.role,
    profile.status,
    profile.content,
    profile.profileOutline,
    profile.summary,
    profile.aboutMe,
    profile.description,
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile.notes) ? profile.notes : [profile.notes]),
    ...(Array.isArray(profile.additionalInfo) ? profile.additionalInfo : [profile.additionalInfo]),
    ...(Array.isArray(profile.coverLetter) ? profile.coverLetter : [profile.coverLetter]),
  ].filter(Boolean).map(String);

  // Add education fields
  if (Array.isArray(profile.education)) {
    for (const edu of profile.education) {
      if (typeof edu === 'string') textFields.push(edu);
      else if (typeof edu === 'object' && edu) {
        Object.values(edu).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add experience fields
  if (Array.isArray(profile.experience)) {
    for (const exp of profile.experience) {
      if (typeof exp === 'string') textFields.push(exp);
      else if (typeof exp === 'object' && exp) {
        Object.values(exp).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add workExperience fields
  if (Array.isArray(profile.workExperience)) {
    for (const exp of profile.workExperience) {
      if (typeof exp === 'string') textFields.push(exp);
      else if (typeof exp === 'object' && exp) {
        Object.values(exp).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add certifications
  if (Array.isArray(profile.certifications)) {
    for (const cert of profile.certifications) {
      if (typeof cert === 'string') textFields.push(cert);
      else if (typeof cert === 'object' && cert) {
        Object.values(cert).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add preferredCities, preferenceCities, preferredLocations
  ['preferredCities', 'preferenceCities', 'preferredLocations'].forEach(key => {
    if (Array.isArray(profile[key])) {
      profile[key].forEach((val: any) => val && textFields.push(String(val)));
    }
  });

  // Lowercase all text fields for matching
  const allText = textFields.map(f => f.toLowerCase());

  // Mandatory keywords: all must be present
  if (Array.isArray(filters.mandatoryKeywords) && filters.mandatoryKeywords.length > 0) {
    for (const kw of filters.mandatoryKeywords) {
      if (!kw) continue;
      const kwLower = kw.toLowerCase();
      if (!allText.some(f => f.includes(kwLower))) return false;
    }
  }

  // NOT keywords: none must be present
  if (Array.isArray(filters.notKeywords) && filters.notKeywords.length > 0) {
    for (const kw of filters.notKeywords) {
      if (!kw) continue;
      const kwLower = kw.toLowerCase();
      if (allText.some(f => f.includes(kwLower))) return false;
    }
  }

  // Education level: at least one must match
  if (Array.isArray(filters.educationLevel) && filters.educationLevel.length > 0) {
    let found = false;
    for (const level of filters.educationLevel) {
      if (!level) continue;
      const lvlLower = level.toLowerCase();
      if (allText.some(f => f.includes(lvlLower))) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  // If all checks pass, return true
  return true;
}

// Helper: Count preferred keyword matches (robust)
function countPreferredKeywordMatches(profile: any, filters: any) {
  if (!Array.isArray(filters.preferredKeywords) || filters.preferredKeywords.length === 0) return 0;
  // Gather all searchable text fields (same as matchesKeywordsAndEducation)
  const textFields = [
    profile.name,
    profile.role,
    profile.status,
    profile.content,
    profile.profileOutline,
    profile.summary,
    profile.aboutMe,
    profile.description,
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile.notes) ? profile.notes : [profile.notes]),
    ...(Array.isArray(profile.additionalInfo) ? profile.additionalInfo : [profile.additionalInfo]),
    ...(Array.isArray(profile.coverLetter) ? profile.coverLetter : [profile.coverLetter]),
  ].filter(Boolean).map(String);

  // Add education fields
  if (Array.isArray(profile.education)) {
    for (const edu of profile.education) {
      if (typeof edu === 'string') textFields.push(edu);
      else if (typeof edu === 'object' && edu) {
        Object.values(edu).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add experience fields
  if (Array.isArray(profile.experience)) {
    for (const exp of profile.experience) {
      if (typeof exp === 'string') textFields.push(exp);
      else if (typeof exp === 'object' && exp) {
        Object.values(exp).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add workExperience fields
  if (Array.isArray(profile.workExperience)) {
    for (const exp of profile.workExperience) {
      if (typeof exp === 'string') textFields.push(exp);
      else if (typeof exp === 'object' && exp) {
        Object.values(exp).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add certifications
  if (Array.isArray(profile.certifications)) {
    for (const cert of profile.certifications) {
      if (typeof cert === 'string') textFields.push(cert);
      else if (typeof cert === 'object' && cert) {
        Object.values(cert).forEach(val => val && textFields.push(String(val)));
      }
    }
  }

  // Add preferredCities, preferenceCities, preferredLocations
  ['preferredCities', 'preferenceCities', 'preferredLocations'].forEach(key => {
    if (Array.isArray(profile[key])) {
      profile[key].forEach((val: any) => val && textFields.push(String(val)));
    }
  });

  // Lowercase all text fields for matching
  const allText = textFields.map(f => f.toLowerCase());
  let count = 0;
  for (const kw of filters.preferredKeywords) {
    if (!kw) continue;
    const kwLower = kw.toLowerCase();
    if (allText.some(f => f.includes(kwLower))) count++;
  }
  return count;
}

// Helper: Call Gemini API with a prompt
async function geminiFilterProfile(profile: any, filters: any) {
  // Build a prompt for Gemini
  const prompt = `\nYou are an expert resume screener. Given the following candidate profile (as JSON) and filter criteria, answer ONLY with the word 'true' if the profile matches ALL the filters, otherwise ONLY the word 'false'. No punctuation, no explanation, no extra words.\n\n- For location/state/region/city filters, check ALL possible fields in the profile (including: location, city, currentCity, currentState, state, address, preferredCities, and any similar fields).\n- For keywords, check all text fields, skills, summary, profileOutline, aboutMe, description, and any relevant nested fields.\n- For assets, check both skills and any asset/availableAssets fields.\n- For education, check all education/qualification fields.\n- For experience, check all experience/workExperience fields.\n- For shift, gender, industry, salary, age, check all relevant fields and their variants.\n- If any filter is not present, ignore it.\n- If a filter value is present in ANY relevant field, consider it a match.\n\nProfile:\n${JSON.stringify(profile)}\n\nFilters:\n${JSON.stringify(filters)}\n\nRemember: Only return 'true' or 'false'. No punctuation, no explanation, no extra words.`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Gemini API error');
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Log Gemini's raw output for debugging
  console.log('Gemini raw output:', text, '\nProfile:', profile, '\nFilters:', filters);
  return text.trim().toLowerCase() === 'true';
}

// Helper: Extract first number from a string (or return undefined if not found)
function extractNumber(val: any) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const match = val.match(/\d+/);
    if (match) return Number(match[0]);
  }
  return undefined;
}

// Helper: Check experience, salary, and age range filters (bulletproof)
function matchesRangeFilters(profile: any, filters: any) {
  // Debug log for experience, salary, age
  const years = extractNumber(profile.yearsOfExperience);
  const salary = extractNumber(profile.currentSalary);
  const age = extractNumber(profile.age);
  console.log('[DEBUG] Candidate:', profile.name, '| Experience:', years, '| Salary:', salary, '| Age:', age);
  // Experience
  if (Array.isArray(filters.experienceRange) && filters.experienceRange.length === 2) {
    const minExp = Number(filters.experienceRange[0]);
    const maxExp = Number(filters.experienceRange[1]);
    // Ignore if default
    if (!(minExp === 0 && maxExp === 20)) {
      if (years !== undefined) {
        if (years < minExp || years > maxExp) return false;
      }
    }
  }
  // Salary
  if (Array.isArray(filters.salaryRange) && filters.salaryRange.length === 2) {
    const minSal = Number(filters.salaryRange[0]);
    const maxSal = Number(filters.salaryRange[1]);
    // Ignore if default
    if (!(minSal === 0 && maxSal === 200000)) {
      if (salary !== undefined) {
        if (salary < minSal || salary > maxSal) return false;
      }
    }
  }
  // Age
  if (Array.isArray(filters.ageRange) && filters.ageRange.length === 2) {
    const minAge = Number(filters.ageRange[0]);
    const maxAge = Number(filters.ageRange[1]);
    // Ignore if default
    if (!(minAge === 18 && maxAge === 65)) {
      if (age !== undefined) {
        if (age < minAge || age > maxAge) return false;
      }
    }
  }
  return true;
}

// Helper: Local fallback for gender filter
function matchesGender(profile: any, filters: any) {
  if (!filters.gender || filters.gender === '' || filters.gender === 'Any') return true;
  if (!profile.gender) return false;
  return profile.gender.toLowerCase() === filters.gender.toLowerCase();
}

// Helper: Local fallback for shift preference
function matchesShiftPreference(profile: any, filters: any) {
  if (!Array.isArray(filters.shiftPreference) || filters.shiftPreference.length === 0) return true;
  // Gather all relevant fields
  const fields = [
    profile.shiftPreference,
    profile.preferredShift,
    profile.content,
    ...(Array.isArray(profile.skills) ? profile.skills : []),
  ].filter(Boolean).map(f => String(f).toLowerCase().trim()).filter(f => f !== "");
  console.log('[DEBUG] Shift filter:', filters.shiftPreference, '| Candidate fields:', fields);
  if (fields.length === 0) return false; // If candidate has no shift info, do not match
  // Match if any selected shift is present in any field
  return filters.shiftPreference.some((pref: any) => {
    const prefLower = String(pref).toLowerCase().trim();
    return fields.some(f => f.includes(prefLower));
  });
}

export async function POST(req: NextRequest) {
  try {
    const { candidates, filters } = await req.json();
    if (!Array.isArray(candidates) || !filters) {
      return NextResponse.json({ error: 'Missing candidates or filters' }, { status: 400 });
    }

    // Check if only preferred keywords are set (no other filters)
    const onlyPreferred =
      Array.isArray(filters.preferredKeywords) && filters.preferredKeywords.length > 0 &&
      (!filters.mandatoryKeywords || filters.mandatoryKeywords.length === 0) &&
      (!filters.notKeywords || filters.notKeywords.length === 0) &&
      (!filters.location || filters.location === '') &&
      (!filters.state || filters.state === '') &&
      (!filters.educationLevel || filters.educationLevel.length === 0) &&
      (!filters.gender || filters.gender === '' || filters.gender === 'Any') &&
      (!filters.industry || filters.industry === '' || filters.industry === 'Any') &&
      (!filters.experienceRange || (Array.isArray(filters.experienceRange) && filters.experienceRange[0] === 0 && filters.experienceRange[1] === 20)) &&
      (!filters.salaryRange || (Array.isArray(filters.salaryRange) && filters.salaryRange[0] === 0 && filters.salaryRange[1] === 200000)) &&
      (!filters.ageRange || (Array.isArray(filters.ageRange) && filters.ageRange[0] === 18 && filters.ageRange[1] === 65)) &&
      (!filters.atsScore || filters.atsScore === 0) &&
      (!filters.assets || Object.values(filters.assets).every(v => !v)) &&
      (!filters.shiftPreference || filters.shiftPreference === '' || filters.shiftPreference === 'Any');

    let results;
    if (onlyPreferred) {
      // Filter to only candidates with at least one preferred keyword match and matching range filters, then sort
      results = candidates.filter(c => countPreferredKeywordMatches(c, filters) > 0 && matchesRangeFilters(c, filters));
      results.sort((a, b) =>
        countPreferredKeywordMatches(b, filters) - countPreferredKeywordMatches(a, filters)
      );
      return NextResponse.json({ filtered: results });
    }

    try {
      // For each candidate, ask Gemini if they match the filters
      results = await Promise.all(
        candidates.map(async (profile) => {
          try {
            const matches = await geminiFilterProfile(profile, filters);
            // Fallback: Only include if ALL active filters match
            const locationActive = !!filters.location;
            const stateActive = !!filters.state;
            const mustMatchLocation = !locationActive || matchesLocationOrState(profile, filters);
            const mustMatchState = !stateActive || matchesLocationOrState(profile, filters);
            const mustMatchKeywords = matchesKeywordsAndEducation(profile, filters);
            const mustMatchGender = matchesGender(profile, filters);
            const mustMatchShift = matchesShiftPreference(profile, filters);
            if (
              matches ||
              (
                mustMatchLocation &&
                mustMatchState &&
                mustMatchKeywords &&
                mustMatchGender &&
                mustMatchShift
              )
            )
              return matchesRangeFilters(profile, filters) ? profile : null;
            return null;
          } catch (e) {
            // On Gemini error, fallback to ALL active filters
            const locationActive = !!filters.location;
            const stateActive = !!filters.state;
            const mustMatchLocation = !locationActive || matchesLocationOrState(profile, filters);
            const mustMatchState = !stateActive || matchesLocationOrState(profile, filters);
            const mustMatchKeywords = matchesKeywordsAndEducation(profile, filters);
            const mustMatchGender = matchesGender(profile, filters);
            const mustMatchShift = matchesShiftPreference(profile, filters);
            if (
              mustMatchLocation &&
              mustMatchState &&
              mustMatchKeywords &&
              mustMatchGender &&
              mustMatchShift
            )
              return matchesRangeFilters(profile, filters) ? profile : null;
            return null;
          }
        })
      );
    } catch (e) {
      // If Gemini fails for all, fallback to local filtering for all candidates
      results = candidates.filter(profile =>
        (matchesLocationOrState(profile, filters) ||
        matchesKeywordsAndEducation(profile, filters)) &&
        matchesRangeFilters(profile, filters)
      );
    }

    // Filter out nulls (non-matching or errored)
    results = results.filter(Boolean);

    // Sort by preferred keyword match count (descending)
    if (Array.isArray(filters.preferredKeywords) && filters.preferredKeywords.length > 0) {
      results.sort((a, b) =>
        countPreferredKeywordMatches(b, filters) - countPreferredKeywordMatches(a, filters)
      );
    }

    return NextResponse.json({ filtered: results });
  } catch (e) {
    return NextResponse.json({ error: 'Server error', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
} 