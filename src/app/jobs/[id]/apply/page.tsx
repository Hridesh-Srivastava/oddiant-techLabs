"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Briefcase, Plus, X, UserRound } from "lucide-react"
import { toast, Toaster } from "sonner"
import { use } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import SignIn from "./sign-in"

export default function JobApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params)
  const router = useRouter()
  const jobId = resolvedParams.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")
  const [preferredCities, setPreferredCities] = useState<string[]>([])
  const [currentCity, setCurrentCity] = useState("")
  const [showSignIn, setShowSignIn] = useState(false)

  const [departments, setDepartments] = useState([
    "Business & Strategy",
    "Human Resources (HR) / Recruiter",
    "Finance & Accounting",
    "Marketing & Communications",
    "Sales & Business Development",
    "Information Technology (IT)",
    "Engineering & Production",
    "Research & Development (R&D)",
    "Operations",
    "Customer Success",
    "Legal & Compliance",
    "Administrative / Office Management",
  ])

  const [cities, setCities] = useState<{ city: string; state: string }[]>([])
  const [filteredCities, setFilteredCities] = useState<{ city: string; state: string }[]>([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [citySearchTerm, setCitySearchTerm] = useState("")

  const [degrees, setDegrees] = useState<string[]>([])
  const [filteredDegrees, setFilteredDegrees] = useState<string[]>([])
  const [activeDegreeDropdownIndex, setActiveDegreeDropdownIndex] = useState<number | null>(null)
  const [degreeSearchTerms, setDegreeSearchTerms] = useState<string[]>([""])

  const [formData, setFormData] = useState({
    // Personal Information
    salutation: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    alternativePhone: "",
    dateOfBirth: "",
    gender: "",
    currentCity: "",
    currentState: "",
    pincode: "",
    profileOutline: "",

    // Education
    education: [
      {
        level: "",
        mode: "",
        degree: "",
        institution: "",
        startYear: "",
        endYear: "",
        percentage: "",
      },
    ],
    certifications: [] as string[],

    // Experience
    totalExperience: "",
    // Moved these fields outside of individual work experience entries
    currentSalary: "",
    expectedSalary: "",
    noticePeriod: "",
    workExperience: [
      {
        title: "",
        department: "",
        companyName: "",
        tenure: "",
        summary: "",
      },
    ],
    shiftPreference: [] as string[],
    preferredCities: [] as string[],

    // Assets & Documents
    availableAssets: [] as string[],
    identityDocuments: [] as string[],

    // Additional
    skills: [] as string[],
    portfolioLink: "",
    socialMediaLink: "",

    // Documents
    resumeUrl: "",
    videoResumeUrl: "",
    audioBiodataUrl: "",
    photographUrl: "",

    // Original fields
    linkedIn: "",
    coverLetter: "",
    additionalInfo: "",
  })

  const [selectedFiles, setSelectedFiles] = useState({
    resume: null as File | null,
    videoResume: null as File | null,
    audioBiodata: null as File | null,
    photograph: null as File | null,
  })

  const [uploadedUrls, setUploadedUrls] = useState({
    resumeUrl: "",
    videoResumeUrl: "",
    audioBiodataUrl: "",
    photographUrl: "",
  })

  const [isUploading, setIsUploading] = useState(false)

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/jobs/${jobId}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data.job)
        }
      } catch (error) {
        console.error("Error fetching job:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  // Initialize cities and states data
  useEffect(() => {
    const citiesData = [
      {
        city: "Port Blair",
        state: "Andaman and Nicobar Islands",
      },
      {
        city: "Adoni",
        state: "Andhra Pradesh",
      },
      {
        city: "Amaravati",
        state: "Andhra Pradesh",
      },
      {
        city: "Anantapur",
        state: "Andhra Pradesh",
      },
      {
        city: "Chandigarh",
        state: "Chandigarh",
      },
      {
        city: "Bhilai",
        state: "Chhattisgarh",
      },
      {
        city: "Bilaspur",
        state: "Chhattisgarh",
      },
      {
        city: "Durg",
        state: "Chhattisgarh",
      },
      {
        city: "Raipur",
        state: "Chhattisgarh",
      },
      {
        city: "Silvassa",
        state: "Dadra and Nagar Haveli",
      },
      {
        city: "Daman",
        state: "Daman and Diu",
      },
      {
        city: "Diu",
        state: "Daman and Diu",
      },
      {
        city: "Delhi",
        state: "Delhi",
      },
      {
        city: "Mapusa",
        state: "Goa",
      },
      {
        city: "Margao",
        state: "Goa",
      },
      {
        city: "Panaji",
        state: "Goa",
      },
      {
        city: "Ahmedabad",
        state: "Gujarat",
      },
      {
        city: "Bhavnagar",
        state: "Gujarat",
      },
      {
        city: "Gandhinagar",
        state: "Gujarat",
      },
      {
        city: "Jamnagar",
        state: "Gujarat",
      },
      {
        city: "Junagadh",
        state: "Gujarat",
      },
      {
        city: "Rajkot",
        state: "Gujarat",
      },
      {
        city: "Surat",
        state: "Gujarat",
      },
      {
        city: "Vadodara",
        state: "Gujarat",
      },
      {
        city: "Ambala",
        state: "Haryana",
      },
      {
        city: "Faridabad",
        state: "Haryana",
      },
      {
        city: "Gurgaon",
        state: "Haryana",
      },
      {
        city: "Hisar",
        state: "Haryana",
      },
      {
        city: "Karnal",
        state: "Haryana",
      },
      {
        city: "Kurukshetra",
        state: "Haryana",
      },
      {
        city: "Panipat",
        state: "Haryana",
      },
      {
        city: "Panchkula",
        state: "Haryana",
      },
      {
        city: "Rohtak",
        state: "Haryana",
      },
      {
        city: "Yamunanagar",
        state: "Haryana",
      },
      {
        city: "Bilaspur",
        state: "Himachal Pradesh",
      },
      {
        city: "Dharamshala",
        state: "Himachal Pradesh",
      },
      {
        city: "Hamirpur",
        state: "Himachal Pradesh",
      },
      {
        city: "Kangra",
        state: "Himachal Pradesh",
      },
      {
        city: "Kullu",
        state: "Himachal Pradesh",
      },
      {
        city: "Mandi",
        state: "Himachal Pradesh",
      },
      {
        city: "Shimla",
        state: "Himachal Pradesh",
      },
      {
        city: "Solan",
        state: "Himachal Pradesh",
      },
      {
        city: "Sundernagar",
        state: "Himachal Pradesh",
      },
      {
        city: "Anantnag",
        state: "Jammu and Kashmir",
      },
      {
        city: "Baramulla",
        state: "Jammu and Kashmir",
      },
      {
        city: "Jammu",
        state: "Jammu and Kashmir",
      },
      {
        city: "Kathua",
        state: "Jammu and Kashmir",
      },
      {
        city: "Punch",
        state: "Jammu and Kashmir",
      },
      {
        city: "Rajouri",
        state: "Jammu and Kashmir",
      },
      {
        city: "Sopore",
        state: "Jammu and Kashmir",
      },
      {
        city: "Srinagar",
        state: "Jammu and Kashmir",
      },
      {
        city: "Bokaro Steel City",
        state: "Jharkhand",
      },
      {
        city: "Chaibasa",
        state: "Jharkhand",
      },
      {
        city: "Deoghar",
        state: "Jharkhand",
      },
      {
        city: "Dhanbad",
        state: "Jharkhand",
      },
      {
        city: "Dumka",
        state: "Jharkhand",
      },
      {
        city: "Giridih",
        state: "Jharkhand",
      },
      {
        city: "Hazaribagh",
        state: "Jharkhand",
      },
      {
        city: "Jamshedpur",
        state: "Jharkhand",
      },
      {
        city: "Ranchi",
        state: "Jharkhand",
      },
      {
        city: "Bagalkot",
        state: "Karnataka",
      },
      {
        city: "Ballari",
        state: "Karnataka",
      },
      {
        city: "Belagavi",
        state: "Karnataka",
      },
      {
        city: "Bengaluru",
        state: "Karnataka",
      },
      {
        city: "Bidar",
        state: "Karnataka",
      },
      {
        city: "Chikkamagaluru",
        state: "Karnataka",
      },
      {
        city: "Davanagere",
        state: "Karnataka",
      },
      {
        city: "Dharwad",
        state: "Karnataka",
      },
      {
        city: "Gulbarga",
        state: "Karnataka",
      },
      {
        city: "Hassan",
        state: "Karnataka",
      },
      {
        city: "Hubballi",
        state: "Karnataka",
      },
      {
        city: "Kolar",
        state: "Karnataka",
      },
      {
        city: "Mangaluru",
        state: "Karnataka",
      },
      {
        city: "Mysuru",
        state: "Karnataka",
      },
      {
        city: "Raichur",
        state: "Karnataka",
      },
      {
        city: "Shivamogga",
        state: "Karnataka",
      },
      {
        city: "Tumakuru",
        state: "Karnataka",
      },
      {
        city: "Udupi",
        state: "Karnataka",
      },
      {
        city: "Alappuzha",
        state: "Kerala",
      },
      {
        city: "Ernakulam",
        state: "Kerala",
      },
      {
        city: "Idukki",
        state: "Kerala",
      },
      {
        city: "Kannur",
        state: "Kerala",
      },
      {
        city: "Kasaragod",
        state: "Kerala",
      },
      {
        city: "Kollam",
        state: "Kerala",
      },
      {
        city: "Kottayam",
        state: "Kerala",
      },
      {
        city: "Kozhikode",
        state: "Kerala",
      },
      {
        city: "Malappuram",
        state: "Kerala",
      },
      {
        city: "Palakkad",
        state: "Kerala",
      },
      {
        city: "Pathanamthitta",
        state: "Kerala",
      },
      {
        city: "Thiruvananthapuram",
        state: "Kerala",
      },
      {
        city: "Thrissur",
        state: "Kerala",
      },
      {
        city: "Wayanad",
        state: "Kerala",
      },
      {
        city: "Bhopal",
        state: "Madhya Pradesh",
      },
      {
        city: "Gwalior",
        state: "Madhya Pradesh",
      },
      {
        city: "Indore",
        state: "Madhya Pradesh",
      },
      {
        city: "Jabalpur",
        state: "Madhya Pradesh",
      },
      {
        city: "Rewa",
        state: "Madhya Pradesh",
      },
      {
        city: "Sagar",
        state: "Madhya Pradesh",
      },
      {
        city: "Satna",
        state: "Madhya Pradesh",
      },
      {
        city: "Ujjain",
        state: "Madhya Pradesh",
      },
      {
        city: "Ahmednagar",
        state: "Maharashtra",
      },
      {
        city: "Akola",
        state: "Maharashtra",
      },
      {
        city: "Amravati",
        state: "Maharashtra",
      },
      {
        city: "Aurangabad",
        state: "Maharashtra",
      },
      {
        city: "Chandrapur",
        state: "Maharashtra",
      },
      {
        city: "Dhule",
        state: "Maharashtra",
      },
      {
        city: "Jalgaon",
        state: "Maharashtra",
      },
      {
        city: "Kolhapur",
        state: "Maharashtra",
      },
      {
        city: "Latur",
        state: "Maharashtra",
      },
      {
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        city: "Nagpur",
        state: "Maharashtra",
      },
      {
        city: "Nanded",
        state: "Maharashtra",
      },
      {
        city: "Nashik",
        state: "Maharashtra",
      },
      {
        city: "Parbhani",
        state: "Maharashtra",
      },
      {
        city: "Pune",
        state: "Maharashtra",
      },
      {
        city: "Sangli",
        state: "Maharashtra",
      },
      {
        city: "Satara",
        state: "Maharashtra",
      },
      {
        city: "Solapur",
        state: "Maharashtra",
      },
      {
        city: "Thane",
        state: "Maharashtra",
      },
      {
        city: "Wardha",
        state: "Maharashtra",
      },
      {
        city: "Imphal",
        state: "Manipur",
      },
      {
        city: "Shillong",
        state: "Meghalaya",
      },
      {
        city: "Aizawl",
        state: "Mizoram",
      },
      {
        city: "Kohima",
        state: "Nagaland",
      },
      {
        city: "Bhubaneswar",
        state: "Odisha",
      },
      {
        city: "Cuttack",
        state: "Odisha",
      },
      {
        city: "Puri",
        state: "Odisha",
      },
      {
        city: "Rourkela",
        state: "Odisha",
      },
      {
        city: "Ludhiana",
        state: "Punjab",
      },
      {
        city: "Amritsar",
        state: "Punjab",
      },
      {
        city: "Bathinda",
        state: "Punjab",
      },
      {
        city: "Jalandhar",
        state: "Punjab",
      },
      {
        city: "Mohali",
        state: "Punjab",
      },
      {
        city: "Pathankot",
        state: "Punjab",
      },
      {
        city: "Patiala",
        state: "Punjab",
      },
      {
        city: "Ajmer",
        state: "Rajasthan",
      },
      {
        city: "Alwar",
        state: "Rajasthan",
      },
      {
        city: "Bharatpur",
        state: "Rajasthan",
      },
      {
        city: "Bhilwara",
        state: "Rajasthan",
      },
      {
        city: "Bikaner",
        state: "Rajasthan",
      },
      {
        city: "Jaipur",
        state: "Rajasthan",
      },
      {
        city: "Jodhpur",
        state: "Rajasthan",
      },
      {
        city: "Kota",
        state: "Rajasthan",
      },
      {
        city: "Udaipur",
        state: "Rajasthan",
      },
      {
        city: "Gangtok",
        state: "Sikkim",
      },
      {
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        city: "Coimbatore",
        state: "Tamil Nadu",
      },
      {
        city: "Madurai",
        state: "Tamil Nadu",
      },
      {
        city: "Salem",
        state: "Tamil Nadu",
      },
      {
        city: "Thanjavur",
        state: "Tamil Nadu",
      },
      {
        city: "Tiruchirappalli",
        state: "Tamil Nadu",
      },
      {
        city: "Tirunelveli",
        state: "Tamil Nadu",
      },
      {
        city: "Tiruppur",
        state: "Tamil Nadu",
      },
      {
        city: "Vellore",
        state: "Tamil Nadu",
      },
      {
        city: "Hyderabad",
        state: "Telangana",
      },
      {
        city: "Karimnagar",
        state: "Telangana",
      },
      {
        city: "Khammam",
        state: "Telangana",
      },
      {
        city: "Nizamabad",
        state: "Telangana",
      },
      {
        city: "Warangal",
        state: "Telangana",
      },
      {
        city: "Agartala",
        state: "Tripura",
      },
      {
        city: "Moradabad",
        state: "Uttar Pradesh",
      },
      {
        city: "Agra",
        state: "Uttar Pradesh",
      },
      {
        city: "Aligarh",
        state: "Uttar Pradesh",
      },
      {
        city: "Ayodhya",
        state: "Uttar Pradesh",
      },
      {
        city: "Bareilly",
        state: "Uttar Pradesh",
      },
      {
        city: "Ghaziabad",
        state: "Uttar Pradesh",
      },
      {
        city: "Gorakhpur",
        state: "Uttar Pradesh",
      },
      {
        city: "Jhansi",
        state: "Uttar Pradesh",
      },
      {
        city: "Kanpur",
        state: "Uttar Pradesh",
      },
      {
        city: "Lucknow",
        state: "Uttar Pradesh",
      },
      {
        city: "Mathura",
        state: "Uttar Pradesh",
      },
      {
        city: "Meerut",
        state: "Uttar Pradesh",
      },
      {
        city: "Noida",
        state: "Uttar Pradesh",
      },
      {
        city: "Prayagraj",
        state: "Uttar Pradesh",
      },
      {
        city: "Saharanpur",
        state: "Uttar Pradesh",
      },
      {
        city: "Varanasi",
        state: "Uttar Pradesh",
      },
      {
        city: "Dehradun",
        state: "Uttarakhand",
      },
      {
        city: "Haridwar",
        state: "Uttarakhand",
      },
      {
        city: "Haldwani",
        state: "Uttarakhand",
      },
      {
        city: "Kashipur",
        state: "Uttarakhand",
      },
      {
        city: "Roorkee",
        state: "Uttarakhand",
      },
      {
        city: "Asansol",
        state: "West Bengal",
      },
      {
        city: "Durgapur",
        state: "West Bengal",
      },
      {
        city: "Howrah",
        state: "West Bengal",
      },
      {
        city: "Kolkata",
        state: "West Bengal",
      },
      {
        city: "Siliguri",
        state: "West Bengal",
      },
    ]
    setCities(citiesData)

    // Initialize degrees/courses
    const degreesData = [
      "Acting and Film-making",
      "Actuarial Science",
      "Administrative Law",
      "Advanced Diploma in Computer Applications",
      "Advertising",
      "Aeronautical Engineering",
      "Aerospace Engineering",
      "Aerospace Engineering Courses",
      "Agricultural Engineering",
      "Agriculture",
      "Air and Space Law",
      "Air Hostess/ Cabin Crew Courses",
      "Airport Management Courses",
      "Alternative Medicine",
      "Animation",
      "Apparel Production",
      "Archaeology",
      "Architecture Courses",
      "Architecture Engineering",
      "Artificial Intelligence and Machine Learning Course",
      "Association of Chartered Certified Accountants",
      "Astrophysics",
      "Audiology",
      "Augmented Reality Design",
      "AutoCAD",
      "Automobile Engineering",
      "Auxiliary Nursing and Midwifery",
      "Aviation",
      "Avionics Engineering",
      "B Com Computer Applications",
      "B Com Honours",
      "B Pharma",
      "B Tech Food Technology",
      "B Tech Textile Engineering",
      "B. Voc in Hotel Management",
      "B.A. - Public Administration",
      "B.A. Ancient History",
      "B.A. Astrology",
      "B.A. B.Ed",
      "B.A. Bengali",
      "B.A. Economics",
      "B.A. Education",
      "B.A. French",
      "B.A. Hindi",
      "B.A. History",
      "B.A. in Psychology",
      "B.A. Interior Design",
      "B.A. Kannada",
      "B.A. Malayalam",
      "B.A. Philosophy",
      "B.A. Political Science",
      "B.A. Rural Development",
      "B.A. Sociology",
      "B.A. Tamil",
      "B.A. Telugu",
      "B.Com Applied Economics",
      "B.Com Banking & Finance",
      "B.Com Business Economics",
      "B.Com Co-operation",
      "B.Com E-Commerce",
      "B.Com Economics",
      "B.Com Fintech",
      "B.Com Foreign Trade Management",
      "B.Com in Advanced Accountancy",
      "B.Com in Advertising and Brand Management",
      "B.Com in Bank Management",
      "B.Com in Banking and Insurance",
      "B.Com in Finance",
      "B.Com in HR Management",
      "B.Com in Information Technology",
      "B.Com in Management Studies",
      "B.Com in Sales and Marketing",
      "B.Com in Taxation and Finance",
      "B.Com International Business & Finance",
      "B.Com Investment Banking",
      "B.Com Taxation",
      "B.Com Travel and Tourism Management",
      "B.Com Vocational",
      "B.Des - Industrial Design",
      "B.Des in Animation",
      "B.Des in Animation & Visual Effects Course",
      "B.Des in Fashion Communication",
      "B.Des in Game Design & Animation",
      "B.Des in Graphic Design",
      "B.Des in Interior Design",
      "B.Des in Knitwear Design",
      "B.Des in UX/ UI Interaction Design Course",
      "B.Des in UX/UI Course",
      "B.Des in Visual Communication Course",
      "B.Des Product Design",
      "B.Ed Biology",
      "B.Ed in Accountancy",
      "B.Ed in Commerce",
      "B.Ed in Physical Science",
      "B.Ed in Special Education",
      "B.Ed Special Education",
      "B.Pharm + MBA Integrated",
      "B.Pharm Hons.",
      "B.Pharm Unani",
      "B.Plan",
      "B.Sc - Biochemistry",
      "B.Sc - Biological Sciences",
      "B.Sc - Electronics",
      "B.Sc - Environmental Sciences",
      "B.Sc - Genetics",
      "B.Sc - Geology",
      "B.Sc - Medical Laboratory Technology",
      "B.Sc - Statistics",
      "B.Sc (Hons) in Community Science",
      "B.Sc Actuarial Sciences",
      "B.Sc Analytical Chemistry",
      "B.Sc Biomedical Science",
      "B.Sc Botany",
      "B.Sc Cardiac Care Technology",
      "B.Sc Dialysis Therapy",
      "B.Sc Fashion Design",
      "B.Sc Game Designing and Development",
      "B.Sc Hons Agri-Business Management",
      "B.Sc Hydrology",
      "B.Sc Immunology",
      "B.Sc in Anaesthesia Technology",
      "B.Sc in Animation",
      "B.Sc in Animation and Multimedia",
      "B.Sc in Critical Care Technology",
      "B.Sc in Fashion Technology",
      "B.Sc in Graphic Design",
      "B.Sc in Physician Assistant",
      "B.Sc in Physiotherapy",
      "B.Sc in Psychology",
      "B.Sc in Radiology",
      "B.Sc in Travel & Tourism Management",
      "B.Sc in Yoga",
      "B.Sc Interior Design",
      "B.Sc LLB",
      "B.Sc Medical Sociology",
      "B.Sc Nutrition",
      "B.Sc Ophthalmic Technology",
      "B.Sc Respiratory Therapy",
      "B.Sc Sericulture",
      "B.Sc Visual Communication",
      "B.Sc. in Neurophysiology Technology",
      "B.Sc. in Occupational Therapy",
      "B.Sc. Mathematics",
      "B.Sc. Nuclear Medicine Technology",
      "B.Tech - Automobile Engineering",
      "B.Tech - Biochemical Engineering",
      "B.Tech - Ceramic Engineering",
      "B.Tech - Civil Engineering",
      "B.Tech - Electrical Engineering",
      "B.Tech - Food Processing Technology",
      "B.Tech - Genetic Engineering",
      "B.Tech - Instrumentation Engineering",
      "B.Tech - Marine Engineering",
      "B.Tech - Material Science and Metallurgical Engineering",
      "B.Tech - Mechanical Engineering",
      "B.Tech - Mechatronics Engineering",
      "B.Tech - Mining Engineering",
      "B.Tech - Petroleum Engineering",
      "B.Tech - Production Engineering",
      "B.Tech - Software Engineering",
      "B.Tech - Telecommunication Engineering",
      "B.Tech Aeronautical Engineering",
      "B.Tech Aerospace Engineering",
      "B.Tech Agricultural Engineering",
      "B.Tech Artificial Intelligence",
      "B.Tech Biomedical Engineering/ Technology",
      "B.Tech Chemical Engineering",
      "B.Tech Cloud Computing",
      "B.Tech Data Science",
      "B.Tech Electronics and Communications Engineering",
      "B.Tech in Blockchain Technology",
      "B.Tech in Computer Science",
      "B.Tech in Full Stack Development",
      "B.Tech Industrial Engineering",
      "B.Tech Information Technology",
      "B.Tech LL.B.",
      "B.Tech Plastic Engineering",
      "B.V. Sc. in Veterinary Surgery & Radiology",
      "B.Voc. Healthcare Management",
      "BA (Hons) Political Science",
      "BA (Hons) Sanskrit",
      "BA Bengali Hons",
      "BA Computer Applications",
      "BA Convergent Journalism",
      "BA Film, Television and OTT Production",
      "BA Functional English",
      "BA Geography",
      "BA Hons Business Economics",
      "BA Hons. Economics",
      "BA in Culinary Arts",
      "BA in English",
      "BA in Graphic Design",
      "BA in Restaurant Management Course",
      "BA LLB",
      "BA Marathi",
      "BA Music",
      "BA Sanskrit",
      "Bachelor in Business Economics",
      "Bachelor in Hospital Administration",
      "Bachelor in Performing Arts",
      "Bachelor of Accounting & Finance",
      "Bachelor of Architecture",
      "Bachelor of Arts",
      "Bachelor of Arts in Journalism",
      "Bachelor of Arts in Visual Communication",
      "Bachelor of Audiology & Speech Language Pathology",
      "Bachelor of Ayurveda Medical and Surgery",
      "Bachelor of Banking & Insurance",
      "Bachelor of Business Administration",
      "Bachelor of Business Management",
      "Bachelor of Business Studies",
      "Bachelor of Catering Technology & Culinary Arts",
      "Bachelor of Commerce",
      "Bachelor of Company Law",
      "Bachelor of Computer Applications",
      "Bachelor of Dental Surgery",
      "Bachelor of Design",
      "Bachelor of Design in Communication Design",
      "Bachelor of Education",
      "Bachelor of Elementary Education",
      "Bachelor of Engineering",
      "Bachelor of Engineering BE Computer Engineering",
      "Bachelor of Engineering in Computer Science",
      "Bachelor of Fashion and Apparel Design",
      "Bachelor of Fashion Technology",
      "Bachelor of Financial Markets",
      "Bachelor of Fine Arts",
      "Bachelor of Fisheries Science",
      "Bachelor of Foreign Trade",
      "Bachelor of Homeopathic Medicine & Surgery",
      "Bachelor of Hospitality Management",
      "Bachelor of Hotel Management",
      "Bachelor of Hotel Management & Catering Technology",
      "Bachelor of Journalism & Mass Communication",
      "Bachelor of Law",
      "Bachelor of Library and Information Science",
      "Bachelor of Library Science",
      "Bachelor of Management Studies",
      "Bachelor of Mass Communication",
      "Bachelor of Mass Media",
      "Bachelor of Medical Laboratory Technology",
      "Bachelor of Medicine and Bachelor of Surgery",
      "Bachelor of Multimedia Communication",
      "Bachelor of Naturopathy and Yogic Sciences",
      "Bachelor of Paramedical Technology",
      "Bachelor of Physical Education",
      "Bachelor of Physiotherapy",
      "Bachelor of Public Health",
      "Bachelor of Science",
      "Bachelor of Science BSc Optometry",
      "Bachelor of Science in Fashion and Apparel Design",
      "Bachelor of Sidhha Medicine and Surgery",
      "Bachelor of Social Work",
      "Bachelor of Sports Management",
      "Bachelor of Technology",
      "Bachelor of Technology Dairy Technology",
      "Bachelor of Technology in Railway Engineering",
      "Bachelor of Technology Thermal Engineering",
      "Bachelor of Textile",
      "Bachelor of Tourism and Management",
      "Bachelor of Tourism and Travel Management",
      "Bachelor of Unani Medicine & Surgery",
      "Bachelor of Veterinary Science",
      "Bachelor of Visual Arts",
      "Bachelor of Visual Communication",
      "Bachelor of Vocational Education",
      "Bachelors in Media Animation & Design",
      "Bachelors of Commerce and Bachelor of Legislative Law",
      "Bachelors of Occupational Therapy",
      "Banking Courses",
      "Banking Law",
      "Bartending Courses",
      "Basic Training Certificate",
      "BBA Accounting",
      "BBA Banking and Insurance",
      "BBA Honors",
      "BBA in Airport Management",
      "BBA in Applied HR",
      "BBA in Aviation",
      "BBA in Business Analytics",
      "BBA in Business Economics",
      "BBA in Computer Application",
      "BBA in Digital Marketing",
      "BBA in E-Commerce",
      "BBA in Event Management",
      "BBA in Finance",
      "BBA in Fintech",
      "BBA in Foreign Trade",
      "BBA in Healthcare Management",
      "BBA in Hospital Management",
      "BBA in Hotel and Tourism Management",
      "BBA in Hotel Management",
      "BBA in HR",
      "BBA in Industrial Management",
      "BBA in Information Systems Management",
      "BBA in Information Technology",
      "BBA in Insurance and Investment Management",
      "BBA in International Business",
      "BBA in Investment Banking",
      "BBA in Logistics and Supply Chain Management",
      "BBA in Marketing",
      "BBA in Materials Management",
      "BBA in Media Management",
      "BBA in New Age Sales and Marketing",
      "BBA in Real Estate and Urban Infrastructure",
      "BBA in Retail Management",
      "BBA in Risk Management",
      "BBA in Sports Management",
      "BBA in Tourism Management",
      "BBA LLB",
      "BBA+MBA",
      "BBM in Human Resource Management",
      "BBM International Business",
      "BCA Full Stack Development",
      "BCA in Animation & Gaming",
      "BCA in Cloud Computing",
      "BCA in Cyber Security",
      "BCA in Data Science",
      "BCA+MCA",
      "BE Electrical and Electronics Engineering",
      "Beautician & Make-up Courses",
      "BFA Graphics",
      "BFA Textile Design",
      "BHM in Culinary Arts",
      "Biomedical Engineering",
      "Biotechnology Engineering",
      "BSc (Hons) in Physics",
      "BSc (Hons) Mathematics",
      "BSc (Hons.) Zoology",
      "BSc Agriculture",
      "BSc Animation VFX",
      "BSc BEd",
      "BSc Bioinformatics",
      "BSc Cardiac Technology",
      "BSc Chemistry",
      "BSc Computer Application",
      "BSc Computer Science",
      "BSc Data Science",
      "BSc Food Technology",
      "BSc Forensic Science",
      "BSc Geography",
      "BSc Home Science",
      "BSc Hons",
      "BSc Hons Agriculture",
      "BSc Hons Botany",
      "BSc Hons. in Computer Science",
      "BSc Horticulture",
      "BSc in Airlines & Airport Management",
      "BSc in Anthropology",
      "BSc in Biotechnology",
      "BSc in Culinary Arts",
      "BSc in Forestry",
      "BSc in Hospitality and Hotel Administration",
      "BSc in Information Technology",
      "BSc in Life Sciences",
      "BSc in Microbiology",
      "BSc in Nautical Science",
      "BSc in Physics",
      "BSc in Physiology",
      "BSc in Zoology",
      "BSc Information Technology",
      "BSc Medical Imaging Technology",
      "BSc Non Medical",
      "BSc Nursing",
      "BSc Operation Theatre Technology",
      "BSc Pathology",
      "BSc Perfusion Technology",
      "BSc Radiography",
      "BSc Radiotherapy",
      "BSW LLB",
      "BTech",
      "BTech Cyber Security",
      "BV. Sc. in Animal Production & Management",
      "Cardiology",
      "Catering Courses",
      "Ceramic Design",
      "Ceramic Engineering",
      "Certificate Course in Fashion Design",
      "Certificate Course in Interior Design",
      "Certificate in CAD",
      "Certified Public Accounting",
      "CFP Certified Financial Planner",
      "Chartered Accountancy",
      "Chartered Financial Analyst",
      "Chemical Engineering",
      "Civil Engineering",
      "Civil Law",
      "Clinical Research",
      "Commercial Law",
      "Company Law",
      "Company Secretary",
      "Competition Law",
      "Computer Courses",
      "Computer Engineering",
      "Computer Hardware Courses",
      "Computer Science",
      "Computer Science Engineering Courses",
      "Consumer Law",
      "Corporate Law",
      "Cosmetology",
      "Criminal Law",
      "Culinary Arts Courses",
      "Cyber Law",
      "Cyber Security & Ethical Hacking",
      "D Pharma",
      "Data Entry Operator Course",
      "Data Management/ Data Analysis",
      "Data Science",
      "Dermatology",
      "Design Engineering",
      "Designing Course",
      "Digital Journalism",
      "Digital Marketing Course",
      "Diploma Courses",
      "Diploma in Advanced Accounting",
      "Diploma in Agriculture",
      "Diploma in Anaesthesia",
      "Diploma in Animal husbandry",
      "Diploma in Apparel Merchandising",
      "Diploma in Architectural Assistantship",
      "Diploma in Architecture",
      "Diploma in Automobile Engineering",
      "Diploma in Banking and Finance",
      "Diploma in Broadcast Journalism",
      "Diploma in Ceramic Engineering",
      "Diploma in Chemical Engineering",
      "Diploma in Civil Engineering",
      "Diploma in Clinical Pathology",
      "Diploma in Computer Application",
      "Diploma in Computer Science Engineering",
      "Diploma in Computerised Accounting",
      "Diploma in Cooperative Management",
      "Diploma in Dental Hygienist",
      "Diploma in Dialysis Technician",
      "Diploma in Dietetics",
      "Diploma in Education",
      "Diploma in Electrical Engineering",
      "Diploma in Electronics and Communication Engineering",
      "Diploma in Elementary Education",
      "Diploma in Engineering",
      "Diploma in Fashion Designing",
      "Diploma in Graphic Design",
      "Diploma in Gynaecology and Obstetrics",
      "Diploma in Health Inspector",
      "Diploma in Hearing Language and Speech",
      "Diploma in Homeopathic Medicine & Surgery",
      "Diploma in Horticulture",
      "Diploma in Information Technology",
      "Diploma in Interior Design",
      "Diploma in Jewellery Design",
      "Diploma in Journalism and Mass Communication",
      "Diploma in Mechanical Engineering",
      "Diploma in Mechatronics",
      "Diploma in Medical Laboratory Technology",
      "Diploma in Metallurgical Engineering",
      "Diploma in Mining Engineering",
      "Diploma in Multimedia",
      "Diploma in Naturopathy",
      "Diploma in Nursery Teacher Training",
      "Diploma in Nursing",
      "Diploma in Nursing Care Assistant",
      "Diploma in Operation Theatre Technology",
      "Diploma in Ophthalmic Technology",
      "Diploma in Optometry Technology",
      "Diploma in Petroleum Engineering",
      "Diploma in Physiotherapy",
      "Diploma in Plastic Engineering",
      "Diploma in Rural Health Care",
      "Diploma in Special Education",
      "Diploma in Textile Design",
      "Diploma in Textile Engineering",
      "Diploma in X-Ray Technology",
      "Diplomate of National Board",
      "DM Cardiology",
      "DM Gastroenterology",
      "DM Neurology",
      "DNB Cardiology",
      "Doctor of Business Administration",
      "Doctor of Medicine",
      "Doctor of Philosophy",
      "Doctorate of Medicine",
      "Electrical and Electronics Engineering",
      "Electrical Engineering",
      "Electronics and Communication Engineering",
      "Electronics and Telecommunication Engineering",
      "Electronics Engineering Course",
      "Emergency Medical Technician",
      "Energy Engineering",
      "Energy Law",
      "Environmental Engineering",
      "Environmental Law",
      "Event Management",
      "Executive MBA",
      "Executive PGDM",
      "Exhibition Design",
      "Fares & Ticketing",
      "Fashion Communication",
      "Fashion Illustration",
      "Fashion Journalism",
      "Fashion Marketing",
      "Fashion Photography",
      "Fashion PR",
      "Fashion Styling",
      "Food and Beverage Services Courses",
      "Food Engineering",
      "Footwear Design",
      "Furniture Design",
      "Game Designing and Development Courses",
      "Garment Technology",
      "Gemology",
      "General Nursing and Midwifery",
      "Genetic Engineering",
      "Graphic Designing",
      "Homeopathy",
      "Hospital Management",
      "Hotel Management Course",
      "Industrial and Production Engineering",
      "Industrial Design",
      "Industrial Engineering",
      "Information Science & Engineering",
      "Infrastructure Engineering",
      "Instrumentation and Control Engineering",
      "Instrumentation Engineering",
      "Integrated M.Sc in Data Science",
      "Intellectual Property Law",
      "Interaction Design",
      "Interior Architecture",
      "Interior Designing",
      "Investment Banking",
      "IT Courses",
      "ITI Course in  Electronic Mechanic",
      "ITI Course in Bleaching Dyeing and Calico Printing",
      "ITI Course in Diesel Mechanic",
      "ITI Course in Draughtsman (Civil)",
      "ITI Course in Draughtsman (Mechanical)",
      "ITI Course in Dress Making",
      "ITI Course in Electrician",
      "ITI Course in Footwear Maker",
      "ITI Course in Fruit and Vegetable Processor",
      "ITI Course in Hair and Skin Care",
      "ITI Course in Hand Compositor",
      "ITI Course in Information Technology",
      "ITI Course in Instrument Mechanic",
      "ITI Course in Leather Goods Maker",
      "ITI Course in Machinist",
      "ITI Course in Pump Operator cum Mechanic",
      "ITI Course in Surveyor",
      "ITI Course in Tool and Die Maker",
      "ITI Course/Trade in Fitter",
      "ITI Course/Trade in Mechanic Motor Vehicle",
      "ITI Course/Trade in Refrigeration and Air Conditioning",
      "ITI Course/Trade in Secretarial Practice",
      "ITI Course/Trade in Turner",
      "Jewellery Designing",
      "Journalism",
      "Labour Law",
      "Landscape Design",
      "Law",
      "LL. M in Human Rights",
      "LL.B. Honours",
      "LL.M - Corporate Law",
      "LL.M - Criminal Law",
      "LL.M - Cyber Law",
      "LL.M - International Law",
      "LL.M - Labour Law",
      "M. Des in Industrial Designing",
      "M. Des in Interior Designing",
      "M.A. - Public Administration",
      "M.A. Geography",
      "M.A. History",
      "M.A. in Psychology",
      "M.A. in Textile Designing",
      "M.A. International Relations",
      "M.A. Marathi",
      "M.A. Political Science",
      "M.A. Public Policy",
      "M.A. Rural Development",
      "M.Com Computer Applications",
      "M.Com in Business Studies",
      "M.Com in Finance",
      "M.Com in HR",
      "M.Com International Business",
      "M.Des in Communication Design",
      "M.Des in Fashion Designing",
      "M.Des in Graphic Design",
      "M.Des in UX/UI Course",
      "M.Pharm in Clinical Practice and Research",
      "M.Pharm in Pharmaceutics",
      "M.Pharm in Pharmacognosy",
      "M.Pharm Industrial Pharmacy",
      "M.Pharm Pharmaceutical Analysis",
      "M.Pharm Pharmaceutical Biotechnology",
      "M.Pharm Pharmacology",
      "M.Phil in Law",
      "M.Phil in Nursing",
      "M.S. in Ayurveda",
      "M.Sc - Astrology",
      "M.Sc - Information Technology",
      "M.Sc - Marine Biology",
      "M.Sc - Oceanography",
      "M.Sc Applied Mathematics",
      "M.Sc Botany",
      "M.Sc Electronics",
      "M.Sc Fashion Design",
      "M.Sc Fashion Technology",
      "M.Sc Food Technology",
      "M.Sc Home Science",
      "M.Sc Horticulture",
      "M.Sc Hydrology",
      "M.Sc in Agriculture",
      "M.Sc in Animation",
      "M.Sc in Child Health Nursing",
      "M.Sc in Maternity Nursing",
      "M.Sc in Medical Laboratory Technology",
      "M.Sc in Paediatric Nursing",
      "M.Sc Interior Design",
      "M.Sc Organic Chemistry",
      "M.Sc Sericulture",
      "M.Sc Textile Design",
      "M.Sc Virology",
      "M.Sc. in Medical-Surgical Nursing",
      "M.Sc. Nursing",
      "M.Tech Chemical Engineering",
      "M.Tech Computer Science",
      "M.Tech Computer Science Engineering",
      "M.Tech Data Science",
      "M.Tech Electrical Engineering",
      "M.Tech Genetic Engineering",
      "M.Tech Geoinformatics",
      "M.Tech in Civil Engineering",
      "M.Tech in Electronics and Communications Engineering",
      "M.Tech in Food Technology",
      "M.Tech in Geo Technical Engineering",
      "M.Tech in Structural Engineering",
      "M.Tech in Wireless Communication/ Network",
      "M.Tech Mining Engineering",
      "M.Tech Textile Engineering",
      "MA Economics",
      "MA Hindi",
      "MA in English",
      "MA in Travel and Tourism",
      "MA Sanskrit",
      "MA Sociology",
      "Manufacturing Engineering",
      "Marine Engineering",
      "Maritime Law",
      "Master in Fashion Technology",
      "Master of Applied Management",
      "Master of Architecture",
      "Master of Arts",
      "Master of Arts in Archaeology",
      "Master of Arts in Convergent Journalism",
      "Master of Arts in Education",
      "Master of Business Law",
      "Master of Chirurgiae - Super Speciality Course in Surgery/ Surgical Oncology",
      "Master of Commerce",
      "Master of Commerce in Statistics",
      "Master of Computer Applications",
      "Master of Dental Surgery",
      "Master of Design",
      "Master of Education",
      "Master of Fashion Management",
      "Master of Finance and Accounting",
      "Master of Financial Management",
      "Master of Fine Arts",
      "Master of Health/Hospital Administration",
      "Master of Hotel Management",
      "Master of Information Management",
      "Master of International Business",
      "Master of Law",
      "Master of Management Studies",
      "Master of Mass Communication",
      "Master of Occupational Therapy",
      "Master of Optometry",
      "Master of Pharmacy",
      "Master of Physical Education",
      "Master of Physiotherapy",
      "Master of Planning",
      "Master of Prosthetics & Orthotics",
      "Master of Public Health",
      "Master of Science",
      "Master of Science in Analytical Chemistry",
      "Master of Science in Applied Geology",
      "Master of Science in Astronomy",
      "Master of Science in Atmospheric Sciences",
      "Master of Science in Forensic Science",
      "Master of Science in Life Sciences",
      "Master of Science in Mathematics",
      "Master of Social Work",
      "Master of Surgery",
      "Master of Technology",
      "Master of Tourism and Hotel Management",
      "Master of Tourism Management",
      "Master of Veterinary Science",
      "Masters in Engineering",
      "Masters in Journalism and Mass Communication",
      "Masters in Urban and Rural Planning",
      "Masters of Business Economics",
      "Masters of Computer Management",
      "Masters of Finance & Control",
      "Masters of Technology Environmental Technology",
      "Masters of Technology in Biotechnology",
      "Masters of Technology in Cyber Security",
      "Masters of Technology in Information Technology",
      "Masters of Technology Mechanical Engineering",
      "Masters of Tourism Administration",
      "MBA",
      "MBA - Actuarial Science",
      "MBA - Agri Business Management",
      "MBA - Business Process Management",
      "MBA - Communication Management",
      "MBA - Consultancy Management",
      "MBA - Customer Relationship Management",
      "MBA - Design Management",
      "MBA - Environmental Management",
      "MBA - Fashion Management",
      "MBA - Finance Management",
      "MBA - Healthcare & Hospital Management",
      "MBA - Hospitality Management",
      "MBA - Industrial Management",
      "MBA - Information Technology",
      "MBA - Investment Management",
      "MBA - Logistics and Supply Chain Management",
      "MBA - Materials Management",
      "MBA - Media Management",
      "MBA - Natural Resource Management",
      "MBA - Operations Management",
      "MBA - Power Management",
      "MBA - Retail Management",
      "MBA - Risk Management",
      "MBA - Rural Development Management",
      "MBA - Sales Management",
      "MBA - Sports Management",
      "MBA - Sustainable Management",
      "MBA - Systems Management",
      "MBA - Technology Management",
      "MBA in Accounting",
      "MBA in Advertising Management",
      "MBA in Air Travel Management",
      "MBA in Airline and Airport Management",
      "MBA in Applied HR",
      "MBA in Artificial Intelligence",
      "MBA in Aviation Management",
      "MBA in Banking and Insurance",
      "MBA in Biotechnology",
      "MBA in Brand Management",
      "MBA in Business Analytics",
      "MBA in Business Law",
      "MBA in Business Management",
      "MBA in Capital Markets",
      "MBA in Computer Science",
      "MBA in Construction Management",
      "MBA in Corporate Social Responsibility",
      "MBA in Dairy Management",
      "MBA in Data Analytics",
      "MBA in Digital Marketing",
      "MBA in Disaster Management",
      "MBA in E-Commerce",
      "MBA in Education Management",
      "MBA in Energy and Environment",
      "MBA in Entrepreneurship",
      "MBA in Event Management",
      "MBA in Financial Technology",
      "MBA in Foreign Trade",
      "MBA in Global Financial Operations",
      "MBA in Hospital Administration",
      "MBA in Hotel Management",
      "MBA in HR",
      "MBA in Information System Management",
      "MBA in Infrastructure Management",
      "MBA in Interior Design",
      "MBA in International Business",
      "MBA in Investment Banking",
      "MBA in Marketing",
      "MBA in New Age Sales and Marketing",
      "MBA in Oil and Gas Management",
      "MBA in Operation Management",
      "MBA in Pharmaceutical Management",
      "MBA in Public Policy Management",
      "MBA in Real Estate Management",
      "MBA in Safety Management",
      "MBA in Service Management",
      "MBA in Shipping and Logistics",
      "MBA in Statistics",
      "MBA in Telecom Management",
      "MBA in Textile Management",
      "MBA in Tourism Management",
      "MBA Project Management",
      "MCA in Full Stack Development",
      "MCh",
      "MCh Urology",
      "MD Ayurveda",
      "MD Dermatology",
      "MD General Medicine",
      "MD Homoeopathy",
      "MD in Anaesthesiology",
      "MD Microbiology",
      "MD Paediatrics",
      "MD Pathology",
      "MD Pharmacology",
      "MD Psychiatry",
      "MD Radiodiagnosis",
      "MD Radiology",
      "MDes in Textile Design",
      "Mechanical Engineering Courses",
      "Media Law",
      "Medical Laboratory Technology",
      "Medical Transcription",
      "Merchant Navy",
      "Metallurgical Engineering",
      "Microbiology",
      "MMS in Marketing",
      "Mobile Repairing Course",
      "MPhil",
      "MPT Biomechanics",
      "MS ENT",
      "MS Ophthalmology",
      "MS Orthopaedics",
      "MSc Anatomy",
      "MSc Biotechnology",
      "MSc Chemistry",
      "MSc Data Science",
      "MSc Environmental Science",
      "MSc Food Science and Technology",
      "MSc Geoinformatics",
      "MSc in Computer Science",
      "MSc in Microbiology",
      "MSc in Tourism and Hospitality Management",
      "MSc in Zoology",
      "MSc Medical Microbiology",
      "MSc Nutrition and Dietetics",
      "MSc Physics",
      "MSc Psychology",
      "Neurology",
      "Nursing",
      "Nutrition & Dietetics",
      "Occupational Therapy",
      "Ophthalmology",
      "Orthopaedics",
      "Paediatrics",
      "Paramedical Courses",
      "Pathology",
      "Petroleum Engineering",
      "PG Diploma in Accommodation Operation and Management",
      "PG Diploma in Business Management",
      "PG Diploma in Event Management",
      "PG Diploma in Food Technology",
      "PG Diploma in Hospital Management",
      "PG Diploma in Hospitality Management",
      "PG Diploma in Human Rights Law",
      "PG Diploma in Media and Mass Communication",
      "PG Diploma in Supply Chain and Logistics Management",
      "PG Diploma in Textile Design",
      "PGD in Culinary Arts",
      "PGD in Financial Management",
      "PGD in Hotel Management",
      "PGD in Law",
      "PGD in Rural Development",
      "PGD in Taxation",
      "PGD in Travel and Tourism Management",
      "PGDCA Course",
      "PGDM in Business Analytics",
      "PGDM in HRM",
      "PGDM in International Business",
      "PGDM in Operations Management",
      "PGP - Tax Management",
      "Pharm D (Doctor of Pharmacy)",
      "Pharmacology",
      "Pharmacy Courses",
      "PhD Computer Science",
      "PhD Food Technology",
      "PhD Mathematics",
      "PhD Physiotherapy",
      "Photography",
      "Physiotherapy",
      "Pilot Training",
      "Planning Courses",
      "Polymer Engineering",
      "Post Basic B.Sc Nursing",
      "Post Basic Diploma in Operation Room Nursing",
      "Post Graduate Diploma in Corporate Law",
      "Post Graduate Diploma in Cyber Law",
      "Post Graduate Diploma in Fashion Designing",
      "Post Graduate Diploma in Graphic Design",
      "Post Graduate Diploma in Hospital and Health Management",
      "Post Graduate Diploma in Interior Designing",
      "Post Graduate Diploma in Management",
      "Post Graduate Diploma in Management in Marketing",
      "Post Graduate Program in Management",
      "Post Graduate Programme in Agri-Business Management",
      "Post Graduate Programme in Business Management",
      "Post Graduate Programme in Enterprise Management",
      "Post Graduate Programme in Human Resource Management",
      "Postgraduate Diploma in Bank Management",
      "Production Engineering",
      "Psychiatrist",
      "Radio Jockey",
      "Radiology Courses",
      "Retail Design",
      "Robotics Engineering",
      "Software Engineering",
      "Structural Engineering",
      "Tally Course",
      "Tax Law",
      "Teacher Training",
      "Telecommunication Engineering Courses",
      "Textile Designing",
      "Textile Engineering Courses",
      "Toy Design",
      "Transportation Design",
      "Travel and Tourism Management Courses",
      "VFX & Animation Courses",
      "Visual Merchandising",
      "Vocational Courses",
      "Water Resources Engineering",
      "Web Designing",
    ]
    setDegrees(degreesData)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    const field = name.split(".")[0]
    const value = name.split(".")[1]

    setFormData((prev) => {
      const currentValues = [...(prev[field as keyof typeof prev] as string[])]

      if (checked) {
        if (!currentValues.includes(value)) {
          return { ...prev, [field]: [...currentValues, value] }
        }
      } else {
        return { ...prev, [field]: currentValues.filter((item) => item !== value) }
      }

      return prev
    })
  }

  const handleEducationChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const education = [...prev.education]
      education[index] = { ...education[index], [field]: value }
      return { ...prev, education }
    })
  }

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          level: "",
          mode: "",
          degree: "",
          institution: "",
          startYear: "",
          endYear: "",
          percentage: "",
        },
      ],
    }))

    // Add an empty search term for the new education entry
    setDegreeSearchTerms((prev) => [...prev, ""])
  }

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))

    // Remove the corresponding search term
    setDegreeSearchTerms((prev) => prev.filter((_, i) => i !== index))
  }

  const handleExperienceChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const workExperience = [...prev.workExperience]
      workExperience[index] = { ...workExperience[index], [field]: value }
      return { ...prev, workExperience }
    })
  }

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          title: "",
          department: "",
          companyName: "",
          tenure: "",
          summary: "",
        },
      ],
    }))
  }

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index),
    }))
  }

  const addSkill = () => {
    if (currentSkill && !formData.skills.includes(currentSkill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill],
      }))
      setCurrentSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const addPreferredCity = () => {
    if (currentCity && !formData.preferredCities.includes(currentCity)) {
      setFormData((prev) => ({
        ...prev,
        preferredCities: [...prev.preferredCities, currentCity],
      }))
      setCurrentCity("")
    }
  }

  const removePreferredCity = (city: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCities: prev.preferredCities.filter((c) => c !== city),
    }))
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "resume" | "videoResume" | "audioBiodata" | "photograph",
  ) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles((prev) => ({
        ...prev,
        [fileType]: e.target.files![0],
      }))
    }
  }

  const uploadFile = async (file: File, fileType: string): Promise<string> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileType", fileType)

      const response = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Upload error response:", errorData)
        throw new Error(`Failed to upload ${fileType}`)
      }

      const data = await response.json()
      console.log(`${fileType} upload response:`, data)

      if (!data.success || !data.url) {
        console.error("Invalid upload response:", data)
        throw new Error(data.message || `No URL returned from ${fileType} upload`)
      }

      return data.url
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadFile = async (fileType: "resume" | "videoResume" | "audioBiodata" | "photograph") => {
    const file = selectedFiles[fileType]
    if (!file) {
      toast.error(`Please select a ${fileType} file first`)
      return
    }

    try {
      setIsUploading(true)
      const url = await uploadFile(file, fileType)

      const urlFieldMap = {
        resume: "resumeUrl",
        videoResume: "videoResumeUrl",
        audioBiodata: "audioBiodataUrl",
        photograph: "photographUrl",
      }

      const urlField = urlFieldMap[fileType]

      setUploadedUrls((prev) => ({
        ...prev,
        [urlField]: url,
      }))

      setFormData((prev) => ({
        ...prev,
        [urlField]: url,
      }))

      toast.success(`${fileType} uploaded successfully`)
    } catch (error) {
      console.error(`${fileType} upload failed:`, error)
      toast.error(`${fileType} upload failed: ${error instanceof Error ? error.message : "Please try again"}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle city search
  const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setCitySearchTerm(searchTerm)

    if (searchTerm.length > 0) {
      const filtered = cities.filter((item) => item.city.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredCities(filtered)
      setShowCityDropdown(true)
    } else {
      setFilteredCities([])
      setShowCityDropdown(false)
    }
  }

  // Handle city selection
  const handleCitySelect = (city: string, state: string) => {
    setFormData((prev) => ({
      ...prev,
      currentCity: city,
      currentState: state,
    }))
    setCitySearchTerm(city)
    setShowCityDropdown(false)
  }

  // Handle degree search
  const handleDegreeSearch = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const searchTerm = e.target.value

    // Update the search term for this specific index
    const newSearchTerms = [...degreeSearchTerms]
    // Ensure the array has enough elements
    while (newSearchTerms.length <= index) {
      newSearchTerms.push("")
    }
    newSearchTerms[index] = searchTerm
    setDegreeSearchTerms(newSearchTerms)

    if (searchTerm.length > 0) {
      const filtered = degrees.filter((degree) => degree.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredDegrees(filtered)
      setActiveDegreeDropdownIndex(index)
    } else {
      setFilteredDegrees([])
      setActiveDegreeDropdownIndex(null)
    }
  }

  // Handle degree selection
  const handleDegreeSelect = (degree: string, index: number) => {
    handleEducationChange(index, "degree", degree)

    // Update the search term for this specific index
    const newSearchTerms = [...degreeSearchTerms]
    // Ensure the array has enough elements
    while (newSearchTerms.length <= index) {
      newSearchTerms.push("")
    }
    newSearchTerms[index] = degree
    setDegreeSearchTerms(newSearchTerms)

    setActiveDegreeDropdownIndex(null)
  }

  // Handle next button click to navigate to next tab
  const handleNextTab = () => {
    const tabOrder = ["personal", "education", "experience", "assets", "additional", "documents"]
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1])
    }
  }

  // Handle previous button click to navigate to previous tab
  const handlePreviousTab = () => {
    const tabOrder = ["personal", "education", "experience", "assets", "additional", "documents"]
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1])
    }
  }

  const validateForm = () => {
    // Required fields validation
    if (!formData.firstName) {
      toast.error("Please enter your first name")
      setActiveTab("personal")
      return false
    }

    if (!formData.lastName) {
      toast.error("Please enter your last name")
      setActiveTab("personal")
      return false
    }

    if (!formData.email) {
      toast.error("Please enter your email address")
      setActiveTab("personal")
      return false
    }

    // Check if resume is uploaded
    if (!formData.resumeUrl && !uploadedUrls.resumeUrl) {
      toast.error("Please upload your resume")
      setActiveTab("documents")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Check if resume is uploaded or needs to be uploaded
    let resumeUrl = formData.resumeUrl || uploadedUrls.resumeUrl

    if (!resumeUrl && selectedFiles.resume) {
      try {
        toast.info("Uploading resume...")
        resumeUrl = await uploadFile(selectedFiles.resume, "resume")
        setFormData((prev) => ({ ...prev, resumeUrl }))
      } catch (error) {
        console.error("Resume upload failed:", error)
        toast.error(`Resume upload failed: ${error instanceof Error ? error.message : "Please try again"}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Prepare the final form data with all fields
      const finalFormData = {
        ...formData,
        fullName: `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`, // Generate fullName from components
        resumeUrl,
        videoResumeUrl: formData.videoResumeUrl || uploadedUrls.videoResumeUrl,
        audioBiodataUrl: formData.audioBiodataUrl || uploadedUrls.audioBiodataUrl,
        photographUrl: formData.photographUrl || uploadedUrls.photographUrl,
        jobId,
      }

      // Submit application with all the data
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit application")
      }

      const responseData = await response.json()
      console.log("Application submission response:", responseData)

      toast.success("Application submitted successfully!")

      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/jobs/${jobId}/apply/success`)
      }, 2000)
    } catch (error) {
      console.error("Error submitting application:", error)
      if (
        error instanceof Error &&
        error.message &&
        error.message.toLowerCase().includes("already applied")
      ) {
        toast.error("You have already applied for this job.")
      } else {
        toast.error(`Failed to submit application: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle between sign-in and application form
  const toggleSignIn = () => {
    setShowSignIn(!showSignIn)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job
        </Button>

        {showSignIn ? (
          <SignIn jobId={jobId} onCancel={() => setShowSignIn(false)} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Apply for {job?.jobTitle || "Position"}</CardTitle>
              <CardDescription>
                Complete the form below to apply for this position at {job?.companyName || "the company"}
              </CardDescription>
              <div className="mt-4">
                <Button variant="outline" className="flex items-center" onClick={toggleSignIn}>
                  <UserRound className="h-4 w-4 mr-2" />
                  Already applied before? Sign in with your email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-6 mb-8">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="additional">Additional</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-4">
                    <div>
                      <Label htmlFor="salutation">Salutation</Label>
                      <select
                        id="salutation"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => handleSelectChange("salutation", e.target.value)}
                        value={formData.salutation}
                      >
                        <option value="" disabled>
                          Select salutation
                        </option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name*</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="first name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          placeholder="middle name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lastName">Last Name*</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address*</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="oddiant@example.com"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number*</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="alternativePhone">Alternative Phone</Label>
                        <Input
                          id="alternativePhone"
                          name="alternativePhone"
                          value={formData.alternativePhone}
                          onChange={handleChange}
                          placeholder="+1 (555) 987-6543"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth*</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div>
                        <Label>Gender*</Label>
                        <RadioGroup
                          value={formData.gender}
                          onValueChange={(value) => handleSelectChange("gender", value)}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Male</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Female</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other">Other</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentCity">Current City*</Label>
                        <div className="relative">
                          <input
                            id="currentCity"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={citySearchTerm}
                            onChange={handleCitySearch}
                            placeholder="Search for a city..."
                            required
                          />
                          {showCityDropdown && filteredCities.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredCities.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleCitySelect(item.city, item.state)}
                                >
                                  {item.city}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="currentState">Current State*</Label>
                        <Input
                          id="currentState"
                          name="currentState"
                          value={formData.currentState}
                          onChange={handleChange}
                          placeholder="New York"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pincode">Pincode*</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="10001"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="profileOutline">Profile Outline</Label>
                      <Textarea
                        id="profileOutline"
                        name="profileOutline"
                        value={formData.profileOutline}
                        onChange={handleChange}
                        placeholder="Brief description about yourself"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleNextTab}>
                        Next
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Education Tab */}
                  <TabsContent value="education" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Educational Qualifications</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                          <Plus className="h-4 w-4 mr-1" /> Add Education
                        </Button>
                      </div>

                      {formData.education.map((edu, index) => (
                        <Card key={index} className="relative">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Education #{index + 1}</h4>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEducation(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Level*</Label>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  onChange={(e) => handleEducationChange(index, "level", e.target.value)}
                                  value={edu.level}
                                >
                                  <option value="" disabled>
                                    Select level
                                  </option>
                                  <option value="High School">High School</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                                  <option value="Master's Degree">Master's Degree</option>
                                  <option value="PhD">PhD</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="Certificate">Certificate</option>
                                </select>
                              </div>

                              <div>
                                <Label>Mode*</Label>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  onChange={(e) => handleEducationChange(index, "mode", e.target.value)}
                                  value={edu.mode}
                                >
                                  <option value="" disabled>
                                    Select mode
                                  </option>
                                  <option value="Regular">Regular</option>
                                  <option value="Distance">Distance</option>
                                  <option value="Open Schooling">Open Schooling</option>
                                  <option value="Part Time">Part Time</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <Label>Degree/Course*</Label>
                              <div className="relative">
                                <input
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  value={degreeSearchTerms[index] || edu.degree}
                                  onChange={(e) => handleDegreeSearch(e, index)}
                                  placeholder="Type to search courses..."
                                />
                                {activeDegreeDropdownIndex === index && filteredDegrees.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {filteredDegrees.map((degree, idx) => (
                                      <div
                                        key={idx}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleDegreeSelect(degree, index)}
                                      >
                                        {degree}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label>School/College/University*</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                                placeholder="University name"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Starting Year*</Label>
                                <Input
                                  type="number"
                                  value={edu.startYear}
                                  onChange={(e) => handleEducationChange(index, "startYear", e.target.value)}
                                  placeholder="2018"
                                />
                              </div>

                              <div>
                                <Label>Ending Year*</Label>
                                <Input
                                  type="number"
                                  value={edu.endYear}
                                  onChange={(e) => handleEducationChange(index, "endYear", e.target.value)}
                                  placeholder="2022"
                                />
                              </div>

                              <div>
                                <Label>Percentage/CGPA*</Label>
                                <Input
                                  value={edu.percentage}
                                  onChange={(e) => handleEducationChange(index, "percentage", e.target.value)}
                                  placeholder="3.8"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Certifications</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              certifications: [...prev.certifications, ""],
                            }))
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Certification
                        </Button>
                      </div>

                      {formData.certifications.length === 0 && (
                        <div className="text-sm text-muted-foreground">No certifications added yet.</div>
                      )}

                      {formData.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={cert}
                            onChange={(e) => {
                              const newCertifications = [...formData.certifications]
                              newCertifications[index] = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                certifications: newCertifications,
                              }))
                            }}
                            placeholder="AWS Certified Solutions Architect"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                certifications: prev.certifications.filter((_, i) => i !== index),
                              }))
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-6">
                      <div className="flex space-x-3">
                        <Button type="button" onClick={handlePreviousTab}>
                          Previous
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                          Cancel
                        </Button>
                      </div>
                      <Button type="button" onClick={handleNextTab}>
                        Next
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Experience Tab */}
                  <TabsContent value="experience" className="space-y-6">
                    <div>
                      <Label htmlFor="totalExperience">Total Professional Experience (in years)*</Label>
                      <Input
                        id="totalExperience"
                        name="totalExperience"
                        type="number"
                        value={formData.totalExperience}
                        onChange={handleChange}
                        placeholder="5"
                      />
                    </div>

                    {/* Moved salary and notice period fields to experience section level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentSalary">Current Salary (per annum)</Label>
                        <Input
                          id="currentSalary"
                          name="currentSalary"
                          value={formData.currentSalary}
                          onChange={handleChange}
                          placeholder="e.g., 50000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="expectedSalary">Expected Salary (per annum)*</Label>
                        <Input
                          id="expectedSalary"
                          name="expectedSalary"
                          value={formData.expectedSalary}
                          onChange={handleChange}
                          placeholder="e.g., 60000"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="noticePeriod">Notice Period (in days)</Label>
                      <Input
                        id="noticePeriod"
                        name="noticePeriod"
                        value={formData.noticePeriod}
                        onChange={handleChange}
                        placeholder="e.g., 30"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Work Experience</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                          <Plus className="h-4 w-4 mr-1" /> Add Experience
                        </Button>
                      </div>

                      {formData.workExperience.map((exp, index) => (
                        <Card key={index} className="relative">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Experience #{index + 1}</h4>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExperience(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Title/Designation*</Label>
                                <Input
                                  value={exp.title}
                                  onChange={(e) => handleExperienceChange(index, "title", e.target.value)}
                                  placeholder="Software Engineer"
                                />
                              </div>

                              <div>
                                <Label>Department</Label>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  value={exp.department}
                                  onChange={(e) => handleExperienceChange(index, "department", e.target.value)}
                                >
                                  <option value="" disabled>
                                    Select department
                                  </option>
                                  {departments.map((dept, idx) => (
                                    <option key={idx} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Company Name*</Label>
                                <Input
                                  value={exp.companyName}
                                  onChange={(e) => handleExperienceChange(index, "companyName", e.target.value)}
                                  placeholder="ABC Technologies"
                                />
                              </div>

                              <div>
                                <Label>Tenure (e.g., "2 years 3 months")*</Label>
                                <Input
                                  value={exp.tenure}
                                  onChange={(e) => handleExperienceChange(index, "tenure", e.target.value)}
                                  placeholder="2 years 3 months"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Professional Summary</Label>
                              <Textarea
                                value={exp.summary}
                                onChange={(e) => handleExperienceChange(index, "summary", e.target.value)}
                                placeholder="Brief summary of your professional background"
                                rows={3}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div>
                      <Label>Shift Preference</Label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="shift-day"
                            checked={formData.shiftPreference.includes("day")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("shiftPreference.day", checked as boolean)
                            }
                          />
                          <Label htmlFor="shift-day">Day</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="shift-night"
                            checked={formData.shiftPreference.includes("night")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("shiftPreference.night", checked as boolean)
                            }
                          />
                          <Label htmlFor="shift-night">Night</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="shift-flexible"
                            checked={formData.shiftPreference.includes("flexible")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("shiftPreference.flexible", checked as boolean)
                            }
                          />
                          <Label htmlFor="shift-flexible">Flexible</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Preference Cities (Max 5)</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Input
                          value={currentCity}
                          onChange={(e) => setCurrentCity(e.target.value)}
                          placeholder="Enter city name"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addPreferredCity}
                          disabled={!currentCity || formData.preferredCities.length >= 5}
                        >
                          Add
                        </Button>
                      </div>

                      {formData.preferredCities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.preferredCities.map((city, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                            >
                              <span className="text-sm">{city}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePreferredCity(city)}
                                className="h-5 w-5 p-0 ml-1"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-6">
                      <div className="flex space-x-3">
                        <Button type="button" onClick={handlePreviousTab}>
                          Previous
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                          Cancel
                        </Button>
                      </div>
                      <Button type="button" onClick={handleNextTab}>
                        Next
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Assets Tab */}
                  <TabsContent value="assets" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Available Assets</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="asset-bike-car"
                            checked={formData.availableAssets.includes("bike_car")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("availableAssets.bike_car", checked as boolean)
                            }
                          />
                          <Label htmlFor="asset-bike-car">Bike / Car</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="asset-wifi"
                            checked={formData.availableAssets.includes("wifi")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("availableAssets.wifi", checked as boolean)
                            }
                          />
                          <Label htmlFor="asset-wifi">WiFi</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="asset-laptop"
                            checked={formData.availableAssets.includes("laptop")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("availableAssets.laptop", checked as boolean)
                            }
                          />
                          <Label htmlFor="asset-laptop">Laptop</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Identity Documents</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="doc-pan"
                            checked={formData.identityDocuments.includes("pan_card")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("identityDocuments.pan_card", checked as boolean)
                            }
                          />
                          <Label htmlFor="doc-pan">PAN Card</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="doc-aadhar"
                            checked={formData.identityDocuments.includes("aadhar")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("identityDocuments.aadhar", checked as boolean)
                            }
                          />
                          <Label htmlFor="doc-aadhar">Aadhar</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="doc-bank"
                            checked={formData.identityDocuments.includes("bank_account")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("identityDocuments.bank_account", checked as boolean)
                            }
                          />
                          <Label htmlFor="doc-bank">Bank Account</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="doc-voter"
                            checked={formData.identityDocuments.includes("voter_id")}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("identityDocuments.voter_id", checked as boolean)
                            }
                          />
                          <Label htmlFor="doc-voter">Voter ID / Passport / DL (Any)</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-6">
                      <div className="flex space-x-3">
                        <Button type="button" onClick={handlePreviousTab}>
                          Previous
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                          Cancel
                        </Button>
                      </div>
                      <Button type="button" onClick={handleNextTab}>
                        Next
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Additional Tab */}
                  <TabsContent value="additional" className="space-y-6">
                    <div>
                      <Label>Skills / Technologies (Max 10)</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Input
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          placeholder="Enter skill or technology"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addSkill}
                          disabled={!currentSkill || formData.skills.length >= 10}
                        >
                          Add
                        </Button>
                      </div>

                      {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.skills.map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                            >
                              <span className="text-sm">{skill}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSkill(skill)}
                                className="h-5 w-5 p-0 ml-1"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="portfolioLink">Portfolio Link</Label>
                      <Input
                        id="portfolioLink"
                        name="portfolioLink"
                        value={formData.portfolioLink}
                        onChange={handleChange}
                        placeholder="https://your-portfolio.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="socialMediaLink">Social Media Link</Label>
                      <Input
                        id="socialMediaLink"
                        name="socialMediaLink"
                        value={formData.socialMediaLink}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/your-profile"
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                      <Input
                        id="linkedIn"
                        name="linkedIn"
                        value={formData.linkedIn}
                        onChange={handleChange}
                        placeholder="linkedin.com/in/oddiant"
                      />
                    </div>

                    <div>
                      <Label htmlFor="coverLetter">Cover Letter</Label>
                      <Textarea
                        id="coverLetter"
                        name="coverLetter"
                        value={formData.coverLetter}
                        onChange={handleChange}
                        placeholder="Tell us why you're interested in this position..."
                        rows={5}
                      />
                    </div>

                    <div>
                      <Label htmlFor="additionalInfo">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleChange}
                        placeholder="Any other information you'd like to share..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-between mt-6">
                      <div className="flex space-x-3">
                        <Button type="button" onClick={handlePreviousTab}>
                          Previous
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                          Cancel
                        </Button>
                      </div>
                      <Button type="button" onClick={handleNextTab}>
                        Next
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="space-y-6">
                    <div>
                      <Label htmlFor="resume">Resume (PDF/DOC)*</Label>
                      <div className="mt-1">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="resume"
                              name="resume"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleFileChange(e, "resume")}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleUploadFile("resume")}
                              disabled={!selectedFiles.resume || isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                          {uploadedUrls.resumeUrl && (
                            <div className="text-sm text-green-600">
                              Resume uploaded successfully! ✓
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="videoResume">Video Resume (MP4)</Label>
                      <div className="mt-1">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="videoResume"
                              name="videoResume"
                              type="file"
                              accept=".mp4"
                              onChange={(e) => handleFileChange(e, "videoResume")}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleUploadFile("videoResume")}
                              disabled={!selectedFiles.videoResume || isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                          {uploadedUrls.videoResumeUrl && (
                            <div className="text-sm text-green-600">
                              Video Resume uploaded successfully! ✓
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="audioBiodata">Audio Biodata (MP3)</Label>
                      <div className="mt-1">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="audioBiodata"
                              name="audioBiodata"
                              type="file"
                              accept=".mp3"
                              onChange={(e) => handleFileChange(e, "audioBiodata")}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleUploadFile("audioBiodata")}
                              disabled={!selectedFiles.audioBiodata || isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                          {uploadedUrls.audioBiodataUrl && (
                            <div className="text-sm text-green-600">
                              Audio Biodata uploaded successfully! ✓
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="photograph">Photograph (JPG/PNG)</Label>
                      <div className="mt-1">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="photograph"
                              name="photograph"
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, "photograph")}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleUploadFile("photograph")}
                              disabled={!selectedFiles.photograph || isUploading}
                            >
                              {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                          {uploadedUrls.photographUrl && (
                            <div className="text-sm text-green-600">
                              Photograph uploaded successfully! ✓
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <div className="flex space-x-3">
                        <Button type="button" onClick={handlePreviousTab}>
                          Previous
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                          Cancel
                        </Button>
                      </div>
                      <Button type="submit" disabled={isSubmitting || isUploading}>
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Briefcase className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
