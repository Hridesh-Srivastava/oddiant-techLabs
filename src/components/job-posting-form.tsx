"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, X, Plus, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Department options
const departmentOptions = [
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
]

// Industry options
const industryOptions = [
  "Advertising/PR/Events",
  "Agriculture/Dairy/Forestry/Fishing",
  "Airlines/Aviation/Aerospace",
  "Architecture & Interior Design",
  "Automotive /Automobile",
  "Banking /Financial Services /NBFC /Fintech",
  "Beverages/Liquor",
  "Chemical /Fertilisers",
  "Computer Graphics",
  "Construction Materials",
  "Consulting Firms",
  "Cosmetic /Beauty Products",
  "Digital Marketing /Social Media",
  "Education",
  "Educational Institute /Higher Education /School",
  "E-Learning /Edutech",
  "Electrical Appliances & Manufacturing",
  "Electronics Manufacturing",
  "Engineering & Design",
  "Entertainment/Media/Publishing",
  "Farming",
  "Fashion/Apparels",
  "Feed Manufacturing",
  "FMCG",
  "FnB /QSR /Restaurants",
  "Food & Fruits Production/Edibles",
  "Fresher",
  "Gems & Jewellery",
  "Government/PSU/Defence",
  "Hardware /Steel /Iron",
  "Hardware Machinery & Equipments",
  "Heat Ventilation Air Conditioning (HVAC)",
  "Hospitality /Hotels",
  "Hospitals/Healthcare/Diagnostics",
  "Infrastructure /Construction & Engineering",
  "Insurance",
  "Internet/E-commerce",
  "IT/Computers - Hardware & Networking",
  "IT/Computers - Software",
  "ITES/BPO",
  "Jewellary /Gold/Diamonds",
  "KPO/Research/Analytics",
  "Law Enforcement/Security Services",
  "Leather",
  "Legal/Law Firm",
  "Logistics /Transportation & Courier",
  "Market Research",
  "Medical Equipment Manufacturing",
  "Mining",
  "NGO/Social Services",
  "Other",
  "Overseas /Immigration",
  "Paints & Febrication",
  "Petrolium & Natural Gas, Resources",
  "Pharma & Life Sciences",
  "Plastic,Rubber & Tyres",
  "Power/Energy",
  "Printing & Publications",
  "Real Estate",
  "Recruitment/Staffing/RPO",
  "Retail Outlets",
  "Semiconductor",
  "Shipping/Marine Services",
  "Stationary /Office Equipments",
  "Stoks & Brokrage /Investment Firm",
  "Telecom /ISP",
  "Textiles/Yarn/Fabrics/Garments",
  "Trading/Import/Export",
  "Travel/Tourism",
  "Waste Management & Treatment",
  "Wellness/Fitness/Sports",
  "Wood & Timber",
]

