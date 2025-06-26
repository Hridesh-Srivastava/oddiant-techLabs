"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, FileText, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast, Toaster } from "sonner"

interface EmployeeData {
  employee: {
    firstName: string | null
    middleName: string | null
    lastName: string | null
    phone: string | null
    designation: string | null
    linkedinProfile: string | null
    companyName: string | null
    companyLocation: string | null
    companyIndustry: string | null
    teamSize: string | null
    documentType: string | null
    kycNumber: string | null
    email: string | null
    rejectionReason?: string | null
    rejectionComments?: string | null
    kycDetails?: {
      documentType: string | null
      kycNumber: string | null
    }
    documents?: {
      kyc?: {
        url: string
      }
    }
    companyWebsite?: string | null
    companyLinkedin?: string | null
    socialMediaLinks?: string[] | null
  }
}

// List of industries for dropdown
const industries = [
  "Information Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Hospitality",
  "Real Estate",
  "Construction",
  "Transportation",
  "Media & Entertainment",
  "Telecommunications",
  "Energy",
  "Agriculture",
  "Other",
]

// List of team sizes for dropdown
const teamSizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"]

// Document types
const documentTypes = ["GST Certificate", "PAN Card", "Incorporation Certificate"]

// List of locations from India with city first, then state
const locations = [
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
  "Noida - Uttar Pradesh",
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
]

