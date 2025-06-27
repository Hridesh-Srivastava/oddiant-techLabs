"use client";

import type React from "react";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Linkedin,
  Share2,
  Instagram,
  Twitter,
  Facebook,
  Laptop,
  PencilLine,
  Video,
} from "lucide-react";

interface StudentData {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  alternativePhone?: string;
  profileCompleted: boolean;
  salutation?: string;
  gender?: string;
  dob?: string;
  currentCity?: string;
  currentState?: string;
  pincode?: string;
  permanentAddress?: string;
  skills?: string[];
  education?: Array<{
    level?: string;
    degree?: string;
    institution?: string;
    school?: string;
    field?: string;
    grade?: string;
    percentage?: string;
    startingYear?: string;
    endingYear?: string;
    mode?: string;
  }>;
  certifications?:
    | string[]
    | Array<{
        name: string;
        issuingOrganization?: string;
        issueDate?: string;
        expiryDate?: string;
        credentialId?: string;
        credentialUrl?: string;
      }>;
  experience?: Array<{
    title: string;
    companyName: string;
    department?: string;
    location?: string;
    tenure?: string;
    currentlyWorking?: boolean;
    professionalSummary?: string;
    summary?: string;
    currentSalary?: string;
    expectedSalary?: string;
    noticePeriod?: string;
    totalExperience?: string;
    yearsOfExperience?: string;
  }>;
  totalExperience?: string;
  yearsOfExperience?: string;
  shiftPreference?: string | string[];
  preferenceCities?: string[];
  profileOutline?: string;
  onlinePresence?: {
    portfolio?: string;
    linkedin?: string;
    github?: string;
    socialMedia?: string;
  };
  portfolioLink?: string;
  socialMediaLink?: string;
  linkedIn?: string;
  coverLetter?: string;
  additionalInfo?: string;
  documents?: {
    resume?: {
      url?: string;
      public_id?: string;
      filename?: string;
      uploadDate?: string;
    };
    photograph?: {
      url?: string;
      public_id?: string;
      name?: string;
      uploadDate?: string;
    };
    videoResume?: {
      url?: string;
      public_id?: string;
      filename?: string;
      uploadDate?: string;
    };
    audioBiodata?: {
      url?: string;
      public_id?: string;
      filename?: string;
      uploadDate?: string;
    };
  };
  assets?: {
    bike?: boolean;
    wifi?: boolean;
    laptop?: boolean;
    panCard?: boolean;
    aadhar?: boolean;
    bankAccount?: boolean;
    idProof?: boolean;
  };
  
  availableAssets?: string[];
  identityDocuments?: string[];
  settings?: {
    profileVisibility: boolean;
    notifications: {
      email: boolean;
      jobRecommendations: boolean;
      applicationUpdates: boolean;
    };
    preferredJobTypes: string[];
    preferredLocations: string[];
    shiftPreference: string;
  };
  avatar?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  workExperience?: Array<{
    title: string
    companyName: string
    department?: string
    location?: string
    tenure?: string
    currentlyWorking?: boolean
    professionalSummary?: string
    summary?: string
    currentSalary?: string
    expectedSalary?: string
    noticePeriod?: string
    totalExperience?: string
    yearsOfExperience?: string
  }>;
  dateOfBirth?: string // For candidates collection
  preferredCities?: string[] // Alternative field name for candidates
  // availableAssets?: string[]
  // identityDocuments?: string[]
  
  // Document field mappings for candidates
  resumeUrl?: string
  videoResumeUrl?: string
  audioBiodataUrl?: string
  photographUrl?: string
}

// Helper function to safely get experience array from either collection
const getExperienceArray = (student: any): Array<any> => {
  // Try experience field first (students collection)
  if (student.experience && Array.isArray(student.experience)) {
    return student.experience
  }

  // Try workExperience field (candidates collection)
  if (student.workExperience && Array.isArray(student.workExperience)) {
    return student.workExperience
  }

  // Return empty array as fallback
  return []
}
// Helper function to get date of birth from either collection
const getDateOfBirth = (student: any): string => {
  return student.dob || student.dateOfBirth || ""
}

// Helper function to get preferred cities from either collection
const getPreferredCities = (student: any): string[] => {
  // Try preferenceCities field first (students collection)
  if (student.preferenceCities && Array.isArray(student.preferenceCities)) {
    return student.preferenceCities
  }

  // Try preferredCities field (candidates collection)
  if (student.preferredCities && Array.isArray(student.preferredCities)) {
    return student.preferredCities
  }

  // Return empty array as fallback
  return []
}

// Helper function to get documents safely
const getDocuments = (student: any) => {
  return {
    resume: {
      url: student.documents?.resume?.url || student.resumeUrl || "",
      filename: student.documents?.resume?.filename || "",
      uploadDate: student.documents?.resume?.uploadDate || "",
    },
    videoResume: {
      url: student.documents?.videoResume?.url || student.videoResumeUrl || "",
      filename: student.documents?.videoResume?.filename || "",
      uploadDate: student.documents?.videoResume?.uploadDate || "",
    },
    audioBiodata: {
      url: student.documents?.audioBiodata?.url || student.audioBiodataUrl || "",
      filename: student.documents?.audioBiodata?.filename || "",
      uploadDate: student.documents?.audioBiodata?.uploadDate || "",
    },
    photograph: {
      url: student.documents?.photograph?.url || student.photographUrl || student.avatar || "",
      name: student.documents?.photograph?.name || "",
      uploadDate: student.documents?.photograph?.uploadDate || "",
    },
  }
}
// Helper function to format full name properly (FIXED)
const getFullName = (student: any): string => {
  const parts: string[] = []

  if (student.salutation) {
    parts.push(student.salutation)
  }

  if (student.firstName) {
    parts.push(student.firstName)
  }

  // Only add middleName if it exists and is not "noMid"
  if (student.middleName && student.middleName.toLowerCase() !== "nomid") {
    parts.push(student.middleName)
  }

  if (student.lastName) {
    parts.push(student.lastName)
  }

  return parts.join(" ")
}

