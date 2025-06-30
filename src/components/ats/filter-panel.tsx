"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { X, RefreshCw, Bike, Car, Wifi, Laptop, Sun, Moon, RotateCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// City and state mapping data - Complete list
const cityStateMapping: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Andhra Pradesh": [
    "Adoni",
    "Amaravati",
    "Anantapur",
    "Chandragiri",
    "Chittoor",
    "Dowlaiswaram",
    "Eluru",
    "Guntur",
    "Kadapa",
    "Kakinada",
    "Kurnool",
    "Machilipatnam",
    "Nagarjunakoṇḍa",
    "Rajahmundry",
    "Srikakulam",
    "Tirupati",
    "Vijayawada",
    "Visakhapatnam",
    "Vizianagaram",
    "Yemmiganur",
  ],
  "Arunachal Pradesh": ["Itanagar"],
  Assam: [
    "Dhuburi",
    "Dibrugarh",
    "Dispur",
    "Guwahati",
    "Jorhat",
    "Nagaon",
    "Sivasagar",
    "Silchar",
    "Tezpur",
    "Tinsukia",
  ],
  Bihar: [
    "Ara",
    "Barauni",
    "Begusarai",
    "Bettiah",
    "Bhagalpur",
    "Bihar Sharif",
    "Bodh Gaya",
    "Buxar",
    "Chapra",
    "Darbhanga",
    "Dehri",
    "Dinapur Nizamat",
    "Gaya",
    "Hajipur",
    "Jamalpur",
    "Katihar",
    "Madhubani",
    "Motihari",
    "Munger",
    "Muzaffarpur",
    "Patna",
    "Purnia",
    "Pusa",
    "Saharsa",
    "Samastipur",
    "Sasaram",
    "Sitamarhi",
    "Siwan",
  ],
  Chandigarh: ["Chandigarh"],
  Chhattisgarh: ["Ambikapur", "Bhilai", "Bilaspur", "Dhamtari", "Durg", "Jagdalpur", "Raipur", "Rajnandgaon"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  Delhi: ["Delhi", "New Delhi"],
  Goa: ["Madgaon", "Panaji"],
  Gujarat: [
    "Ahmadabad",
    "Amreli",
    "Bharuch",
    "Bhavnagar",
    "Bhuj",
    "Dwarka",
    "Gandhinagar",
    "Godhra",
    "Jamnagar",
    "Junagadh",
    "Kandla",
    "Khambhat",
    "Kheda",
    "Mahesana",
    "Morbi",
    "Nadiad",
    "Navsari",
    "Okha",
    "Palanpur",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Surat",
    "Surendranagar",
    "Valsad",
    "Veraval",
  ],
  Haryana: [
    "Ambala",
    "Bhiwani",
    "Chandigarh",
    "Faridabad",
    "Firozpur Jhirka",
    "Gurugram",
    "Hansi",
    "Hisar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Panipat",
    "Pehowa",
    "Rewari",
    "Rohtak",
    "Sirsa",
    "Sonipat",
  ],
  "Himachal Pradesh": [
    "Bilaspur",
    "Chamba",
    "Dalhousie",
    "Dharmshala",
    "Hamirpur",
    "Kangra",
    "Kullu",
    "Mandi",
    "Nahan",
    "Shimla",
    "Una",
  ],
  "Jammu and Kashmir": [
    "Anantnag",
    "Baramula",
    "Doda",
    "Gulmarg",
    "Jammu",
    "Kathua",
    "Punch",
    "Rajouri",
    "Srinagar",
    "Udhampur",
  ],
  Jharkhand: [
    "Bokaro",
    "Chaibasa",
    "Deoghar",
    "Dhanbad",
    "Dumka",
    "Giridih",
    "Hazaribag",
    "Jamshedpur",
    "Jharia",
    "Rajmahal",
    "Ranchi",
    "Saraikela",
  ],
  Karnataka: [
    "Badami",
    "Ballari",
    "Bengaluru",
    "Belagavi",
    "Bhadravati",
    "Bidar",
    "Chikkamagaluru",
    "Chitradurga",
    "Davangere",
    "Halebidu",
    "Hassan",
    "Hubballi-Dharwad",
    "Kalaburagi",
    "Kolar",
    "Madikeri",
    "Mandya",
    "Mangaluru",
    "Mysuru",
    "Raichur",
    "Shivamogga",
    "Shravanabelagola",
    "Shrirangapattana",
    "Tumakuru",
    "Vijayapura",
  ],
  Kerala: [
    "Alappuzha",
    "Vatakara",
    "Idukki",
    "Kannur",
    "Kochi",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Mattancheri",
    "Palakkad",
    "Thalassery",
    "Thiruvananthapuram",
    "Thrissur",
  ],
  Ladakh: ["Kargil", "Leh"],
  "Madhya Pradesh": [
    "Balaghat",
    "Barwani",
    "Betul",
    "Bharhut",
    "Bhind",
    "Bhojpur",
    "Bhopal",
    "Burhanpur",
    "Chhatarpur",
    "Chhindwara",
    "Damoh",
    "Datia",
    "Dewas",
    "Dhar",
    "Dr. Ambedkar Nagar (Mhow)",
    "Guna",
    "Gwalior",
    "Hoshangabad",
    "Indore",
    "Itarsi",
    "Jabalpur",
    "Jhabua",
    "Khajuraho",
    "Khandwa",
    "Khargone",
    "Maheshwar",
    "Mandla",
    "Mandsaur",
    "Morena",
    "Murwara",
    "Narsimhapur",
    "Narsinghgarh",
    "Narwar",
    "Neemuch",
    "Nowgong",
    "Orchha",
    "Panna",
    "Raisen",
    "Rajgarh",
    "Ratlam",
    "Rewa",
    "Sagar",
    "Sarangpur",
    "Satna",
    "Sehore",
    "Seoni",
    "Shahdol",
    "Shajapur",
    "Sheopur",
    "Shivpuri",
    "Ujjain",
    "Vidisha",
  ],
  Maharashtra: [
    "Ahmadnagar",
    "Akola",
    "Amravati",
    "Aurangabad",
    "Bhandara",
    "Bhusawal",
    "Bid",
    "Buldhana",
    "Chandrapur",
    "Daulatabad",
    "Dhule",
    "Jalgaon",
    "Kalyan",
    "Karli",
    "Kolhapur",
    "Mahabaleshwar",
    "Malegaon",
    "Matheran",
    "Mumbai",
    "Nagpur",
    "Nanded",
    "Nashik",
    "Osmanabad",
    "Pandharpur",
    "Parbhani",
    "Pune",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sevagram",
    "Solapur",
    "Thane",
    "Ulhasnagar",
    "Vasai-Virar",
    "Wardha",
    "Yavatmal",
  ],
  Manipur: ["Imphal"],
  Meghalaya: ["Cherrapunji", "Shillong"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Mon", "Phek", "Wokha", "Zunheboto"],
  Odisha: [
    "Balangir",
    "Baleshwar",
    "Baripada",
    "Bhubaneshwar",
    "Brahmapur",
    "Cuttack",
    "Dhenkanal",
    "Kendujhar",
    "Konark",
    "Koraput",
    "Paradip",
    "Phulabani",
    "Puri",
    "Sambalpur",
    "Udayagiri",
  ],
  Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  Punjab: [
    "Amritsar",
    "Batala",
    "Chandigarh",
    "Faridkot",
    "Firozpur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Nabha",
    "Patiala",
    "Rupnagar",
    "Sangrur",
  ],
  Rajasthan: [
    "Abu",
    "Ajmer",
    "Alwar",
    "Amer",
    "Barmer",
    "Beawar",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittaurgarh",
    "Churu",
    "Dhaulpur",
    "Dungarpur",
    "Ganganagar",
    "Hanumangarh",
    "Jaipur",
    "Jaisalmer",
    "Jalor",
    "Jhalawar",
    "Jhunjhunu",
    "Jodhpur",
    "Kishangarh",
    "Kota",
    "Merta",
    "Nagaur",
    "Nathdwara",
    "Pali",
    "Phalodi",
    "Pushkar",
    "Sawai Madhopur",
    "Shahpura",
    "Sikar",
    "Sirohi",
    "Tonk",
    "Udaipur",
  ],
  Sikkim: ["Gangtok", "Gyalshing", "Lachung", "Mangan"],
  "Tamil Nadu": [
    "Arcot",
    "Chengalpattu",
    "Chennai",
    "Chidambaram",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kanchipuram",
    "Kanniyakumari",
    "Kodaikanal",
    "Kumbakonam",
    "Madurai",
    "Mamallapuram",
    "Nagappattinam",
    "Nagercoil",
    "Palayamkottai",
    "Pudukkottai",
    "Rajapalayam",
    "Ramanathapuram",
    "Salem",
    "Thanjavur",
    "Tiruchchirappalli",
    "Tirunelveli",
    "Tiruppur",
    "Thoothukudi",
    "Udhagamandalam",
    "Vellore",
  ],
  Telangana: ["Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Nizamabad", "Sangareddi", "Warangal"],
  Tripura: ["Agartala"],
  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Amroha",
    "Ayodhya",
    "Azamgarh",
    "Bahraich",
    "Ballia",
    "Banda",
    "Bara Banki",
    "Bareilly",
    "Basti",
    "Bijnor",
    "Bithur",
    "Budaun",
    "Bulandshahr",
    "Deoria",
    "Etah",
    "Etawah",
    "Faizabad",
    "Farrukhabad-cum-Fatehgarh",
    "Fatehpur",
    "Fatehpur Sikri",
    "Ghaziabad",
    "Ghazipur",
    "Gonda",
    "Gorakhpur",
    "Hamirpur",
    "Hardoi",
    "Hathras",
    "Jalaun",
    "Jaunpur",
    "Jhansi",
    "Kannauj",
    "Kanpur",
    "Lakhimpur",
    "Lalitpur",
    "Lucknow",
    "Mainpuri",
    "Mathura",
    "Meerut",
    "Mirzapur-Vindhyachal",
    "Moradabad",
    "Muzaffarnagar",
    "Noida",
    "Partapgarh",
    "Pilibhit",
    "Prayagraj",
    "Rae Bareli",
    "Rampur",
    "Saharanpur",
    "Sambhal",
    "Shahjahanpur",
    "Sitapur",
    "Sultanpur",
    "Tehri",
    "Varanasi",
  ],
  Uttarakhand: ["Almora", "Dehra Dun", "Haridwar", "Mussoorie", "Nainital", "Pithoragarh"],
  "West Bengal": [
    "Alipore",
    "Alipur Duar",
    "Asansol",
    "Baharampur",
    "Bally",
    "Balurghat",
    "Bankura",
    "Baranagar",
    "Barasat",
    "Barrackpore",
    "Basirhat",
    "Bhatpara",
    "Bishnupur",
    "Budge Budge",
    "Burdwan",
    "Chandernagore",
    "Darjeeling",
    "Diamond Harbour",
    "Dum Dum",
    "Durgapur",
    "Halisahar",
    "Haora",
    "Hugli",
    "Ingraj Bazar",
    "Jalpaiguri",
    "Kalimpong",
    "Kamarhati",
    "Kanchrapara",
    "Kharagpur",
    "Cooch Behar",
    "Kolkata",
    "Krishnanagar",
    "Malda",
    "Midnapore",
    "Murshidabad",
    "Nabadwip",
    "Palashi",
    "Panihati",
    "Purulia",
    "Raiganj",
    "Santipur",
    "Shantiniketan",
    "Shrirampur",
    "Siliguri",
    "Siuri",
    "Tamluk",
    "Titagarh",
  ],
}