// Location data from the provided file
const locationData = [
  "Port Blair - Andaman and Nicobar Islands",
  "Adoni - Andhra Pradesh",
  "Amaravati - Andhra Pradesh",
  "Anantapur - Andhra Pradesh",
  "Chandragiri - Andhra Pradesh",
  "Chittoor - Andhra Pradesh",
  "Dowlaiswaram - Andhra Pradesh",
  "Eluru - Andhra Pradesh",
  "Guntur - Andhra Pradesh",
  "Kadapa - Andhra Pradesh",
  "Kakinada - Andhra Pradesh",
  "Kurnool - Andhra Pradesh",
  "Machilipatnam - Andhra Pradesh",
  "Nagarjunakoṇḍa - Andhra Pradesh",
  "Rajahmundry - Andhra Pradesh",
  "Srikakulam - Andhra Pradesh",
  "Tirupati - Andhra Pradesh",
  "Vijayawada - Andhra Pradesh",
  "Visakhapatnam - Andhra Pradesh",
  "Vizianagaram - Andhra Pradesh",
  "Yemmiganur - Andhra Pradesh",
  "Itanagar - Arunachal Pradesh",
  "Dhuburi - Assam",
  "Dibrugarh - Assam",
  "Dispur - Assam",
  "Guwahati - Assam",
  "Jorhat - Assam",
  "Nagaon - Assam",
  "Sivasagar - Assam",
  "Silchar - Assam",
  "Tezpur - Assam",
  "Tinsukia - Assam",
  "Ara - Bihar",
  "Barauni - Bihar",
  "Begusarai - Bihar",
  "Bettiah - Bihar",
  "Bhagalpur - Bihar",
  "Bihar Sharif - Bihar",
  "Bodh Gaya - Bihar",
  "Buxar - Bihar",
  "Chapra - Bihar",
  "Darbhanga - Bihar",
  "Dehri - Bihar",
  "Dinapur Nizamat - Bihar",
  "Gaya - Bihar",
  "Hajipur - Bihar",
  "Jamalpur - Bihar",
  "Katihar - Bihar",
  "Madhubani - Bihar",
  "Motihari - Bihar",
  "Munger - Bihar",
  "Muzaffarpur - Bihar",
  "Patna - Bihar",
  "Purnia - Bihar",
  "Pusa - Bihar",
  "Saharsa - Bihar",
  "Samastipur - Bihar",
  "Sasaram - Bihar",
  "Sitamarhi - Bihar",
  "Siwan - Bihar",
  "Chandigarh - Chandigarh",
  "Ambikapur - Chhattisgarh",
  "Bhilai - Chhattisgarh",
  "Bilaspur - Chhattisgarh",
  "Dhamtari - Chhattisgarh",
  "Durg - Chhattisgarh",
  "Jagdalpur - Chhattisgarh",
  "Raipur - Chhattisgarh",
  "Rajnandgaon - Chhattisgarh",
  "Daman - Dadra and Nagar Haveli and Daman and Diu",
  "Diu - Dadra and Nagar Haveli and Daman and Diu",
  "Silvassa - Dadra and Nagar Haveli and Daman and Diu",
  "Delhi - Delhi",
  "New Delhi - Delhi",
  "Madgaon - Goa",
  "Panaji - Goa",
  "Ahmadabad - Gujarat",
  "Amreli - Gujarat",
  "Bharuch - Gujarat",
  "Bhavnagar - Gujarat",
  "Bhuj - Gujarat",
  "Dwarka - Gujarat",
  "Gandhinagar - Gujarat",
  "Godhra - Gujarat",
  "Jamnagar - Gujarat",
  "Junagadh - Gujarat",
  "Kandla - Gujarat",
  "Khambhat - Gujarat",
  "Kheda - Gujarat",
  "Mahesana - Gujarat",
  "Morbi - Gujarat",
  "Nadiad - Gujarat",
  "Navsari - Gujarat",
  "Okha - Gujarat",
  "Palanpur - Gujarat",
  "Patan - Gujarat",
  "Porbandar - Gujarat",
  "Rajkot - Gujarat",
  "Surat - Gujarat",
  "Surendranagar - Gujarat",
  "Valsad - Gujarat",
  "Veraval - Gujarat",
  "Ambala - Haryana",
  "Bhiwani - Haryana",
  "Chandigarh - Haryana",
  "Faridabad - Haryana",
  "Firozpur Jhirka - Haryana",
  "Gurugram - Haryana",
  "Hansi - Haryana",
  "Hisar - Haryana",
  "Jind - Haryana",
  "Kaithal - Haryana",
  "Karnal - Haryana",
  "Kurukshetra - Haryana",
  "Panipat - Haryana",
  "Pehowa - Haryana",
  "Rewari - Haryana",
  "Rohtak - Haryana",
  "Sirsa - Haryana",
  "Sonipat - Haryana",
  "Bilaspur - Himachal Pradesh",
  "Chamba - Himachal Pradesh",
  "Dalhousie - Himachal Pradesh",
  "Dharmshala - Himachal Pradesh",
  "Hamirpur - Himachal Pradesh",
  "Kangra - Himachal Pradesh",
  "Kullu - Himachal Pradesh",
  "Mandi - Himachal Pradesh",
  "Nahan - Himachal Pradesh",
  "Shimla - Himachal Pradesh",
  "Una - Himachal Pradesh",
  "Anantnag - Jammu and Kashmir",
  "Baramula - Jammu and Kashmir",
  "Doda - Jammu and Kashmir",
  "Gulmarg - Jammu and Kashmir",
  "Jammu - Jammu and Kashmir",
  "Kathua - Jammu and Kashmir",
  "Punch - Jammu and Kashmir",
  "Rajouri - Jammu and Kashmir",
  "Srinagar - Jammu and Kashmir",
  "Udhampur - Jammu and Kashmir",
  "Bokaro - Jharkhand",
  "Chaibasa - Jharkhand",
  "Deoghar - Jharkhand",
  "Dhanbad - Jharkhand",
  "Dumka - Jharkhand",
  "Giridih - Jharkhand",
  "Hazaribag - Jharkhand",
  "Jamshedpur - Jharkhand",
  "Jharia - Jharkhand",
  "Rajmahal - Jharkhand",
  "Ranchi - Jharkhand",
  "Saraikela - Jharkhand",
  "Badami - Karnataka",
  "Ballari - Karnataka",
  "Bengaluru - Karnataka",
  "Belagavi - Karnataka",
  "Bhadravati - Karnataka",
  "Bidar - Karnataka",
  "Chikkamagaluru - Karnataka",
  "Chitradurga - Karnataka",
  "Davangere - Karnataka",
  "Halebidu - Karnataka",
  "Hassan - Karnataka",
  "Hubballi-Dharwad - Karnataka",
  "Kalaburagi - Karnataka",
  "Kolar - Karnataka",
  "Madikeri - Karnataka",
  "Mandya - Karnataka",
  "Mangaluru - Karnataka",
  "Mysuru - Karnataka",
  "Raichur - Karnataka",
  "Shivamogga / Shimoga - Karnataka",
  "Shravanabelagola - Karnataka",
  "Shrirangapattana - Karnataka",
  "Tumakuru - Karnataka",
  "Vijayapura - Karnataka",
  "Alappuzha - Kerala",
  "Vatakara - Kerala",
  "Idukki - Kerala",
  "Kannur - Kerala",
  "Kochi - Kerala",
  "Kollam - Kerala",
  "Kottayam - Kerala",
  "Kozhikode - Kerala",
  "Mattancheri - Kerala",
  "Palakkad - Kerala",
  "Thalassery - Kerala",
  "Thiruvananthapuram - Kerala",
  "Thrissur - Kerala",
  "Kargil - Ladakh",
  "Leh - Ladakh",
  "Balaghat - Madhya Pradesh",
  "Barwani - Madhya Pradesh",
  "Betul - Madhya Pradesh",
  "Bharhut - Madhya Pradesh",
  "Bhind - Madhya Pradesh",
  "Bhojpur - Madhya Pradesh",
  "Bhopal - Madhya Pradesh",
  "Burhanpur - Madhya Pradesh",
  "Chhatarpur - Madhya Pradesh",
  "Chhindwara - Madhya Pradesh",
  "Damoh - Madhya Pradesh",
  "Datia - Madhya Pradesh",
  "Dewas - Madhya Pradesh",
  "Dhar - Madhya Pradesh",
  "Dr. Ambedkar Nagar (Mhow) - Madhya Pradesh",
  "Guna - Madhya Pradesh",
  "Gwalior - Madhya Pradesh",
  "Hoshangabad - Madhya Pradesh",
  "Indore - Madhya Pradesh",
  "Itarsi - Madhya Pradesh",
  "Jabalpur - Madhya Pradesh",
  "Jhabua - Madhya Pradesh",
  "Khajuraho - Madhya Pradesh",
  "Khandwa - Madhya Pradesh",
  "Khargone - Madhya Pradesh",
  "Maheshwar - Madhya Pradesh",
  "Mandla - Madhya Pradesh",
  "Mandsaur - Madhya Pradesh",
  "Morena - Madhya Pradesh",
  "Murwara - Madhya Pradesh",
  "Narsimhapur - Madhya Pradesh",
  "Narsinghgarh - Madhya Pradesh",
  "Narwar - Madhya Pradesh",
  "Neemuch - Madhya Pradesh",
  "Nowgong - Madhya Pradesh",
  "Orchha - Madhya Pradesh",
  "Panna - Madhya Pradesh",
  "Raisen - Madhya Pradesh",
  "Rajgarh - Madhya Pradesh",
  "Ratlam - Madhya Pradesh",
  "Rewa - Madhya Pradesh",
  "Sagar - Madhya Pradesh",
  "Sarangpur - Madhya Pradesh",
  "Satna - Madhya Pradesh",
  "Sehore - Madhya Pradesh",
  "Seoni - Madhya Pradesh",
  "Shahdol - Madhya Pradesh",
  "Shajapur - Madhya Pradesh",
  "Sheopur - Madhya Pradesh",
  "Shivpuri - Madhya Pradesh",
  "Ujjain - Madhya Pradesh",
  "Vidisha - Madhya Pradesh",
  "Ahmadnagar - Maharashtra",
  "Akola - Maharashtra",
  "Amravati - Maharashtra",
  "Aurangabad - Maharashtra",
  "Bhandara - Maharashtra",
  "Bhusawal - Maharashtra",
  "Bid - Maharashtra",
  "Buldhana - Maharashtra",
  "Chandrapur - Maharashtra",
  "Daulatabad - Maharashtra",
  "Dhule - Maharashtra",
  "Jalgaon - Maharashtra",
  "Kalyan - Maharashtra",
  "Karli - Maharashtra",
  "Kolhapur - Maharashtra",
  "Mahabaleshwar - Maharashtra",
  "Malegaon - Maharashtra",
  "Matheran - Maharashtra",
  "Mumbai - Maharashtra",
  "Nagpur - Maharashtra",
  "Nanded - Maharashtra",
  "Nashik - Maharashtra",
  "Osmanabad - Maharashtra",
  "Pandharpur - Maharashtra",
  "Parbhani - Maharashtra",
  "Pune - Maharashtra",
  "Ratnagiri - Maharashtra",
  "Sangli - Maharashtra",
  "Satara - Maharashtra",
  "Sevagram - Maharashtra",
  "Solapur - Maharashtra",
  "Thane - Maharashtra",
  "Ulhasnagar - Maharashtra",
  "Vasai-Virar - Maharashtra",
  "Wardha - Maharashtra",
  "Yavatmal - Maharashtra",
  "Imphal - Manipur",
  "Cherrapunji - Meghalaya",
  "Shillong - Meghalaya",
  "Aizawl - Mizoram",
  "Lunglei - Mizoram",
  "Kohima - Nagaland",
  "Mon - Nagaland",
  "Phek - Nagaland",
  "Wokha - Nagaland",
  "Zunheboto - Nagaland",
  "Balangir - Odisha",
  "Baleshwar - Odisha",
  "Baripada - Odisha",
  "Bhubaneshwar - Odisha",
  "Brahmapur - Odisha",
  "Cuttack - Odisha",
  "Dhenkanal - Odisha",
  "Kendujhar - Odisha",
  "Konark - Odisha",
  "Koraput - Odisha",
  "Paradip - Odisha",
  "Phulabani - Odisha",
  "Puri - Odisha",
  "Sambalpur - Odisha",
  "Udayagiri - Odisha",
  "Karaikal - Puducherry",
  "Mahe - Puducherry",
  "Puducherry - Puducherry",
  "Yanam - Puducherry",
  "Amritsar - Punjab",
  "Batala - Punjab",
  "Chandigarh - Punjab",
  "Faridkot - Punjab",
  "Firozpur - Punjab",
  "Gurdaspur - Punjab",
  "Hoshiarpur - Punjab",
  "Jalandhar - Punjab",
  "Kapurthala - Punjab",
  "Ludhiana - Punjab",
  "Nabha - Punjab",
  "Patiala - Punjab",
  "Rupnagar - Punjab",
  "Sangrur - Punjab",
  "Abu - Rajasthan",
  "Ajmer - Rajasthan",
  "Alwar - Rajasthan",
  "Amer - Rajasthan",
  "Barmer - Rajasthan",
  "Beawar - Rajasthan",
  "Bharatpur - Rajasthan",
  "Bhilwara - Rajasthan",
  "Bikaner - Rajasthan",
  "Bundi - Rajasthan",
  "Chittaurgarh - Rajasthan",
  "Churu - Rajasthan",
  "Dhaulpur - Rajasthan",
  "Dungarpur - Rajasthan",
  "Ganganagar - Rajasthan",
  "Hanumangarh - Rajasthan",
  "Jaipur - Rajasthan",
  "Jaisalmer - Rajasthan",
  "Jalor - Rajasthan",
  "Jhalawar - Rajasthan",
  "Jhunjhunu - Rajasthan",
  "Jodhpur - Rajasthan",
  "Kishangarh - Rajasthan",
  "Kota - Rajasthan",
  "Merta - Rajasthan",
  "Nagaur - Rajasthan",
  "Nathdwara - Rajasthan",
  "Pali - Rajasthan",
  "Phalodi - Rajasthan",
  "Pushkar - Rajasthan",
  "Sawai Madhopur - Rajasthan",
  "Shahpura - Rajasthan",
  "Sikar - Rajasthan",
  "Sirohi - Rajasthan",
  "Tonk - Rajasthan",
  "Udaipur - Rajasthan",
  "Gangtok - Sikkim",
  "Gyalshing - Sikkim",
  "Lachung - Sikkim",
  "Mangan - Sikkim",
  "Arcot - Tamil Nadu",
  "Chengalpattu - Tamil Nadu",
  "Chennai - Tamil Nadu",
  "Chidambaram - Tamil Nadu",
  "Coimbatore - Tamil Nadu",
  "Cuddalore - Tamil Nadu",
  "Dharmapuri - Tamil Nadu",
  "Dindigul - Tamil Nadu",
  "Erode - Tamil Nadu",
  "Kanchipuram - Tamil Nadu",
  "Kanniyakumari - Tamil Nadu",
  "Kodaikanal - Tamil Nadu",
  "Kumbakonam - Tamil Nadu",
  "Madurai - Tamil Nadu",
  "Mamallapuram - Tamil Nadu",
  "Nagappattinam - Tamil Nadu",
  "Nagercoil - Tamil Nadu",
  "Palayamkottai - Tamil Nadu",
  "Pudukkottai - Tamil Nadu",
  "Rajapalayam - Tamil Nadu",
  "Ramanathapuram - Tamil Nadu",
  "Salem - Tamil Nadu",
  "Thanjavur - Tamil Nadu",
  "Tiruchchirappalli - Tamil Nadu",
  "Tirunelveli - Tamil Nadu",
  "Tiruppur - Tamil Nadu",
  "Thoothukudi - Tamil Nadu",
  "Udhagamandalam - Tamil Nadu",
  "Vellore - Tamil Nadu",
  "Hyderabad - Telangana",
  "Karimnagar - Telangana",
  "Khammam - Telangana",
  "Mahbubnagar - Telangana",
  "Nizamabad - Telangana",
  "Sangareddi - Telangana",
  "Warangal - Telangana",
  "Agartala - Tripura",
  "Agra - Uttar Pradesh",
  "Aligarh - Uttar Pradesh",
  "Amroha - Uttar Pradesh",
  "Ayodhya - Uttar Pradesh",
  "Azamgarh - Uttar Pradesh",
  "Bahraich - Uttar Pradesh",
  "Ballia - Uttar Pradesh",
  "Banda - Uttar Pradesh",
  "Bara Banki - Uttar Pradesh",
  "Bareilly - Uttar Pradesh",
  "Basti - Uttar Pradesh",
  "Bijnor - Uttar Pradesh",
  "Bithur - Uttar Pradesh",
  "Budaun - Uttar Pradesh",
  "Bulandshahr - Uttar Pradesh",
  "Deoria - Uttar Pradesh",
  "Etah - Uttar Pradesh",
  "Etawah - Uttar Pradesh",
  "Faizabad - Uttar Pradesh",
  "Farrukhabad-cum-Fatehgarh - Uttar Pradesh",
  "Fatehpur - Uttar Pradesh",
  "Fatehpur Sikri - Uttar Pradesh",
  "Ghaziabad - Uttar Pradesh",
  "Ghazipur - Uttar Pradesh",
  "Gonda - Uttar Pradesh",
  "Gorakhpur - Uttar Pradesh",
  "Hamirpur - Uttar Pradesh",
  "Hardoi - Uttar Pradesh",
  "Hathras - Uttar Pradesh",
  "Jalaun - Uttar Pradesh",
  "Jaunpur - Uttar Pradesh",
  "Jhansi - Uttar Pradesh",
  "Kannauj - Uttar Pradesh",
  "Kanpur - Uttar Pradesh",
  "Lakhimpur - Uttar Pradesh",
  "Lalitpur - Uttar Pradesh",
  "Lucknow - Uttar Pradesh",
  "Mainpuri - Uttar Pradesh",
  "Mathura - Uttar Pradesh",
  "Meerut - Uttar Pradesh",
  "Mirzapur-Vindhyachal - Uttar Pradesh",
  "Moradabad - Uttar Pradesh",
  "Muzaffarnagar - Uttar Pradesh",
  "Partapgarh - Uttar Pradesh",
  "Pilibhit - Uttar Pradesh",
  "Prayagraj - Uttar Pradesh",
  "Rae Bareli - Uttar Pradesh",
  "Rampur - Uttar Pradesh",
  "Saharanpur - Uttar Pradesh",
  "Sambhal - Uttar Pradesh",
  "Shahjahanpur - Uttar Pradesh",
  "Sitapur - Uttar Pradesh",
  "Sultanpur - Uttar Pradesh",
  "Tehri - Uttar Pradesh",
  "Varanasi - Uttar Pradesh",
  "Almora - Uttarakhand",
  "Dehra Dun - Uttarakhand",
  "Haridwar - Uttarakhand",
  "Mussoorie - Uttarakhand",
  "Nainital - Uttarakhand",
  "Pithoragarh - Uttarakhand",
  "Alipore - West Bengal",
  "Alipur Duar - West Bengal",
  "Asansol - West Bengal",
  "Baharampur - West Bengal",
  "Bally - West Bengal",
  "Balurghat - West Bengal",
  "Bankura - West Bengal",
  "Baranagar - West Bengal",
  "Barasat - West Bengal",
  "Barrackpore - West Bengal",
  "Basirhat - West Bengal",
  "Bhatpara - West Bengal",
  "Bishnupur - West Bengal",
  "Budge Budge - West Bengal",
  "Burdwan - West Bengal",
  "Chandernagore - West Bengal",
  "Darjeeling - West Bengal",
  "Diamond Harbour - West Bengal",
  "Dum Dum - West Bengal",
  "Durgapur - West Bengal",
  "Halisahar - West Bengal",
  "Haora - West Bengal",
  "Hugli - West Bengal",
  "Ingraj Bazar - West Bengal",
  "Jalpaiguri - West Bengal",
  "Kalimpong - West Bengal",
  "Kamarhati - West Bengal",
  "Kanchrapara - West Bengal",
  "Kharagpur - West Bengal",
  "Cooch Behar - West Bengal",
  "Kolkata - West Bengal",
  "Krishnanagar - West Bengal",
  "Malda - West Bengal",
  "Midnapore - West Bengal",
  "Murshidabad - West Bengal",
  "Nabadwip - West Bengal",
  "Palashi - West Bengal",
  "Panihati - West Bengal",
  "Purulia - West Bengal",
  "Raiganj - West Bengal",
  "Santipur - West Bengal",
  "Shantiniketan - West Bengal",
  "Shrirampur - West Bengal",
  "Siliguri - West Bengal",
  "Siuri - West Bengal",
  "Tamluk - West Bengal",
  "Titagarh - West Bengal",
  "Remote",
  "Noida - Uttar Pradesh",
  "Gurugram - Haryana",
]