export default function EditStudentProfile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState<StudentData | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newPreferenceCity, setNewPreferenceCity] = useState("");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingVideoResume, setIsUploadingVideoResume] = useState(false);
  const [isUploadingAudioBiodata, setIsUploadingAudioBiodata] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const videoResumeFileInputRef = useRef<HTMLInputElement>(null);
  const audioBiodataFileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/student/profile", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (response.status === 401) {
          router.push("/auth/login");
          return;
        }

        if (!response.ok) {
          if (response.status === 404) {
            setError(
              "Student profile not found. Please complete your registration."
            );
          } else {
            setError("Failed to load profile data. Please try again later.");
          }
          return;
        }

        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Failed to load profile data");
          return;
        }

        // Log the student data for debugging
        console.log("Student data:", data.student);
        console.log("Salutation:", data.student.salutation)
console.log("Education data:", data.student.education)
console.log("Available fields:", Object.keys(data.student))
// Remove middleName from lastName if it exists there
if (data.student.middleName && data.student.lastName) {
  if (data.student.lastName.includes(data.student.middleName)) {
    data.student.lastName = data.student.lastName.replace(data.student.middleName, "").trim()
  }
}
        // Format date if it exists
        if (data.student.dob) {
          try {
            const date = new Date(data.student.dob);
            if (!isNaN(date.getTime())) {
              data.student.dob = date.toISOString().split("T")[0];
            }
          } catch (e) {
            console.error("Error formatting date:", e);
          }
        }

        // Ensure experience data is properly structured
    // Ensure experience data is properly structured using helper function
const experienceArray = getExperienceArray(data.student)
if (experienceArray && Array.isArray(experienceArray)) {
  data.student.experience = experienceArray.map((exp: any) => {
    return {
      ...exp,
      currentlyWorking: exp.currentlyWorking === true || exp.currentlyWorking === "true",
      location: exp.location || "",
      department: exp.department || "",
      tenure: exp.tenure || "",
      professionalSummary: exp.professionalSummary || exp.summary || "",
    }
  })
} else {
  data.student.experience = []
}

// Format date if it exists - use helper function
const dobValue = getDateOfBirth(data.student)
if (dobValue) {
  try {
    const date = new Date(dobValue)
    if (!isNaN(date.getTime())) {
      data.student.dob = date.toISOString().split("T")[0]
    }
  } catch (e) {
    console.error("Error formatting date:", e)
  }
}

// Ensure preferred cities are properly set using helper function
const preferredCities = getPreferredCities(data.student)
data.student.preferenceCities = preferredCities

// Ensure shift preference is properly formatted
if (Array.isArray(data.student.shiftPreference)) {
  // It's already an array, keep it as is
} else if (typeof data.student.shiftPreference === "string" && data.student.shiftPreference) {
  // If it's a string, convert to array with single item
  data.student.shiftPreference = [data.student.shiftPreference]
} else {
  // If it's undefined or null, initialize as empty array
  data.student.shiftPreference = []
}

// Ensure documents are properly mapped using helper function
const documents = getDocuments(data.student)
data.student.documents = {
  resume: documents.resume.url ? documents.resume : undefined,
  videoResume: documents.videoResume.url ? documents.videoResume : undefined,
  audioBiodata: documents.audioBiodata.url ? documents.audioBiodata : undefined,
  photograph: documents.photograph.url ? documents.photograph : undefined,
}

// Ensure avatar is set from various sources
if (!data.student.avatar) {
  data.student.avatar = documents.photograph.url
}

// Ensure assets are properly structured
if (!data.student.assets) {
  data.student.assets = {}
}

// Map available assets to assets structure if needed
if (data.student.availableAssets && Array.isArray(data.student.availableAssets)) {
  data.student.availableAssets.forEach((asset: string) => {
    if (asset.toLowerCase().includes("bike") || asset.toLowerCase().includes("car")) {
      data.student.assets!.bike = true
    }
    if (asset.toLowerCase().includes("wifi")) {
      data.student.assets!.wifi = true
    }
    if (asset.toLowerCase().includes("laptop")) {
      data.student.assets!.laptop = true
    }
  })
}

// Map identity documents to assets structure if needed
if (data.student.identityDocuments && Array.isArray(data.student.identityDocuments)) {
  data.student.identityDocuments.forEach((doc: string) => {
    if (doc.toLowerCase().includes("pan")) {
      data.student.assets!.panCard = true
    }
    if (doc.toLowerCase().includes("aadhar")) {
      data.student.assets!.aadhar = true
    }
    if (doc.toLowerCase().includes("bank")) {
      data.student.assets!.bankAccount = true
    }
    if (
      doc.toLowerCase().includes("voter") ||
      doc.toLowerCase().includes("passport") ||
      doc.toLowerCase().includes("dl")
    ) {
      data.student.assets!.idProof = true
    }
  })
}

        // Ensure education data is properly structured
if (data.student.education && Array.isArray(data.student.education)) {
  data.student.education = data.student.education.map((edu: any) => {
    return {
      ...edu,
      institution: edu.institution || edu.school || edu.college || "",
      level: edu.level || edu.educationLevel || "",
      mode: edu.mode || edu.modeOfEducation || "regular",
      percentage: edu.percentage || edu.grade || edu.marks || "",
      startingYear: edu.startingYear || edu.fromYear || "",
      endingYear: edu.endingYear || edu.toYear || "",
      degree: edu.degree || edu.course || edu.qualification || "",
      field: edu.field || edu.specialization || edu.stream || "",
    }
  })
} else {
  data.student.education = []
}
// Ensure salutation is properly set
data.student.salutation = data.student.salutation || data.student.title || ""

