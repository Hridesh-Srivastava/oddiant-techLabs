import { MongoClient } from "mongodb"
import { config } from "dotenv"
import { join } from "path"

config({ path: join(process.cwd(), ".env.local") })

const MONGODB_URI = process.env.MONGODB_URI

async function actualDataRollback() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("oddiant")

    console.log("🔄 Starting ACTUAL data structure rollback...")

    // Rollback candidates collection
    await rollbackCollection(db, "candidates")

    // Rollback students collection
    await rollbackCollection(db, "students")

    console.log("🎉 ACTUAL data structure rollback completed!")
  } catch (error) {
    console.error("❌ Rollback failed:", error)
  } finally {
    await client.close()
  }
}

async function rollbackCollection(db, collectionName) {
  console.log(`\n📝 Rolling back ${collectionName} collection...`)

  const collection = db.collection(collectionName)
  const documents = await collection.find({ dataVersion: "2.0" }).toArray()

  console.log(`Found ${documents.length} normalized documents to rollback`)

  for (const doc of documents) {
    const rollbackUpdates = {}

    // 1. Rollback experience (array back to string/object)
    if (Array.isArray(doc.experience) && doc.experience.length > 0) {
      const firstExp = doc.experience[0]
      if (firstExp.professionalSummary) {
        rollbackUpdates.experience = firstExp.professionalSummary
      } else if (firstExp.companyName) {
        rollbackUpdates.experience = firstExp.companyName
      } else {
        rollbackUpdates.experience = `${firstExp.title || "Experience"} at ${firstExp.companyName || "Company"}`
      }
      console.log(`  🔄 Rolling back experience for ${doc._id}`)
    }

    // 2. Rollback education (array back to string/object)
    if (Array.isArray(doc.education) && doc.education.length > 0) {
      const firstEdu = doc.education[0]
      if (firstEdu.degree) {
        rollbackUpdates.education = firstEdu.degree
      } else {
        rollbackUpdates.education = `${firstEdu.level || "Degree"} from ${firstEdu.institution || "Institution"}`
      }
      console.log(`  🔄 Rolling back education for ${doc._id}`)
    }

    // 3. Rollback skills (array back to string)
    if (Array.isArray(doc.skills) && doc.skills.length > 0) {
      rollbackUpdates.skills = doc.skills.join(", ")
      console.log(`  🔄 Rolling back skills for ${doc._id}`)
    }

    // 4. Rollback certifications (structured array back to string array)
    if (Array.isArray(doc.certifications) && doc.certifications.length > 0) {
      if (typeof doc.certifications[0] === "object" && doc.certifications[0].name) {
        rollbackUpdates.certifications = doc.certifications.map((cert) => cert.name)
        console.log(`  🔄 Rolling back certifications for ${doc._id}`)
      }
    }

    // 5. Rollback preferenceCities (if it was preferredCities originally)
    if (Array.isArray(doc.preferenceCities) && !doc.preferredCities) {
      rollbackUpdates.preferredCities = doc.preferenceCities
      rollbackUpdates.$unset = { preferenceCities: "" }
      console.log(`  🔄 Rolling back preference cities for ${doc._id}`)
    }

    // 6. Remove normalization metadata
    rollbackUpdates.$unset = {
      ...rollbackUpdates.$unset,
      dataVersion: "",
      lastNormalized: "",
    }

    // Apply rollback updates
    if (Object.keys(rollbackUpdates).length > 1 || rollbackUpdates.$unset) {
      const updateOperation = {}

      // Separate $set and $unset operations
      const { $unset, ...setFields } = rollbackUpdates

      if (Object.keys(setFields).length > 0) {
        updateOperation.$set = setFields
      }

      if ($unset) {
        updateOperation.$unset = $unset
      }

      await collection.updateOne({ _id: doc._id }, updateOperation)
      console.log(`  ✅ Rolled back document ${doc._id}`)
    }
  }

  console.log(`✅ Completed ${collectionName} rollback`)
}

// Run the rollback
actualDataRollback()
  .then(() => {
    console.log("\n🎉 COMPLETE DATA STRUCTURE ROLLBACK FINISHED!")
    console.log("✅ Your data is now back to original structure")
    console.log("🔄 You can now restart your application")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Rollback failed:", error)
    process.exit(1)
  })
