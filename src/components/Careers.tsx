"use client"

import { useEffect, useRef, useState } from "react"
import JobCard from "./JobCard"
import cities from "../app/data/CityName"

function Careers() {
  const data = [
    { jobRole: "Frontend", location: "Onsite/Remote", experience: 20, skills: "HTML,CSS,JS" },
    { jobRole: "Backend", location: "New Delhi", experience: 20,skills: "HTML,CSS,JS" },
    { jobRole: "Full Stack", location: "Mumbai", experience: 20,skills: "HTML,CSS,JS" },
    { jobRole: "Software Development", location: "New York", experience: 20,skills: "HTML,CSS,JS" },
    { jobRole: "PHP developer", location: "London", experience: 20,skills: "HTML,CSS,JS" },
  ]

  const [cityVisible, setCityVisible] = useState(false)
  const [filteredData, setFilteredData] = useState<string[]>(cities)
  const [city, setCity] = useState("")
  const cityInputRef = useRef<HTMLInputElement>(null)
  const citySuggestionsRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setFilteredData(cities.filter((d) => d.toLowerCase().includes(city.toLowerCase())))
  }, [city])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node) &&
        citySuggestionsRef.current &&
        !citySuggestionsRef.current.contains(event.target as Node)
      ) {
        setCityVisible(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="p-8">
      <h2 className="text-3xl text-white text-center font-bold mb-6">Find your Jobs</h2>
      <form className="flex flex-col md:flex-row justify-center items-center flex-wrap">
        <input
          type="text"
          placeholder="Job Role"
          className="w-full md:w-1/5 border rounded-lg p-2 m-2 bg-[rgb(249,249,249)] placeholder:text-black"
        />

        <select
          className="w-full md:w-1/5 border rounded-lg p-2 m-2 bg-[rgb(249,249,249)] placeholder:text-black"
        >
          <option value="">Job Type</option>
          <option value="hybrid">Hybrid</option>
          <option value="remote">Remote</option>
          <option value="on_site">On-Site</option>
        </select>

        <div className="w-full md:w-1/5 m-2 relative">
          <span className="absolute top-2 right-2 font-bold rotate-180 pointer-events-none">^</span>
          <input
            ref={cityInputRef}
            type="text"
            placeholder="Job Location"
            className="w-full border rounded-lg p-2 bg-[rgb(249,249,249)] placeholder:text-black"
            value={city}
            onFocus={() => setCityVisible(true)}
            onChange={(e) => setCity(e.target.value)}
          />
          <ul
            ref={citySuggestionsRef}
            className={`absolute left-0 bg-white w-full max-h-[55vh] shadow-[0px_0px_5px_gray] overflow-y-auto z-10 ${cityVisible ? "block" : "hidden"}`}
          >
            {filteredData.map((d, index) => (
              <li
                key={index}
                onClick={() => {
                  setCity(d)
                  setCityVisible(false)
                }}
                className="border-t p-2 bg-gray-100 cursor-pointer hover:bg-blue-700 hover:text-white"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>

        <select
          className="w-full md:w-1/5 border rounded-lg p-2 m-2 bg-[rgb(249,249,249)] placeholder:text-black"
        >
          <option value="">Experience</option>
          <option value="fresher">Fresher</option>
          <option value="1-3">1-3 yrs</option>
          <option value="3-5">3-5 yrs</option>
          <option value="5-8">5-8 yrs</option>
          <option value="8+">8+ yrs</option>
        </select>

        <button
          type="submit"
          className="w-full md:w-1/5 border rounded-lg p-2 m-2 text-white cursor-pointer bg-blue-600 hover:bg-green-600"
        >
          Search
        </button>
      </form>

      <p className="text-3xl text-white text-center font-bold my-6">Hot jobs</p>
      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((job, index) => (
            <JobCard key={index} jobRole={job.jobRole} location={job.location} experience={job.experience} skills={job.skills}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Careers