// Create a flat list of all cities with their states for search
const allCities = Object.entries(cityStateMapping).reduce(
  (acc, [state, cities]) => {
    cities.forEach((city) => {
      acc.push({ city, state })
    })
    return acc
  },
  [] as { city: string; state: string }[],
)

// Education levels
const educationLevels = [
  "High School",
  "Intermediate",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Diploma",
  "Certificate",
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
  "Hardware Machinery  & Equipments",
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

interface FilterPanelProps {
  filters: {
    mandatoryKeywords: string[]
    preferredKeywords: string[]
    location: string
    state: string
    educationLevel: string[]
    gender: string
    experienceRange: number[]
    salaryRange: number[]
    industry: string
    ageRange: number[]
    notKeywords: string[]
    atsScore: number
    assets?: {
      bike: boolean
      car: boolean
      wifi: boolean
      laptop: boolean
    }
    shiftPreference?: string
  }
  setFilters: (filters: any) => void
  applyFilters: () => void
  resetFilters: () => void
}

export function FilterPanel({ filters, setFilters, applyFilters, resetFilters }: FilterPanelProps) {
  const [mandatoryKeyword, setMandatoryKeyword] = useState("")
  const [preferredKeyword, setPreferredKeyword] = useState("")
  const [notKeyword, setNotKeyword] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [locationSearch, setLocationSearch] = useState(filters.location || "")
  const [openLocationDropdown, setOpenLocationDropdown] = useState(false)
  const [filteredCities, setFilteredCities] = useState(allCities)

  // Create a ref for the location input
  const locationInputRef = useRef<HTMLInputElement>(null)

  // Initialize assets if it doesn't exist
  useEffect(() => {
    if (!filters.assets) {
      setFilters({
        ...filters,
        assets: {
          bike: false,
          car: false,
          wifi: false,
          laptop: false,
        },
        shiftPreference: "",
      })
    }
  }, [])

  // Sync locationSearch with filters.location
  useEffect(() => {
    setLocationSearch(filters.location || "")
  }, [filters.location])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest("#location-dropdown-container")) {
        setOpenLocationDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter cities based on search input
  useEffect(() => {
    if (locationSearch.trim() === "") {
      setFilteredCities(allCities)
    } else {
      const searchTerm = locationSearch.toLowerCase()
      const filtered = allCities.filter((item) => item.city.toLowerCase().includes(searchTerm))
      setFilteredCities(filtered)
    }
  }, [locationSearch])

  // Handle city selection
  const handleCitySelect = (cityData: { city: string; state: string }) => {
    setFilters({
      ...filters,
      location: cityData.city,
      state: cityData.state,
    })
    setLocationSearch(cityData.city)
    setOpenLocationDropdown(false)
  }

  const addMandatoryKeyword = () => {
    if (mandatoryKeyword.trim() && !filters.mandatoryKeywords.includes(mandatoryKeyword.trim())) {
      setFilters({
        ...filters,
        mandatoryKeywords: [...filters.mandatoryKeywords, mandatoryKeyword.trim()],
      })
      setMandatoryKeyword("")
    }
  }

  const removeMandatoryKeyword = (keyword: string) => {
    setFilters({
      ...filters,
      mandatoryKeywords: filters.mandatoryKeywords.filter((k) => k !== keyword),
    })
  }

  const addPreferredKeyword = () => {
    if (preferredKeyword.trim() && !filters.preferredKeywords.includes(preferredKeyword.trim())) {
      setFilters({
        ...filters,
        preferredKeywords: [...filters.preferredKeywords, preferredKeyword.trim()],
      })
      setPreferredKeyword("")
    }
  }

  const removePreferredKeyword = (keyword: string) => {
    setFilters({
      ...filters,
      preferredKeywords: filters.preferredKeywords.filter((k) => k !== keyword),
    })
  }

  const addNotKeyword = () => {
    if (notKeyword.trim() && !filters.notKeywords.includes(notKeyword.trim())) {
      setFilters({
        ...filters,
        notKeywords: [...filters.notKeywords, notKeyword.trim()],
      })
      setNotKeyword("")
    }
  }

  const removeNotKeyword = (keyword: string) => {
    setFilters({
      ...filters,
      notKeywords: filters.notKeywords.filter((k) => k !== keyword),
    })
  }

  const addEducationLevel = () => {
    if (educationLevel && !filters.educationLevel.includes(educationLevel)) {
      setFilters({
        ...filters,
        educationLevel: [...filters.educationLevel, educationLevel],
      })
      setEducationLevel("")
    }
  }

  const removeEducationLevel = (level: string) => {
    setFilters({
      ...filters,
      educationLevel: filters.educationLevel.filter((l) => l !== level),
    })
  }

  const toggleAsset = (asset: "bike" | "car" | "wifi" | "laptop") => {
    setFilters({
      ...filters,
      assets: {
        ...(filters.assets || { bike: false, car: false, wifi: false, laptop: false }),
        [asset]: filters.assets ? !filters.assets[asset] : true,
      },
    })
  }

  // Custom reset handler that also clears the locationSearch state
  const handleResetFilters = () => {
    // Clear the locationSearch state
    setLocationSearch("")

    // Call the parent resetFilters function
    resetFilters()
  }

  // --- Gemini ATS Resume Score Prediction Integration ---
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = process.env.GEMINI_API_URL;

  async function getGeminiAtsScore(resumeContent: string, jobDescription: string = ""): Promise<number> {
    if (!GEMINI_API_KEY || !GEMINI_API_URL) return 0;
    const prompt = `You are an advanced ATS resume screening engine for a recruitment platform. Given the following candidate resume/profile, analyze and predict the match score (0-100) for a generic IT/HR job, considering skills, experience, education, and relevance. Only respond with: Score: <number>\n.\nResume/Profile:\n${resumeContent}\n${jobDescription ? `Job Description:\n${jobDescription}` : ""}\nRespond in this format: 'Score: <number>'`;
    try {
      const res = await fetch(GEMINI_API_URL + `?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const scoreMatch = text.match(/Score:\s*(\d+)/i);
      const aiScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      return aiScore;
    } catch (e) {
      return 0;
    }
  }
  // --- End Gemini Integration ---

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Filter Resumes</h3>
        <Button variant="outline" size="sm" onClick={handleResetFilters} className="flex items-center gap-1 bg-red-600 text-white">
          <RefreshCw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">ATS Score Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="ats-score">ATS Resume Score Prediction</Label>
              <span className="text-sm font-medium">{filters.atsScore}%</span>
            </div>
            <Slider
              id="ats-score"
              min={0}
              max={100}
              step={5}
              value={[filters.atsScore]}
              onValueChange={(value) => setFilters({ ...filters, atsScore: value[0] })}
              className="py-2"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />
      {/* Mandatory Keywords */}
      <div className="space-y-2">
        <Label htmlFor="mandatory-keywords">Mandatory Keywords</Label>
        <div className="flex space-x-2">
          <Input
            id="mandatory-keywords"
            value={mandatoryKeyword}
            onChange={(e) => setMandatoryKeyword(e.target.value)}
            placeholder="Add keyword..."
            onKeyDown={(e) => e.key === "Enter" && addMandatoryKeyword()}
          />
          <Button type="button" onClick={addMandatoryKeyword}>
            Add
          </Button>
        </div>
        {filters.mandatoryKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.mandatoryKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {keyword}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeMandatoryKeyword(keyword)} />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Preferred Keywords */}
      <div className="space-y-2">
        <Label htmlFor="preferred-keywords">Preferred Keywords</Label>
        <div className="flex space-x-2">
          <Input
            id="preferred-keywords"
            value={preferredKeyword}
            onChange={(e) => setPreferredKeyword(e.target.value)}
            placeholder="Add keyword..."
            onKeyDown={(e) => e.key === "Enter" && addPreferredKeyword()}
          />
          <Button type="button" onClick={addPreferredKeyword}>
            Add
          </Button>
        </div>
        {filters.preferredKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.preferredKeywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {keyword}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removePreferredKeyword(keyword)} />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* NOT Keywords */}
      <div className="space-y-2">
        <Label htmlFor="not-keywords">NOT Keywords</Label>
        <div className="flex space-x-2">
          <Input
            id="not-keywords"
            value={notKeyword}
            onChange={(e) => setNotKeyword(e.target.value)}
            placeholder="Add keyword to exclude..."
            onKeyDown={(e) => e.key === "Enter" && addNotKeyword()}
          />
          <Button type="button" onClick={addNotKeyword}>
            Add
          </Button>
        </div>
        {filters.notKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.notKeywords.map((keyword, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                {keyword}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeNotKeyword(keyword)} />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Location with Dropdown */}
      <div className="space-y-2" id="location-dropdown-container">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <Input
            id="location"
            ref={locationInputRef}
            value={locationSearch}
            onChange={(e) => {
              setLocationSearch(e.target.value)
              setOpenLocationDropdown(true)
            }}
            placeholder="City or region..."
            onClick={() => setOpenLocationDropdown(true)}
          />
          {openLocationDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                {filteredCities.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">No cities found</div>
                ) : (
                  filteredCities.slice(0, 100).map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 hover:bg-muted cursor-pointer rounded-sm"
                      onClick={() => handleCitySelect(item)}
                    >
                      <div>
                        <span>{item.city}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{item.state}</span>
                      </div>
                    </div>
                  ))
                )}
                {filteredCities.length > 100 && (
                  <div className="text-xs text-muted-foreground p-2 text-center">
                    Showing first 100 results. Type more to narrow down.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State (Auto-filled based on city selection) */}
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input id="state" value={filters.state} readOnly className="bg-muted" placeholder="State..." />
      </div>

      <Separator />

      {/* Assets Section */}
      <div className="space-y-3">
        <Label>Assets</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="asset-bike"
              checked={filters.assets?.bike || false}
              onCheckedChange={() => toggleAsset("bike")}
            />
            <Label htmlFor="asset-bike" className="flex items-center gap-2 cursor-pointer">
              <Bike className="h-4 w-4" />
              <span>Bike</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="asset-car"
              checked={filters.assets?.car || false}
              onCheckedChange={() => toggleAsset("car")}
            />
            <Label htmlFor="asset-car" className="flex items-center gap-2 cursor-pointer">
              <Car className="h-4 w-4" />
              <span>Car</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="asset-wifi"
              checked={filters.assets?.wifi || false}
              onCheckedChange={() => toggleAsset("wifi")}
            />
            <Label htmlFor="asset-wifi" className="flex items-center gap-2 cursor-pointer">
              <Wifi className="h-4 w-4" />
              <span>WiFi</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="asset-laptop"
              checked={filters.assets?.laptop || false}
              onCheckedChange={() => toggleAsset("laptop")}
            />
            <Label htmlFor="asset-laptop" className="flex items-center gap-2 cursor-pointer">
              <Laptop className="h-4 w-4" />
              <span>Laptop</span>
            </Label>
          </div>
        </div>
      </div>

      {/* Shift Preference */}
      <div className="space-y-2">
        <Label htmlFor="shift-preference">Shift Preference</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={filters.shiftPreference === "day" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setFilters({ ...filters, shiftPreference: "day" })}
          >
            <Sun className="h-4 w-4" />
            <span>Day</span>
          </Button>
          <Button
            variant={filters.shiftPreference === "night" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setFilters({ ...filters, shiftPreference: "night" })}
          >
            <Moon className="h-4 w-4" />
            <span>Night</span>
          </Button>
          <Button
            variant={filters.shiftPreference === "rotational" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setFilters({ ...filters, shiftPreference: "rotational" })}
          >
            <RotateCw className="h-4 w-4" />
            <span>Rotational</span>
          </Button>
        </div>
      </div>

      {/* Education Level */}
      <div className="space-y-2">
        <Label htmlFor="education-level">Education Level</Label>
        <div className="flex space-x-2">
          <select
            id="education-level"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
          >
            <option value="">Select level</option>
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <Button type="button" onClick={addEducationLevel}>
            Add
          </Button>
        </div>
        {filters.educationLevel.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.educationLevel.map((level, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {level}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeEducationLevel(level)} />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
        >
          <option value="">Any</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <select
          id="industry"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={filters.industry}
          onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
        >
          <option value="">Any</option>
          {industryOptions.map((industry) => (
            <option key={industry} value={industry.toLowerCase()}>
              {industry}
            </option>
          ))}
        </select>
      </div>

      <Separator />

      {/* Experience Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="experience-range">Experience (years)</Label>
          <span className="text-sm">
            {filters.experienceRange[0]} - {filters.experienceRange[1]}
          </span>
        </div>
        <Slider
          id="experience-range"
          min={0}
          max={20}
          step={1}
          value={filters.experienceRange}
          onValueChange={(value) => setFilters({ ...filters, experienceRange: value })}
        />
      </div>

      {/* Salary Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="salary-range">Salary Range (₹)</Label>
          <span className="text-sm">
            ₹{filters.salaryRange[0].toLocaleString()} - ₹{filters.salaryRange[1].toLocaleString()}
          </span>
        </div>
        <Slider
          id="salary-range"
          min={0}
          max={200000}
          step={5000}
          value={filters.salaryRange}
          onValueChange={(value) => setFilters({ ...filters, salaryRange: value })}
        />
      </div>

      {/* Age Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="age-range">Age Range</Label>
          <span className="text-sm">
            {filters.ageRange[0]} - {filters.ageRange[1]}
          </span>
        </div>
        <Slider
          id="age-range"
          min={18}
          max={65}
          step={1}
          value={filters.ageRange}
          onValueChange={(value) => setFilters({ ...filters, ageRange: value })}
        />
      </div>

      <Button className="w-full" onClick={applyFilters}>
        Apply Filters
      </Button>
    </div>
  )
}