// Ensure gender is properly set (case-insensitive)
if (data.student.gender) {
  data.student.gender = data.student.gender.toLowerCase()
}

        // Ensure shift preference is properly formatted
        if (Array.isArray(data.student.shiftPreference)) {
          // It's already an array, keep it as is
        } else if (
          typeof data.student.shiftPreference === "string" &&
          data.student.shiftPreference
        ) {
          // If it's a string, convert to array with single item
          data.student.shiftPreference = [data.student.shiftPreference];
        } else {
          // If it's undefined or null, initialize as empty array
          data.student.shiftPreference = [];
        }

        // Ensure gender is properly set
        data.student.gender = data.student.gender || "";

        setStudentData(data.student);
        setFormData(data.student);
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    // Just change the tab without submitting the form
    setActiveTab(tab);
    // Reset success message when changing tabs
    setSuccess(null);
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
   setFormData((prev) => {
  if (!prev) return prev;
  const parentValue = prev[parent as keyof StudentData];
  const existingObject = (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) 
    ? parentValue as Record<string, any>
    : {};
  
  return {
    ...prev,
    [parent]: {
      ...existingObject,
      [child]: value,
    },
  };
});
    } else {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: value,
        };
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => {
  if (!prev) return prev;
  const parentValue = prev[parent as keyof StudentData];
  const existingObject = (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) 
    ? parentValue as Record<string, any>
    : {};
  
  return {
    ...prev,
    [parent]: {
      ...existingObject,
      [child]: checked,
    },
  };
});
    } else {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: checked,
        };
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => {
  if (!prev) return prev;
  const parentValue = prev[parent as keyof StudentData];
  const existingObject = (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) 
    ? parentValue as Record<string, any>
    : {};
  
  return {
    ...prev,
    [parent]: {
      ...existingObject,
      [child]: value,
    },
  };
});
    } else {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: value,
        };
      });
    }
  };

  // Handle skills
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;

    setFormData((prev) => {
      if (!prev) return prev;
      const skills = prev.skills || [];
      if (skills.includes(newSkill.trim())) {
        toast.error("Skill already exists");
        return prev;
      }
      return {
        ...prev,
        skills: [...skills, newSkill.trim()],
      };
    });

    setNewSkill("");
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => {
      if (!prev || !prev.skills) return prev;
      return {
        ...prev,
        skills: prev.skills.filter((s) => s !== skill),
      };
    });
  };

  // Handle certifications
  const handleAddCertification = () => {
    if (!newCertification.trim()) return;

    setFormData((prev) => {
      if (!prev) return prev;
      const certifications = prev.certifications || [];

      // Check if certification already exists
      if (Array.isArray(certifications)) {
        if (typeof certifications[0] === "string") {
          if ((certifications as string[]).includes(newCertification.trim())) {
            toast.error("Certification already exists");
            return prev;
          }
          return {
            ...prev,
            certifications: [
              ...(certifications as string[]),
              newCertification.trim(),
            ],
          };
        } else {
          if (
            (certifications as Array<{ name: string }>).some(
              (cert) => cert.name === newCertification.trim()
            )
          ) {
            toast.error("Certification already exists");
            return prev;
          }
          return {
            ...prev,
            certifications: [
              ...(certifications as Array<{ name: string }>),
              { name: newCertification.trim() },
            ],
          };
        }
      }

      // Default to string array if certifications is empty
      return {
        ...prev,
        certifications: [newCertification.trim()],
      };
    });

    setNewCertification("");
  };

  const handleRemoveCertification = (certification: string) => {
    setFormData((prev) => {
      if (!prev || !prev.certifications) return prev;

      if (Array.isArray(prev.certifications)) {
        if (typeof prev.certifications[0] === "string") {
          return {
            ...prev,
            certifications: (prev.certifications as string[]).filter(
              (c) => c !== certification
            ),
          };
        } else {
          return {
            ...prev,
            certifications: (
              prev.certifications as Array<{ name: string }>
            ).filter((c) => c.name !== certification),
          };
        }
      }

      return prev;
    });
  };

  // Handle preference cities
  const handleAddPreferenceCity = () => {
    if (!newPreferenceCity.trim()) return;

    setFormData((prev) => {
      if (!prev) return prev;
      const preferenceCities = prev.preferenceCities || [];

      if (preferenceCities.includes(newPreferenceCity.trim())) {
        toast.error("City already added");
        return prev;
      }

      if (preferenceCities.length >= 5) {
        toast.error("Maximum 5 preferred cities allowed");
        return prev;
      }

      return {
        ...prev,
        preferenceCities: [...preferenceCities, newPreferenceCity.trim()],
      };
    });

    setNewPreferenceCity("");
  };

  const handleRemovePreferenceCity = (city: string) => {
    setFormData((prev) => {
      if (!prev || !prev.preferenceCities) return prev;
      return {
        ...prev,
        preferenceCities: prev.preferenceCities.filter((c) => c !== city),
      };
    });
  };

  // Handle education
  const handleAddEducation = () => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        education: [
          ...(prev.education || []),
          {
            degree: "",
            institution: "",
            startingYear: "",
            endingYear: "",
            percentage: "",
            level: "",
            mode: "",
          },
        ],
      };
    });
  };

  const handleRemoveEducation = (index: number) => {
    setFormData((prev) => {
      if (!prev || !prev.education) return prev;
      return {
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      };
    });
  };

  const handleEducationChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.education) return prev;
      const updatedEducation = [...prev.education];
      updatedEducation[index] = {
        ...updatedEducation[index],
        [field]: value,
      };
      return {
        ...prev,
        education: updatedEducation,
      };
    });
  };

  // Handle experience
  const handleAddExperience = () => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experience: [
          ...(prev.experience || []),
          {
            title: "",
            companyName: "",
            tenure: "",
            currentlyWorking: false,
            location: "",
            department: "",
            professionalSummary: "",
            currentSalary: "",
            expectedSalary: "",
            noticePeriod: "",
          },
        ],
      };
    });
  };

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => {
      if (!prev || !prev.experience) return prev;
      return {
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index),
      };
    });
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      if (!prev || !prev.experience) return prev;
      const updatedExperience = [...prev.experience];
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value,
      };
      return {
        ...prev,
        experience: updatedExperience,
      };
    });
  };

  // Handle shift preference
  const handleShiftPreferenceChange = (value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;

      // Convert to array if it's a string
      let currentPreferences: string[] = [];
      if (typeof prev.shiftPreference === "string") {
        currentPreferences = [prev.shiftPreference];
      } else if (Array.isArray(prev.shiftPreference)) {
        currentPreferences = [...prev.shiftPreference];
      }

      const index = currentPreferences.indexOf(value);

      if (index === -1) {
        return {
          ...prev,
          shiftPreference: [...currentPreferences, value],
        };
      } else {
        currentPreferences.splice(index, 1);
        return {
          ...prev,
          shiftPreference: currentPreferences,
        };
      }
    });
  };

  // Handle assets
  const handleAssetChange = (asset: string, checked: boolean) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assets: {
          ...(prev.assets || {}),
          [asset]: checked,
        },
      };
    });
  };

  // Handle avatar upload
  const handleAvatarEdit = () => {
    setIsEditingAvatar(true);
  };

  const handleAvatarUpload = () => {
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.click();
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      toast.loading("Uploading avatar...");

      // Create form data
      const formData = new FormData();
      formData.append("avatar", file);

      // Send to server
      const response = await fetch("/api/student/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const data = await response.json();

      // Update form data with new avatar URL
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          avatar: data.avatarUrl,
          documents: {
            ...(prev.documents || {}),
            photograph: {
              url: data.avatarUrl,
              uploadDate: new Date().toISOString(),
              name: file.name,
            },
          },
        };
      });

      toast.dismiss();
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.dismiss();
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      setIsEditingAvatar(false);
    }
  };

  const handleCancelAvatarEdit = () => {
    setIsEditingAvatar(false);
  };

  // Handle resume upload
  const handleResumeUpload = () => {
    if (resumeFileInputRef.current) {
      resumeFileInputRef.current.click();
    }
  };

  const handleResumeFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingResume(true);
      toast.loading("Uploading resume...");

      // Create form data
      const formData = new FormData();
      formData.append("resume", file);

      // Send to server
      const response = await fetch("/api/student/profile/resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload resume");
      }

      const data = await response.json();

      // Update form data with new resume URL
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          documents: {
            ...(prev.documents || {}),
            resume: {
              url: data.resumeUrl,
              uploadDate: new Date().toISOString(),
              filename: file.name,
            },
          },
        };
      });

      toast.dismiss();
      toast.success("Resume uploaded successfully");
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.dismiss();
      toast.error("Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Handle video resume upload
  const handleVideoResumeUpload = () => {
    if (videoResumeFileInputRef.current) {
      videoResumeFileInputRef.current.click();
    }
  };

  const handleVideoResumeFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingVideoResume(true);
      toast.loading("Uploading video resume...");

      // Create form data
      const formData = new FormData();
      formData.append("videoResume", file);

      // Send to server
      const response = await fetch("/api/student/profile/video-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video resume");
      }

      const data = await response.json();

      // Update form data with new video resume URL
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          documents: {
            ...(prev.documents || {}),
            videoResume: {
              url: data.videoResumeUrl,
              uploadDate: new Date().toISOString(),
              filename: file.name,
            },
          },
        };
      });

      toast.dismiss();
      toast.success("Video resume uploaded successfully");
    } catch (error) {
      console.error("Error uploading video resume:", error);
      toast.dismiss();
      toast.error("Failed to upload video resume");
    } finally {
      setIsUploadingVideoResume(false);
    }
  };

  // Handle audio biodata upload
  const handleAudioBiodataUpload = () => {
    if (audioBiodataFileInputRef.current) {
      audioBiodataFileInputRef.current.click();
    }
  };

  const handleAudioBiodataFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAudioBiodata(true);
      toast.loading("Uploading audio biodata...");

      // Create form data
      const formData = new FormData();
      formData.append("audioBiodata", file);

      // Send to server
      const response = await fetch("/api/student/profile/audio-biodata", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload audio biodata");
      }

      const data = await response.json();

      // Update form data with new audio biodata URL
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          documents: {
            ...(prev.documents || {}),
            audioBiodata: {
              url: data.audioBiodataUrl,
              uploadDate: new Date().toISOString(),
              filename: file.name,
            },
          },
        };
      });

      toast.dismiss();
      toast.success("Audio biodata uploaded successfully");
    } catch (error) {
      console.error("Error uploading audio biodata:", error);
      toast.dismiss();
      toast.error("Failed to upload audio biodata");
    } finally {
      setIsUploadingAudioBiodata(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!formData) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();

      setSuccess("Profile updated successfully");
      toast.success("Profile updated successfully");

      // Update student data with the latest data
      setStudentData(data.student);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/student/dashboard?tab=profile");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
      setFormSubmitted(false);
    }
  };

  // Helper function to get certification names
  const getCertificationNames = () => {
    if (!formData?.certifications || formData.certifications.length === 0) {
      return [];
    }

    // If certifications is an array of strings, return it directly
    if (typeof formData.certifications[0] === "string") {
      return formData.certifications as string[];
    }

    // If certifications is an array of objects, extract the name property
    return (formData.certifications as Array<{ name: string }>).map(
      (cert) => cert.name
    );
  };

  // Helper function to get formatted name with salutation
