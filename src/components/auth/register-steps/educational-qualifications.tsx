"use client"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FormData } from "../register-form"
import { Plus, Trash2, Search } from "lucide-react"

interface EducationalQualificationsFormProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}

// List of all available courses for autocomplete
const COURSES = [
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

export default function EducationalQualificationsForm({
  formData,
  updateFormData,
}: EducationalQualificationsFormProps) {
  // State for tracking suggestions for each education entry
  const [suggestions, setSuggestions] = useState<{ [key: number]: string[] }>({})
  // State for tracking if dropdown is open for each education entry
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({})
  // Refs for dropdown containers
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      Object.keys(dropdownRefs.current).forEach((key) => {
        const index = Number.parseInt(key)
        if (dropdownRefs.current[index] && !dropdownRefs.current[index]?.contains(event.target as Node)) {
          setShowSuggestions((prev) => ({ ...prev, [index]: false }))
        }
      })
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleEducationChange = (index: number, field: string, value: string) => {
    const updatedEducation = [...formData.education]
    updatedEducation[index] = { ...updatedEducation[index], [field]: value }
    updateFormData({ education: updatedEducation })

    // If the field is degree, filter suggestions
    if (field === "degree") {
      filterSuggestions(index, value)
    }
  }

  const filterSuggestions = (index: number, query: string) => {
    if (!query.trim()) {
      setSuggestions({ ...suggestions, [index]: [] })
      setShowSuggestions({ ...showSuggestions, [index]: false })
      return
    }

    const filtered = COURSES.filter((course) => course.toLowerCase().includes(query.toLowerCase())).slice(0, 10) // Limit to 10 suggestions for better UX

    setSuggestions({ ...suggestions, [index]: filtered })
    setShowSuggestions({ ...showSuggestions, [index]: filtered.length > 0 })
  }

  const selectSuggestion = (index: number, value: string) => {
    handleEducationChange(index, "degree", value)
    setShowSuggestions({ ...showSuggestions, [index]: false })
  }

  const handleCertificationChange = (index: number, value: string) => {
    const updatedCertifications = [...formData.certifications]
    updatedCertifications[index] = value
    updateFormData({ certifications: updatedCertifications })
  }

  const addEducation = () => {
    updateFormData({
      education: [
        ...formData.education,
        { level: "", mode: "", degree: "", school: "", startingYear: "", endingYear: "", percentage: "" },
      ],
    })
  }

  const removeEducation = (index: number) => {
    if (formData.education.length > 1) {
      const updatedEducation = [...formData.education]
      updatedEducation.splice(index, 1)
      updateFormData({ education: updatedEducation })
    }
  }

  const addCertification = () => {
    updateFormData({
      certifications: [...formData.certifications, ""],
    })
  }

  const removeCertification = (index: number) => {
    if (formData.certifications.length > 1) {
      const updatedCertifications = [...formData.certifications]
      updatedCertifications.splice(index, 1)
      updateFormData({ certifications: updatedCertifications })
    }
  }

  // Map level values to display text
  const getLevelDisplayText = (value: string) => {
    switch (value) {
      case "high_school":
        return "High School"
      case "intermediate":
        return "Intermediate"
      case "bachelors":
        return "Bachelor's Degree"
      case "masters":
        return "Master's Degree"
      case "phd":
        return "PhD"
      case "diploma":
        return "Diploma"
      case "certificate":
        return "Certificate"
      default:
        return "Select level"
    }
  }
  const getModeDisplayText = (value: string) => {
    switch (value) {
      case "regular":
        return "Regular"
      case "distance":
        return "Distance"
      case "open_schooling":
        return "Open Schooling"
      case "part_time":
        return "Part Time"
      default:
        return "Select Mode"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Educational Qualifications</h3>
          <Button type="button" variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>

        {formData.education.map((edu, index) => (
          <div key={index} className="p-4 border rounded-md mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Education #{index + 1}</h4>
              {formData.education.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor={`level-${index}`}>
                  Level <span className="text-red-500">*</span>
                </Label>
                <Select value={edu.level} onValueChange={(value) => handleEducationChange(index, "level", value)}>
                  <SelectTrigger id={`level-${index}`} className="w-full">
                    <SelectValue placeholder="Select level">
                      {edu.level ? getLevelDisplayText(edu.level) : "Select level"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`mode-${index}`}>
                  Mode <span className="text-red-500">*</span>
                </Label>
                <Select value={edu.mode} onValueChange={(value) => handleEducationChange(index, "mode", value)}>
                  <SelectTrigger id={`mode-${index}`} className="w-full">
                    <SelectValue placeholder="Select Mode">
                      {edu.mode ? getModeDisplayText(edu.mode) : "Select Mode"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="open_schooling">Open Schooling</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative" ref={(el) => { dropdownRefs.current[index] = el }}>
                <Label htmlFor={`degree-${index}`}>
                  Degree/Course <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="flex">
                    <Input
                      id={`degree-${index}`}
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                      onFocus={() => filterSuggestions(index, edu.degree)}
                      required
                      className="w-full"
                      placeholder="Type to search courses..."
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="h-4 w-4" />
                    </div>
                  </div>
                  {showSuggestions[index] && suggestions[index]?.length > 0 && (
                    <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 max-h-60 overflow-auto border">
                      {suggestions[index].map((suggestion, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => selectSuggestion(index, suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor={`school-${index}`}>
                School/College/University <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`school-${index}`}
                value={edu.school}
                onChange={(e) => handleEducationChange(index, "school", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`startingYear-${index}`}>
                  Starting Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`startingYear-${index}`}
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={edu.startingYear}
                  onChange={(e) => handleEducationChange(index, "startingYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`endingYear-${index}`}>
                  Ending Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`endingYear-${index}`}
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 10}
                  value={edu.endingYear}
                  onChange={(e) => handleEducationChange(index, "endingYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`percentage-${index}`}>
                  Percentage/CGPA <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`percentage-${index}`}
                  value={edu.percentage}
                  onChange={(e) => handleEducationChange(index, "percentage", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Certifications</h3>
          <Button type="button" variant="outline" size="sm" onClick={addCertification}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>

        {formData.certifications.map((cert, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              value={cert}
              onChange={(e) => handleCertificationChange(index, e.target.value)}
              placeholder="Certification name"
            />
            {formData.certifications.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCertification(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