export default function AppealPage() {
  const router = useRouter()
  const { id } = useParams()
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Add these new state variables for location search
  const [locationSearchTerm, setLocationSearchTerm] = useState("")
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    designation: "",
    linkedinProfile: "",
    companyName: "",
    companyLocation: "",
    companyIndustry: "",
    teamSize: "",
    documentType: "",
    documentNumber: "",
    email: "",
    documentFile: null as File | null,
    reason: "",
    companyWebsite: "",
    companyLinkedin: "",
    socialMediaLinks: [] as string[],
  })

  // Add these useEffect hooks for location search
  useEffect(() => {
    // Filter locations based on search term
    if (locationSearchTerm) {
      const filtered = locations
        .filter((location) => location.toLowerCase().includes(locationSearchTerm.toLowerCase()))
        .slice(0, 10) // Limit to 10 results for better performance
      setFilteredLocations(filtered)
      setShowLocationDropdown(filtered.length > 0)
    } else {
      setFilteredLocations([])
      setShowLocationDropdown(false)
    }
  }, [locationSearchTerm])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // Use the correct API endpoint
        const response = await fetch(`/api/employee/appeal/${id}`, {
          cache: "no-store",
          headers: {
            pragma: "no-cache",
            "cache-control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setEmployeeData(data)
        console.log("Employee data:", data)

        // Initialize form data with existing values
        setFormData({
          firstName: data.employee.firstName || "",
          middleName: data.employee.middleName || "",
          lastName: data.employee.lastName || "",
          phone: data.employee.phone || "",
          designation: data.employee.designation || "",
          linkedinProfile: data.employee.linkedinProfile || "",
          companyName: data.employee.companyName || "",
          companyLocation: data.employee.companyLocation || "",
          companyIndustry: data.employee.companyIndustry || "",
          teamSize: data.employee.teamSize || "",
          documentType: data.employee.documentType || data.employee.kycDetails?.documentType || "",
          documentNumber: data.employee.kycNumber || data.employee.kycDetails?.kycNumber || "",
          email: data.employee.email || "",
          documentFile: null,
          reason: "",
          companyWebsite: data.employee.companyWebsite || "",
          companyLinkedin: data.employee.companyLinkedin || "",
          socialMediaLinks: data.employee.socialMediaLinks || [],
        })
      } catch (error) {
        console.error("Could not fetch employee data:", error)
        toast.error("Failed to fetch employee data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployeeData()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))

    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFormData((prevState) => ({
      ...prevState,
      documentFile: file || null,
    }))
  }

  // Add these handler functions for location search
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocationSearchTerm(value)

    // Also update the form data
    setFormData((prevState) => ({
      ...prevState,
      companyLocation: value,
    }))

    // Clear validation error when field is changed
    if (validationErrors.companyLocation) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.companyLocation
        return newErrors
      })
    }
  }

  const handleLocationSelect = (location: string) => {
    setFormData((prevState) => ({
      ...prevState,
      companyLocation: location,
    }))
    setLocationSearchTerm("")
    setShowLocationDropdown(false)

    // Clear any error
    if (validationErrors.companyLocation) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.companyLocation
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName) errors.firstName = "First name is required"
    if (!formData.lastName) errors.lastName = "Last name is required"
    if (!formData.email) errors.email = "Email is required"
    if (!formData.phone) errors.phone = "Phone is required"
    if (!formData.designation) errors.designation = "Designation is required"
    if (!formData.companyName) errors.companyName = "Company name is required"
    if (!formData.companyLocation) errors.companyLocation = "Company location is required"
    if (!formData.companyIndustry) errors.companyIndustry = "Company industry is required"
    if (!formData.teamSize) errors.teamSize = "Team size is required"
    if (!formData.documentType) errors.documentType = "Document type is required"
    if (!formData.documentNumber) errors.documentNumber = "Document number is required"
    if (!formData.reason) errors.reason = "Reason for appeal is required"

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()

      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === "documentFile" && value instanceof File) {
            formDataToSend.append(key, value)
          } else if (key === "socialMediaLinks" && Array.isArray(value)) {
            formDataToSend.append(key, value.join(","))
          } else {
            formDataToSend.append(key, value.toString())
          }
        }
      })

      // Add the employee ID with null check
      if (id) {
        formDataToSend.append("employeeId", id.toString())
      } else {
        toast.error("Employee ID not found")
        setIsSubmitting(false)
        return
      }

      // Log the form data being sent (for debugging)
      console.log("Submitting appeal with data:", Object.fromEntries(formDataToSend))

      const response = await fetch(`/api/employee/appeal`, {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Appeal submission result:", result)

        toast.success("Appeal submitted successfully!")

        // Redirect after successful submission
        setTimeout(() => {
          router.push("/auth/appeal-submitted")
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)

        toast.error(errorData.message || "Failed to submit appeal. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting appeal:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="w-[200px] h-[30px] mb-4" />
        <div className="space-y-2">
          <Skeleton className="w-[150px] h-[20px]" />
          <Skeleton className="w-full h-[40px]" />
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton className="w-[150px] h-[20px]" />
          <Skeleton className="w-full h-[40px]" />
        </div>
        <Skeleton className="w-[100px] h-[40px] mt-4" />
      </div>
    )
  }

  const updateFormData = (newData: Partial<typeof formData>) => {
    setFormData((prevState) => ({ ...prevState, ...newData }))
  }

  return (
    <div className="container mx-auto p-4 bg-white">
      <Toaster position="top-center" />

      <h1 className="text-2xl font-bold mb-4">Appeal Form</h1>

      {employeeData?.employee?.rejectionReason && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Your application was rejected</AlertTitle>
          <AlertDescription>
            <p>
              <strong>Reason:</strong> {employeeData.employee.rejectionReason}
            </p>
            {employeeData.employee.rejectionComments && (
              <p className="mt-2">
                <strong>Comments:</strong> {employeeData.employee.rejectionComments}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="First Name"
                required
                className={validationErrors.firstName ? "border-red-500" : ""}
              />
              {validationErrors.firstName && <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                placeholder="Middle Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last Name"
                required
                className={validationErrors.lastName ? "border-red-500" : ""}
              />
              {validationErrors.lastName && <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                required
                className={validationErrors.email ? "border-red-500" : ""}
              />
              {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                required
                className={validationErrors.phone ? "border-red-500" : ""}
              />
              {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="Designation"
                required
                className={validationErrors.designation ? "border-red-500" : ""}
              />
              {validationErrors.designation && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.designation}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
              <Input
                id="linkedinProfile"
                name="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={handleInputChange}
                placeholder="LinkedIn Profile URL"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Company Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Company Name"
                required
                className={validationErrors.companyName ? "border-red-500" : ""}
              />
              {validationErrors.companyName && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.companyName}</p>
              )}
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="companyLocation">Company Location</Label>
              <div className="relative">
                <Input
                  id="companyLocation"
                  name="companyLocation"
                  value={formData.companyLocation}
                  onChange={handleLocationChange}
                  onFocus={() => {
                    if (filteredLocations.length > 0) {
                      setShowLocationDropdown(true)
                    }
                  }}
                  placeholder="Search city, state..."
                  required
                  className={validationErrors.companyLocation ? "border-red-500" : ""}
                />
                <Search className="h-4 w-4 absolute right-3 top-3 text-gray-400" />
              </div>
              {showLocationDropdown && (
                <div
                  ref={locationDropdownRef}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredLocations.map((location, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer"
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location}
                    </div>
                  ))}
                </div>
              )}
              {validationErrors.companyLocation && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.companyLocation}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="companyIndustry">Company Industry</Label>
              <select
                id="companyIndustry"
                name="companyIndustry"
                value={formData.companyIndustry}
                onChange={handleInputChange}
                className={`w-full h-10 px-3 py-2 rounded-md border border-input bg-background ${
                  validationErrors.companyIndustry ? "border-red-500" : ""
                }`}
                required
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {validationErrors.companyIndustry && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.companyIndustry}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <select
                id="teamSize"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleInputChange}
                className={`w-full h-10 px-3 py-2 rounded-md border border-input bg-background ${
                  validationErrors.teamSize ? "border-red-500" : ""
                }`}
                required
              >
                <option value="">Select team size</option>
                {teamSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {validationErrors.teamSize && <p className="text-red-500 text-xs mt-1">{validationErrors.teamSize}</p>}
            </div>
          </div>

          {/* Add Company Website */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="companyWebsite">Company Website</Label>
            <Input
              id="companyWebsite"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleInputChange}
              placeholder="https://www.example.com"
            />
          </div>

          {/* Add Company LinkedIn */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="companyLinkedin">Company LinkedIn</Label>
            <Input
              id="companyLinkedin"
              name="companyLinkedin"
              value={formData.companyLinkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/company/your-company"
            />
          </div>

          {/* Add Social Media Links */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="socialMediaLinks">Social Media Links</Label>
            <Input
              id="socialMediaLinks"
              name="socialMediaLinks"
              value={formData.socialMediaLinks.join(", ")}
              onChange={(e) => {
                const links = e.target.value
                  .split(",")
                  .map((link) => link.trim())
                  .filter((link) => link)
                updateFormData({ socialMediaLinks: links })
              }}
              placeholder="https://twitter.com/company, https://facebook.com/company"
            />
            <p className="text-xs text-gray-400">Separate multiple links with commas</p>
          </div>
        </div>

        <Separator />

        {/* Document Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Update KYC Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className={`w-full h-10 px-3 py-2 rounded-md border border-input bg-background ${
                  validationErrors.documentType ? "border-red-500" : ""
                }`}
                required
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {validationErrors.documentType && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.documentType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document Number</Label>
              <Input
                id="documentNumber"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleInputChange}
                placeholder="Enter document number"
                required
                className={validationErrors.documentNumber ? "border-red-500" : ""}
              />
              {validationErrors.documentNumber && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.documentNumber}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="documentFile">Upload Document</Label>
            {/* Display previously uploaded document if available */}
            {employeeData?.employee?.documents?.kyc?.url && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-3">
                <p className="text-blue-800 font-medium mb-1">Previously Uploaded Document</p>
                <a
                  href={employeeData.employee.documents.kyc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Document
                </a>
              </div>
            )}
            <div className="relative">
              <input
                type="file"
                id="documentFile"
                name="documentFile"
                onChange={handleFileChange}
                accept=".pdf,.jpeg,.png,.jpg"
                className="block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
            </div>
            {formData.documentFile && (
              <p className="text-sm text-green-600 mt-1">Selected File: {formData.documentFile.name}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Reason for Appeal */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Appeal</Label>
          <Textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Please explain why you are appealing the rejection and what changes you have made to address the concerns."
            className={`resize-none ${validationErrors.reason ? "border-red-500" : ""}`}
            rows={5}
            required
          />
          {validationErrors.reason && <p className="text-red-500 text-xs mt-1">{validationErrors.reason}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto bg-black text-white hover:bg-green-600 hover:text-black"
        >
          {isSubmitting ? "Submitting..." : "Submit Appeal"}
        </Button>
      </form>
    </div>
  )
}