const getFormattedName = () => {
  if (!formData) return "";
  return getFullName(formData);
};

  // Helper function to check if shift preference includes a value
  const isShiftPreferenceSelected = (value: string): boolean => {
    if (!formData?.shiftPreference) return false;

    if (typeof formData.shiftPreference === "string") {
      return formData.shiftPreference === value;
    }

    return (
      Array.isArray(formData.shiftPreference) &&
      formData.shiftPreference.includes(value)
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Loading profile data
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was a problem loading your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push("/student/dashboard")}
              >
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              Your session has expired or you are not logged in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-black shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Edit Profile</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/student/dashboard?tab=profile")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                There was an error
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="relative mt-4">
                      <Avatar className="h-32 w-32 mb-4">
                        <AvatarImage
                          src={
                            formData.avatar ||
                            formData.documents?.photograph?.url ||
                            "/placeholder.svg?height=128&width=128" ||
                            "/placeholder.svg"
                          }
                          alt={getFormattedName()}
                        />
                        <AvatarFallback className="text-3xl">
                          {formData.firstName?.charAt(0)}
                          {formData.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {isEditingAvatar ? (
                        <div className="absolute -bottom-2 right-0 flex space-x-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-white"
                            onClick={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                            type="button"
                          >
                            {isUploadingAvatar ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-white"
                            onClick={handleCancelAvatarEdit}
                            disabled={isUploadingAvatar}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <input
                            type="file"
                            ref={avatarFileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                          />
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="outline"
                          className="absolute -bottom-2 right-0 h-8 w-8 rounded-full bg-white"
                          onClick={handleAvatarEdit}
                          type="button"
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-center mt-2">
                      {getFormattedName()}
                    </h3>
                    <p className="text-gray-500 text-center mb-4">
                      {formData.email}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <nav className="space-y-1">
                      <Button
                        variant={activeTab === "personal" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("personal")}
                        type="button"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Personal Information
                      </Button>
                      <Button
                        variant={activeTab === "contact" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("contact")}
                        type="button"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Information
                      </Button>
                      <Button
                        variant={
                          activeTab === "education" ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => handleTabChange("education")}
                        type="button"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Education
                      </Button>
                      <Button
                        variant={
                          activeTab === "experience" ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => handleTabChange("experience")}
                        type="button"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Work Experience
                      </Button>
                      <Button
                        variant={activeTab === "skills" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("skills")}
                        type="button"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Skills & Certifications
                      </Button>
                      <Button
                        variant={
                          activeTab === "preferences" ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => handleTabChange("preferences")}
                        type="button"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Preferences
                      </Button>
                      <Button
                        variant={activeTab === "assets" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange("assets")}
                        type="button"
                      >
                        <Laptop className="h-4 w-4 mr-2" />
                        Assets & Documents
                      </Button>
                      <Button
                        variant={
                          activeTab === "documents" ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => handleTabChange("documents")}
                        type="button"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Upload Documents
                      </Button>
                      {/* <Button
                        variant={
                          activeTab === "additional" ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => handleTabChange("additional")}
                        type="button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Additional Information
                      </Button> */}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === "personal" && "Personal Information"}
                    {activeTab === "contact" && "Contact Information"}
                    {activeTab === "education" && "Education"}
                    {activeTab === "experience" && "Work Experience"}
                    {activeTab === "skills" && "Skills & Certifications"}
                    {activeTab === "preferences" && "Preferences"}
                    {activeTab === "assets" && "Assets & Documents"}
                    {activeTab === "documents" && "Upload Documents"}
                    {/* {activeTab === "additional" && "Additional Information"} */}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "personal" && "Update your personal details"}
                    {activeTab === "contact" &&
                      "Update your contact information and online presence"}
                    {activeTab === "education" &&
                      "Add or update your educational qualifications"}
                    {activeTab === "experience" &&
                      "Add or update your work experience"}
                    {activeTab === "skills" &&
                      "Update your skills and certifications"}
                    {activeTab === "preferences" &&
                      "Set your job preferences and locations"}
                    {activeTab === "assets" &&
                      "Update your available assets and identity documents"}
                    {activeTab === "documents" &&
                      "Upload your resume and other documents"}
                    {/* {activeTab === "additional" &&
                      "Add any additional information or cover letter"} */}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Personal Information Tab */}
                  {activeTab === "personal" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="salutation">Salutation</Label>
                          <select
                            id="salutation"
                            name="salutation"
                            value={formData.salutation || ""}
                            onChange={handleSelectChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select salutation</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Dr.">Dr.</option>
                            <option value="Prof.">Prof.</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName || ""}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input
                            id="middleName"
                            name="middleName"
                            value={formData.middleName || ""}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName || ""}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender || ""}
                            onChange={handleSelectChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          name="dob"
                          type="date"
                          value={formData.dob || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <Label htmlFor="profileOutline">Profile Summary</Label>
                        <Textarea
                          id="profileOutline"
                          name="profileOutline"
                          value={formData.profileOutline || ""}
                          onChange={handleInputChange}
                          placeholder="Write a brief summary about yourself, your skills, and your career goals"
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Contact Information Tab */}
                  {activeTab === "contact" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={handleInputChange}
                            required
                            disabled
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Email cannot be changed
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone || ""}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="alternativePhone">
                          Alternative Phone Number
                        </Label>
                        <Input
                          id="alternativePhone"
                          name="alternativePhone"
                          value={formData.alternativePhone || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="currentCity">Current City</Label>
                          <Input
                            id="currentCity"
                            name="currentCity"
                            value={formData.currentCity || ""}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div>
                          <Label htmlFor="currentState">Current State</Label>
                          <Input
                            id="currentState"
                            name="currentState"
                            value={formData.currentState || ""}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            name="pincode"
                            value={formData.pincode || ""}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* <div>
                        <Label htmlFor="permanentAddress">Permanent Address</Label>
                        <Textarea
                          id="permanentAddress"
                          name="permanentAddress"
                          value={formData.permanentAddress || ""}
                          onChange={handleInputChange}
                          className="min-h-[80px]"
                        />
                      </div> */}

                      <Separator />

                      <h3 className="text-lg font-medium">Online Presence</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* <div>
                          <Label htmlFor="onlinePresence.linkedin">LinkedIn Profile</Label>
                          <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="onlinePresence.linkedin"
                              name="onlinePresence.linkedin"
                              value={formData.onlinePresence?.linkedin || formData.linkedIn || ""}
                              onChange={handleInputChange}
                              placeholder="https://linkedin.com/in/yourprofile"
                              className="pl-10"
                            />
                          </div>
                        </div> */}

                        <div>
                          <Label htmlFor="onlinePresence.portfolio">
                            Portfolio Website
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="onlinePresence.portfolio"
                              name="onlinePresence.portfolio"
                              value={
                                formData.onlinePresence?.portfolio ||
                                formData.portfolioLink ||
                                ""
                              }
                              onChange={handleInputChange}
                              placeholder="https://yourportfolio.com"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* <div>
                          <Label htmlFor="onlinePresence.github">GitHub Profile</Label>
                          <div className="relative">
                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="onlinePresence.github"
                              name="onlinePresence.github"
                              value={formData.onlinePresence?.github || ""}
                              onChange={handleInputChange}
                              placeholder="https://github.com/yourusername"
                              className="pl-10"
                            />
                          </div>
                        </div> */}

                        <div>
                          <Label htmlFor="onlinePresence.socialMedia">
                            Social Media
                          </Label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex space-x-1">
                              <Share2 className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              id="onlinePresence.socialMedia"
                              name="onlinePresence.socialMedia"
                              value={
                                formData.onlinePresence?.socialMedia ||
                                formData.socialMediaLink ||
                                ""
                              }
                              onChange={handleInputChange}
                              placeholder="https://twitter.com/yourusername"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education Tab */}
                  {activeTab === "education" && (
                    <div className="space-y-6">
                      {formData.education && formData.education.length > 0 ? (
                        <div className="space-y-6">
                          {formData.education.map((edu, index) => (
                            <Card key={index} className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveEducation(index)}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              <CardContent className="p-4 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`education-${index}-level`}>
                                      Education Level
                                    </Label>
                                    <select
                                      id={`education-${index}-level`}
                                      value={edu.level || ""}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "level",
                                          e.target.value
                                        )
                                      }
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="">Select level</option>
                                      <option value="high_school">
                                        High School
                                      </option>
                                      <option value="intermediate">
                                        Intermediate
                                      </option>
                                      <option value="bachelors">
                                        Bachelor's Degree
                                      </option>
                                      <option value="masters">
                                        Master's Degree
                                      </option>
                                      <option value="phd">PhD</option>
                                      <option value="diploma">Diploma</option>
                                      <option value="certificate">
                                        Certificate
                                      </option>
                                    </select>
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor={`education-${index}-degree`}
                                    >
                                      Degree/Course *
                                    </Label>
                                    <Input
                                      id={`education-${index}-degree`}
                                      value={edu.degree || ""}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "degree",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., B.Tech in Computer Science"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <Label
                                    htmlFor={`education-${index}-institution`}
                                  >
                                    School/College/University *
                                  </Label>
                                  <Input
                                    id={`education-${index}-institution`}
                                    value={edu.institution || edu.school || ""}
                                    onChange={(e) =>
                                      handleEducationChange(
                                        index,
                                        "institution",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., MIT"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <Label
                                      htmlFor={`education-${index}-startingYear`}
                                    >
                                      Starting Year *
                                    </Label>
                                    <Input
                                      id={`education-${index}-startingYear`}
                                      value={edu.startingYear || ""}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "startingYear",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., 2018"
                                      required
                                    />
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor={`education-${index}-endingYear`}
                                    >
                                      Ending Year
                                    </Label>
                                    <Input
                                      id={`education-${index}-endingYear`}
                                      value={edu.endingYear || ""}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "endingYear",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., 2022 or Present"
                                    />
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor={`education-${index}-percentage`}
                                    >
                                      Percentage/CGPA
                                    </Label>
                                    <Input
                                      id={`education-${index}-percentage`}
                                      value={edu.percentage || edu.grade || ""}
                                      onChange={(e) =>
                                        handleEducationChange(
                                          index,
                                          "percentage",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., 85% or 8.5"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`education-${index}-mode`}>
                                    Mode of Education
                                  </Label>
                                  <select
                                    id={`education-${index}-mode`}
                                    value={edu.mode || ""}
                                    onChange={(e) =>
                                      handleEducationChange(
                                        index,
                                        "mode",
                                        e.target.value
                                      )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <option value="">Select mode</option>
                                    <option value="regular">Regular</option>
                                    <option value="distance">Distance</option>
                                    <option value="open_schooling">
                                      Open Schooling
                                    </option>
                                    <option value="part_time">Part Time</option>
                                  </select>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg">
                          <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No education details added
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Add your educational qualifications to improve your
                            profile
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleAddEducation}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                  )}

                  {/* Experience Tab */}
                  {activeTab === "experience" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="totalExperience">
                            Total Professional Experience (in years)
                          </Label>
                          <Input
                            id="totalExperience"
                            name="totalExperience"
                            value={formData.totalExperience || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., 5 years"
                          />
                        </div>

                        <div>
                          <Label htmlFor="currentSalary">Current Salary (per annum)</Label>
                          <Input
                            id="currentSalary"
                            name="currentSalary"
                            value={formData.currentSalary || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., ₹8,00,000 per annum"
                          />
                        </div>

                        <div>
                          <Label htmlFor="expectedSalary">
                           Expected Salary (per annum)
                          </Label>
                          <Input
                            id="expectedSalary"
                            name="expectedSalary"
                            value={formData.expectedSalary || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., ₹10,00,000 per annum"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="noticePeriod">Notice Period (in days)</Label>
                          <Input
                            id="noticePeriod"
                            name="noticePeriod"
                            value={formData.noticePeriod || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., 30 days"
                          />
                        </div>
                      </div>

                      <Separator />

                      <h3 className="text-lg font-medium">
                        Work Experience Details
                      </h3>

                      {formData.experience && formData.experience.length > 0 ? (
                        <div className="space-y-6">
                          {formData.experience.map((exp, index) => (
                            <Card key={index} className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveExperience(index)}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              <CardContent className="p-4 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <Label
                                      htmlFor={`experience-${index}-title`}
                                    >
                                      Title/Designation *
                                    </Label>
                                    <Input
                                      id={`experience-${index}-title`}
                                      value={exp.title || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., Software Engineer"
                                      required
                                    />
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor={`experience-${index}-companyName`}
                                    >
                                      Company Name *
                                    </Label>
                                    <Input
                                      id={`experience-${index}-companyName`}
                                      value={exp.companyName || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "companyName",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., Google"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <Label
                                      htmlFor={`experience-${index}-department`}
                                    >
                                      Department
                                    </Label>
                                    <Input
                                      id={`experience-${index}-department`}
                                      value={exp.department || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "department",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., Engineering"
                                    />
                                  </div>
                                  <div className="mb-4">
                                    <Label
                                      htmlFor={`experience-${index}-tenure`}
                                    >
                                      Tenure *
                                    </Label>
                                    <Input
                                      id={`experience-${index}-tenure`}
                                      value={exp.tenure || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "tenure",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., 2 years 3 months"
                                      required
                                    />
                                  </div>

                                  {/* <div>
                                    <Label htmlFor={`experience-${index}-location`}>Location</Label>
                                    <Input
                                      id={`experience-${index}-location`}
                                      value={exp.location || ""}
                                      onChange={(e) => handleExperienceChange(index, "location", e.target.value)}
                                      placeholder="e.g., Bangalore"
                                    />
                                  </div> */}
                                </div>

                                {/* <div className="flex items-center space-x-2 mb-4">
                                  <Checkbox
                                    id={`experience-${index}-currentlyWorking`}
                                    checked={exp.currentlyWorking || false}
                                    onCheckedChange={(checked) =>
                                      handleExperienceChange(index, "currentlyWorking", checked === true)
                                    }
                                  />
                                  <Label htmlFor={`experience-${index}-currentlyWorking`}>Currently Working Here</Label>
                                </div> */}

                                <div className="mb-4">
                                  <Label
                                    htmlFor={`experience-${index}-professionalSummary`}
                                  >
                                    Professional Summary
                                  </Label>
                                  <Textarea
                                    id={`experience-${index}-professionalSummary`}
                                    value={
                                      exp.professionalSummary ||
                                      exp.summary ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleExperienceChange(
                                        index,
                                        "professionalSummary",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Describe your responsibilities and achievements"
                                    className="min-h-[100px]"
                                  />
                                </div>

                                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label
                                      htmlFor={`experience-${index}-currentSalary`}
                                    >
                                      Current Salary
                                    </Label>
                                    <Input
                                      id={`experience-${index}-currentSalary`}
                                      value={exp.currentSalary || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "currentSalary",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., ₹8,00,000 per annum"
                                    />
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor={`experience-${index}-expectedSalary`}
                                    >
                                      Expected Salary
                                    </Label>
                                    <Input
                                      id={`experience-${index}-expectedSalary`}
                                      value={exp.expectedSalary || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "expectedSalary",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., ₹10,00,000 per annum"
                                    />
                                  </div>

                                  <div>
                                    <Label
                                      htmlFor={`experience-${index}-noticePeriod`}
                                    >
                                      Notice Period
                                    </Label>
                                    <Input
                                      id={`experience-${index}-noticePeriod`}
                                      value={exp.noticePeriod || ""}
                                      onChange={(e) =>
                                        handleExperienceChange(
                                          index,
                                          "noticePeriod",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g., 30 days"
                                    />
                                  </div>
                                </div> */}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg">
                          <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No work experience added
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Add your work experience to improve your profile
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleAddExperience}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Work Experience
                      </Button>
                    </div>
                  )}

                  {/* Skills & Certifications Tab */}
                  {activeTab === "skills" && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="skills">Skills / Technologies</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.skills && formData.skills.length > 0 ? (
                            formData.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {skill}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() => handleRemoveSkill(skill)}
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No skills added yet
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="newSkill"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill (e.g., JavaScript, Project Management)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddSkill}>
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Press Enter or click Add to add a skill
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="certifications">Certifications</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getCertificationNames().length > 0 ? (
                            getCertificationNames().map((cert, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {cert}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() =>
                                    handleRemoveCertification(cert)
                                  }
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No certifications added yet
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="newCertification"
                            value={newCertification}
                            onChange={(e) =>
                              setNewCertification(e.target.value)
                            }
                            placeholder="Add a certification (e.g., AWS Certified Developer)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCertification();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={handleAddCertification}
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Press Enter or click Add to add a certification
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === "preferences" && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="shiftPreference">
                          Shift Preference
                        </Label>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="shift-day"
                              checked={isShiftPreferenceSelected("day")}
                              onCheckedChange={() =>
                                handleShiftPreferenceChange("day")
                              }
                            />
                            <Label htmlFor="shift-day" className="font-normal">
                              Day Shift
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="shift-night"
                              checked={isShiftPreferenceSelected("night")}
                              onCheckedChange={() =>
                                handleShiftPreferenceChange("night")
                              }
                            />
                            <Label
                              htmlFor="shift-night"
                              className="font-normal"
                            >
                              Night Shift
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="shift-flexible"
                              checked={isShiftPreferenceSelected("flexible")}
                              onCheckedChange={() =>
                                handleShiftPreferenceChange("flexible")
                              }
                            />
                            <Label
                              htmlFor="shift-flexible"
                              className="font-normal"
                            >
                              Flexible
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="preferenceCities">
                          Preferred Cities (Max 5)
                        </Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.preferenceCities &&
                          formData.preferenceCities.length > 0 ? (
                            formData.preferenceCities.map((city, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {city}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() =>
                                    handleRemovePreferenceCity(city)
                                  }
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No preferred cities added yet
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="newPreferenceCity"
                            value={newPreferenceCity}
                            onChange={(e) =>
                              setNewPreferenceCity(e.target.value)
                            }
                            placeholder="Add a preferred city (e.g., Bangalore)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddPreferenceCity();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={handleAddPreferenceCity}
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Press Enter or click Add to add a preferred city
                          (maximum 5)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Assets & Documents Tab */}
                  {activeTab === "assets" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Available Assets
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.bike"
                              checked={formData.assets?.bike || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange("bike", checked === true)
                              }
                            />
                            <Label htmlFor="assets.bike">Bike / Car</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.wifi"
                              checked={formData.assets?.wifi || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange("wifi", checked === true)
                              }
                            />
                            <Label htmlFor="assets.wifi">WiFi</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.laptop"
                              checked={formData.assets?.laptop || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange("laptop", checked === true)
                              }
                            />
                            <Label htmlFor="assets.laptop">Laptop</Label>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Identity Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.panCard"
                              checked={formData.assets?.panCard || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange("panCard", checked === true)
                              }
                            />
                            <Label htmlFor="assets.panCard">PAN Card</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.aadhar"
                              checked={formData.assets?.aadhar || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange("aadhar", checked === true)
                              }
                            />
                            <Label htmlFor="assets.aadhar">Aadhar</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.bankAccount"
                              checked={formData.assets?.bankAccount || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange(
                                  "bankAccount",
                                  checked === true
                                )
                              }
                            />
                            <Label htmlFor="assets.bankAccount">
                              Bank Account
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="assets.idProof"
                              checked={formData.assets?.idProof || false}
                              onCheckedChange={(checked) =>
                                handleAssetChange("idProof", checked === true)
                              }
                            />
                            <Label htmlFor="assets.idProof">
                              Voter ID / Passport / DL (Any)
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Documents Tab */}
                  {activeTab === "documents" && (
                    <div className="space-y-6">
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-gray-500" />
                            <div>
                              <h4 className="font-medium">Resume</h4>
                              <p className="text-sm text-gray-500">
                                Upload your latest resume (PDF, DOC, DOCX)
                              </p>
                            </div>
                          </div>

                          {formData.documents?.resume?.url ? (
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={formData.documents.resume.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResumeUpload}
                                disabled={isUploadingResume}
                                type="button"
                              >
                                {isUploadingResume ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Replace
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResumeUpload}
                              disabled={isUploadingResume}
                              type="button"
                            >
                              {isUploadingResume ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          )}

                          <input
                            type="file"
                            ref={resumeFileInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeFileChange}
                          />
                        </div>

                        {formData.documents?.resume?.url && (
                          <div className="text-sm text-gray-500">
                            <p>
                              Filename:{" "}
                              {formData.documents.resume.filename ||
                                "resume.pdf"}
                            </p>
                            <p>
                              Uploaded:{" "}
                              {formData.documents.resume.uploadDate
                                ? new Date(
                                    formData.documents.resume.uploadDate
                                  ).toLocaleDateString()
                                : "Recently"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center">
                            <Video className="h-5 w-5 mr-2 text-gray-500" />
                            <div>
                              <h4 className="font-medium">
                                Video Resume (Optional)
                              </h4>
                              <p className="text-sm text-gray-500">
                                Upload a short video introduction (MP4, MOV,
                                AVI)
                              </p>
                            </div>
                          </div>

                          {formData.documents?.videoResume?.url ? (
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={formData.documents.videoResume.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleVideoResumeUpload}
                                disabled={isUploadingVideoResume}
                                type="button"
                              >
                                {isUploadingVideoResume ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Replace
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleVideoResumeUpload}
                              disabled={isUploadingVideoResume}
                              type="button"
                            >
                              {isUploadingVideoResume ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          )}

                          <input
                            type="file"
                            ref={videoResumeFileInputRef}
                            className="hidden"
                            accept=".mp4,.mov,.avi"
                            onChange={handleVideoResumeFileChange}
                          />
                        </div>

                        {formData.documents?.videoResume?.url && (
                          <div className="text-sm text-gray-500">
                            <p>
                              Filename:{" "}
                              {formData.documents.videoResume.filename ||
                                "video_resume.mp4"}
                            </p>
                            <p>
                              Uploaded:{" "}
                              {formData.documents.videoResume.uploadDate
                                ? new Date(
                                    formData.documents.videoResume.uploadDate
                                  ).toLocaleDateString()
                                : "Recently"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-gray-500" />
                            <div>
                              <h4 className="font-medium">
                                Audio Biodata (Optional)
                              </h4>
                              <p className="text-sm text-gray-500">
                                Upload an audio introduction (MP3, WAV)
                              </p>
                            </div>
                          </div>

                          {formData.documents?.audioBiodata?.url ? (
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={formData.documents.audioBiodata.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Listen
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAudioBiodataUpload}
                                disabled={isUploadingAudioBiodata}
                                type="button"
                              >
                                {isUploadingAudioBiodata ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Replace
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAudioBiodataUpload}
                              disabled={isUploadingAudioBiodata}
                              type="button"
                            >
                              {isUploadingAudioBiodata ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          )}

                          <input
                            type="file"
                            ref={audioBiodataFileInputRef}
                            className="hidden"
                            accept=".mp3,.wav"
                            onChange={handleAudioBiodataFileChange}
                          />
                        </div>

                        {formData.documents?.audioBiodata?.url && (
                          <div className="text-sm text-gray-500">
                            <p>
                              Filename:{" "}
                              {formData.documents.audioBiodata.filename ||
                                "audio_biodata.mp3"}
                            </p>
                            <p>
                              Uploaded:{" "}
                              {formData.documents.audioBiodata.uploadDate
                                ? new Date(
                                    formData.documents.audioBiodata.uploadDate
                                  ).toLocaleDateString()
                                : "Recently"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Information Tab */}
                  {/* {activeTab === "additional" && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="coverLetter">Cover Letter</Label>
                        <Textarea
                          id="coverLetter"
                          name="coverLetter"
                          value={formData.coverLetter || ""}
                          onChange={handleInputChange}
                          placeholder="Write a general cover letter that can be used for job applications"
                          className="min-h-[200px]"
                        />
                      </div>

                      <div>
                        <Label htmlFor="additionalInfo">
                          Additional Information
                        </Label>
                        <Textarea
                          id="additionalInfo"
                          name="additionalInfo"
                          value={formData.additionalInfo || ""}
                          onChange={handleInputChange}
                          placeholder="Any additional information you would like to share with employers"
                          className="min-h-[150px]"
                        />
                      </div>
                    </div>
                  )} */}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/student/dashboard?tab=profile")
                    }
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || formSubmitted}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