// List of inappropriate words to filter (English and Hindi)
const inappropriateWords = [
  // English inappropriate words
  "sex",
  "porn",
  "xxx",
  "adult",
  "nude",
  "naked",
  "fuck",
  "shit",
  "ass",
  "damn",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "pussy",
  "cock",
  "penis",
  "vagina",
  "boob",
  "whore",
  "slut",
  "hoe",
  "hooker",
  "prostitute",
  "masturbate",
  "orgasm",
  "cum",
  "ejaculate",
  "fap",
  "fapping",
  "nigga",
  "nigger",
  "asshole",
  
  // Hindi inappropriate words (romanized)
  "chutiya",
  "bhosdi",
  "gandu",
  "lund",
  "lauda",
  "chut",
  "randi",
  "bhosdike",
  "madarchod",
  "behenchod",
  "behen chod",
  "maderchod",
  "gaand",
  "chodu",
  "loda",
  "jhaat",
  "harami",
  "saala",
  "kutte",
  "kamina",
  "chutia",
  "harami",
  "bhen ki",
  "bhen ki lund",
  "bhen ki gaand",
  "bhen ki chudai",
  "haramzada"
]

interface JobPostingFormProps {
  jobId?: string
  isEditing?: boolean
  isSubmitting?: boolean
  onSubmit?: (data: any) => Promise<void>
  initialData?: any
}

const JobPostingForm: React.FC<JobPostingFormProps> = ({
  jobId,
  isEditing = false,
  isSubmitting = false,
  onSubmit,
  initialData,
}) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [jobLocation, setJobLocation] = useState("")
  const [locationSearchTerm, setLocationSearchTerm] = useState("")
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const [experienceRange, setExperienceRange] = useState("")
  const [jobType, setJobType] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [industry, setIndustry] = useState("")
  const [industrySearchTerm, setIndustrySearchTerm] = useState("")
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [filteredIndustries, setFilteredIndustries] = useState<string[]>([])
  const [department, setDepartment] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [hasInappropriateContent, setHasInappropriateContent] = useState(false)
  const [educationalPreference, setEducationalPreference] = useState("")
  const [shiftPreference, setShiftPreference] = useState<string[]>([])
  const [genderPreference, setGenderPreference] = useState<string[]>([])
  const [assetsRequirement, setAssetsRequirement] = useState({
    wifi: false,
    laptop: false,
    vehicle: false,
  })
  const [companyName, setCompanyName] = useState("")
  const [aboutCompany, setAboutCompany] = useState("")
  const [websiteLink, setWebsiteLink] = useState("")
  const [questions, setQuestions] = useState<string[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [answers, setAnswers] = useState<string[]>([])

  const locationDropdownRef = useRef<HTMLDivElement>(null)
  const industryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (jobId && isEditing) {
      fetchJobDetails()
    } else if (initialData && !isEditing) {
    // Populate form with initialData for new job creation
    populateFormWithData(initialData)
  }
  }, [jobId, isEditing, initialData])

  useEffect(() => {
    // Filter locations based on search term
    if (locationSearchTerm) {
      const filtered = locationData.filter((location) =>
        location.toLowerCase().includes(locationSearchTerm.toLowerCase()),
      )
      setFilteredLocations(filtered)
    } else {
      setFilteredLocations([])
    }
  }, [locationSearchTerm])

  useEffect(() => {
    // Filter industries based on search term
    if (industrySearchTerm) {
      const filtered = industryOptions.filter((industry) =>
        industry.toLowerCase().includes(industrySearchTerm.toLowerCase()),
      )
      setFilteredIndustries(filtered)
    } else {
      setFilteredIndustries([])
    }
  }, [industrySearchTerm])

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false)
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setShowIndustryDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employee/jobs/${jobId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch job details")
      }

      const data = await response.json()
      const job = data.job

      // Populate form fields with job data
      setJobTitle(job.jobTitle || "")
      setJobLocation(job.jobLocation || "")
      setExperienceRange(job.experienceRange || "")
      setJobType(job.jobType || "")
      setSalaryRange(job.salaryRange || "")
      setIndustry(job.industry || "")
      setDepartment(job.department || "")
      setSkills(job.skills || [])
      setJobDescription(job.jobDescription || "")
      setEducationalPreference(job.educationalPreference || "")
      setShiftPreference(job.shiftPreference || [])
      setGenderPreference(job.genderPreference || [])
      setAssetsRequirement(job.assetsRequirement || { wifi: false, laptop: false, vehicle: false })
      setCompanyName(job.companyName || "")
      setAboutCompany(job.aboutCompany || "")
      setWebsiteLink(job.websiteLink || "")
      setQuestions(job.questions || [])
      setAnswers(job.answers || [])
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast.error("Failed to load job details")
    } finally {
      setIsLoading(false)
    }
  }

  const populateFormWithData = (data: any) => {
  setJobTitle(data.jobTitle || "")
  setJobLocation(data.jobLocation || "")
  setExperienceRange(data.experienceRange || "")
  setJobType(data.jobType || "")
  setSalaryRange(data.salaryRange || "")
  setIndustry(data.industry || "")
  setDepartment(data.department || "")
  setSkills(data.skills || [])
  setJobDescription(data.jobDescription || "")
  setEducationalPreference(data.educationalPreference || "")
  setShiftPreference(data.shiftPreference || [])
  setGenderPreference(data.genderPreference || [])
  setAssetsRequirement(data.assetsRequirement || { wifi: false, laptop: false, vehicle: false })
  setCompanyName(data.companyName || "")
  setAboutCompany(data.aboutCompany || "")
  setWebsiteLink(data.websiteLink || "")
  setQuestions(data.questions || [])
  setAnswers(data.answers || [])
}

  // Check for inappropriate content in job description
  const checkForInappropriateContent = (text: string) => {
    const words = text.toLowerCase().split(/\s+/)
    return words.some((word) => inappropriateWords.some((inappropriate) => word.includes(inappropriate)))
  }

  const handleJobDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setJobDescription(newText)
    setHasInappropriateContent(checkForInappropriateContent(newText))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && skills.length < 10) {
      setSkills([...skills, newSkill.trim().startsWith("#") ? newSkill.trim() : `#${newSkill.trim()}`])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...skills]
    updatedSkills.splice(index, 1)
    setSkills(updatedSkills)
  }

  const handleAddQuestion = () => {
    if (newQuestion.trim() !== "" && questions.length < 10) {
      setQuestions([...questions, newQuestion.trim()])
      setAnswers([...answers, ""])
      setNewQuestion("")
    }
  }

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions.splice(index, 1)
    const updatedAnswers = [...answers]
    updatedAnswers.splice(index, 1)
    setQuestions(updatedQuestions)
    setAnswers(updatedAnswers)
  }

  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...answers]
    updatedAnswers[index] = value
    setAnswers(updatedAnswers)
  }

  const handleLocationSelect = (location: string) => {
    setJobLocation(location)
    setLocationSearchTerm("")
    setShowLocationDropdown(false)
  }

  const handleIndustrySelect = (industry: string) => {
    setIndustry(industry)
    setIndustrySearchTerm("")
    setShowIndustryDropdown(false)
  }

  const validateForm = () => {
    if (!jobTitle) {
      toast.error("Job title is required")
      return false
    }
    if (!jobLocation) {
      toast.error("Job location is required")
      return false
    }
    if (!experienceRange) {
      toast.error("Experience range is required")
      return false
    }
    if (!jobType) {
      toast.error("Job type is required")
      return false
    }
    if (!jobDescription) {
      toast.error("Job description is required")
      return false
    }
    if (hasInappropriateContent) {
      toast.error("Job description contains inappropriate content")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)

      const formData = {
        jobTitle,
        jobLocation,
        experienceRange,
        jobType,
        salaryRange,
        industry,
        department,
        skills,
        jobDescription,
        educationalPreference,
        shiftPreference,
        genderPreference,
        assetsRequirement,
        companyName,
        aboutCompany,
        websiteLink,
        questions,
        answers,
      }

      if (onSubmit) {
        // Use the provided onSubmit function if available
        await onSubmit(formData)
      } else {
        // Otherwise use the default implementation
        const url = isEditing ? `/api/employee/jobs/${jobId}` : "/api/employee/jobs"
        const method = isEditing ? "PUT" : "POST"

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error(`Failed to ${isEditing ? "update" : "create"} job posting`)
        }

        toast.success(`Job posting ${isEditing ? "updated" : "created"} successfully!`)
        router.push("/employee/dashboard?tab=jobs")
        router.refresh()
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} job posting:`, error)
      toast.error(`Failed to ${isEditing ? "update" : "create"} job posting`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Job Details */}
      <h3 className="text-lg font-medium">Job Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="jobTitle">Job Title*</Label>
          <Input
            type="text"
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            required
          />
        </div>
        <div>
          <Label htmlFor="jobLocation">Job Location*</Label>
          <div className="relative" ref={locationDropdownRef}>
            <input
              type="text"
              id="jobLocation"
              value={jobLocation}
              onChange={(e) => {
                setJobLocation(e.target.value)
                setLocationSearchTerm(e.target.value)
                setShowLocationDropdown(true)
              }}
              onClick={() => setShowLocationDropdown(true)}
              placeholder="e.g. Noida - Uttar Pradesh or Remote"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
              required
            />
            {showLocationDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={locationSearchTerm}
                  onChange={(e) => setLocationSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600"
                />
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No locations found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="experienceRange">Experience Range*</Label>
          <select
            id="experienceRange"
            value={experienceRange}
            onChange={(e) => setExperienceRange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            required
          >
            <option value="">Select range</option>
            <option value="fresher">Fresher</option>
            <option value="0-2">0-2 years</option>
            <option value="2-5">2-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>
        <div>
          <Label htmlFor="jobType">Type of Job*</Label>
          <select
            id="jobType"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            required
          >
            <option value="">Select type</option>
            <option value="onsite">Onsite</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <Label htmlFor="salaryRange">Salary Range</Label>
          <Input
            type="text"
            id="salaryRange"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
            placeholder="e.g. Rs. 80,000 - Rs. 100,000"
          />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <div className="relative" ref={industryDropdownRef}>
            <input
              type="text"
              id="industry"
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value)
                setIndustrySearchTerm(e.target.value)
                setShowIndustryDropdown(true)
              }}
              onClick={() => setShowIndustryDropdown(true)}
              placeholder="e.g. Technology"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            {showIndustryDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={industrySearchTerm}
                  onChange={(e) => setIndustrySearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600"
                />
                {filteredIndustries.length > 0 ? (
                  filteredIndustries.map((industry, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleIndustrySelect(industry)}
                    >
                      {industry}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No industries found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <option value="">Select department</option>
            {departmentOptions.map((dept, index) => (
              <option key={index} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label>Skills (Max 10)</Label>
        <div className="flex flex-wrap gap-2 min-h-10">
          {skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="px-2 py-1">
              {skill}
              <Button variant="ghost" size="sm" onClick={() => handleRemoveSkill(index)} className="ml-1 h-4 w-4 p-0">
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Add skill (e.g. React, JavaScript)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSkill()
              }
            }}
          />
          <Button type="button" size="sm" onClick={handleAddSkill} disabled={skills.length >= 10 || !newSkill.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Job Description */}
      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description* (up to 750 words)</Label>
        <Textarea
          id="jobDescription"
          value={jobDescription}
          onChange={handleJobDescriptionChange}
          rows={5}
          maxLength={4000}
          placeholder="Describe the job responsibilities, requirements, and any other relevant information"
          required
          className={hasInappropriateContent ? "border-red-500 focus:ring-red-500" : ""}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {jobDescription.split(/\s+/).filter(Boolean).length} / 750 words
        </p>
        {hasInappropriateContent && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Job description contains inappropriate content. Please remove any offensive or adult language.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Educational Preference */}
      <div className="space-y-2">
        <Label htmlFor="educationalPreference">Educational Preference</Label>
        <select
          id="educationalPreference"
          value={educationalPreference}
          onChange={(e) => setEducationalPreference(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <option value="">Select preference</option>
          <option value="any_high_school">Any High School</option>
          <option value="any_intermediate">Any Intermediate</option>
          <option value="any_bachelors">Any Bachelor's Degree</option>
          <option value="any_masters">Any Master's Degree</option>
          <option value="any_phd">Any PhD</option>
          <option value="any_diploma">Any Diploma</option>
          <option value="any_certificate">Any Certificate</option>
          <option value="none">No Preference</option>
        </select>
      </div>

      {/* Other Details */}
      <h3 className="text-lg font-medium">Other Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Shift Preference</Label>
          <div className="flex flex-col space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shiftDay"
                checked={shiftPreference.includes("day")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShiftPreference([...shiftPreference, "day"])
                  } else {
                    setShiftPreference(shiftPreference.filter((pref) => pref !== "day"))
                  }
                }}
              />
              <Label htmlFor="shiftDay" className="font-normal">
                Day
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shiftNight"
                checked={shiftPreference.includes("night")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShiftPreference([...shiftPreference, "night"])
                  } else {
                    setShiftPreference(shiftPreference.filter((pref) => pref !== "night"))
                  }
                }}
              />
              <Label htmlFor="shiftNight" className="font-normal">
                Night
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shiftRotational"
                checked={shiftPreference.includes("rotational")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShiftPreference([...shiftPreference, "rotational"])
                  } else {
                    setShiftPreference(shiftPreference.filter((pref) => pref !== "rotational"))
                  }
                }}
              />
              <Label htmlFor="shiftRotational" className="font-normal">
                Rotational
              </Label>
            </div>
          </div>
        </div>

        <div>
          <Label>Assets Requirement</Label>
          <div className="flex flex-col space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assetWifi"
                checked={assetsRequirement.wifi}
                onCheckedChange={(checked) => setAssetsRequirement({ ...assetsRequirement, wifi: !!checked })}
              />
              <Label htmlFor="assetWifi" className="font-normal">
                Wifi
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assetLaptop"
                checked={assetsRequirement.laptop}
                onCheckedChange={(checked) => setAssetsRequirement({ ...assetsRequirement, laptop: !!checked })}
              />
              <Label htmlFor="assetLaptop" className="font-normal">
                Laptop
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assetVehicle"
                checked={assetsRequirement.vehicle}
                onCheckedChange={(checked) => setAssetsRequirement({ ...assetsRequirement, vehicle: !!checked })}
              />
              <Label htmlFor="assetVehicle" className="font-normal">
                Vehicle
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Gender Preference */}
      <div className="space-y-2">
        <Label>Gender Preference</Label>
        <div className="flex flex-col space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="genderMale"
              checked={genderPreference.includes("male")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setGenderPreference([...genderPreference, "male"])
                } else {
                  setGenderPreference(genderPreference.filter((pref) => pref !== "male"))
                }
              }}
            />
            <Label htmlFor="genderMale" className="font-normal">
              Male
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="genderFemale"
              checked={genderPreference.includes("female")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setGenderPreference([...genderPreference, "female"])
                } else {
                  setGenderPreference(genderPreference.filter((pref) => pref !== "female"))
                }
              }}
            />
            <Label htmlFor="genderFemale" className="font-normal">
              Female
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="genderOther"
              checked={genderPreference.includes("other")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setGenderPreference([...genderPreference, "other"])
                } else {
                  setGenderPreference(genderPreference.filter((pref) => pref !== "other"))
                }
              }}
            />
            <Label htmlFor="genderOther" className="font-normal">
              Other
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="genderNoPreference"
              checked={genderPreference.includes("no_preference")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setGenderPreference(["no_preference"])
                } else {
                  setGenderPreference(genderPreference.filter((pref) => pref !== "no_preference"))
                }
              }}
            />
            <Label htmlFor="genderNoPreference" className="font-normal">
              No Preference
            </Label>
          </div>
        </div>
      </div>

      {/* Employer Details */}
      <h3 className="text-lg font-medium">Employer Details</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
          />
        </div>
        <div>
          <Label htmlFor="aboutCompany">About Company</Label>
          <Textarea
            id="aboutCompany"
            value={aboutCompany}
            onChange={(e) => setAboutCompany(e.target.value)}
            rows={3}
            placeholder="Brief description of your company"
          />
        </div>
        <div>
          <Label htmlFor="websiteLink">Website & Links</Label>
          <Input
            type="url"
            id="websiteLink"
            value={websiteLink}
            onChange={(e) => setWebsiteLink(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Questions and Answers */}
      {/* <h3 className="text-lg font-medium">Questions and Answers (Max 10)</h3>
      {questions.map((question, index) => (
        <div key={index} className="space-y-2 border p-4 rounded-md dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Label htmlFor={`question-${index}`}>Question #{index + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveQuestion(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input type="text" id={`question-${index}`} value={question} readOnly />
          <Label htmlFor={`answer-${index}`}>Answer</Label>
          <Textarea
            id={`answer-${index}`}
            placeholder="Provide an answer"
            value={answers[index] || ""}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            rows={2}
          />
        </div>
      ))}
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Add a question for candidates"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          disabled={questions.length >= 10}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAddQuestion()
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddQuestion}
          disabled={questions.length >= 10 || !newQuestion.trim()}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div> */}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          variant="outline"
          onClick={() => router.push("/employee/dashboard?tab=jobs")}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-black hover:bg-green-600 hover:text-black text-white"
          disabled={isLoading || isSubmitting || hasInappropriateContent}
        >
          {isLoading || isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Job Posting"
          ) : (
            "Create Job Posting"
          )}
        </Button>
      </div>
    </div>
  )
}

export default JobPostingForm
