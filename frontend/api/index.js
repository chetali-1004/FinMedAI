const express = require("express");
const app = express();
const cors = require("cors");
const { patient } = require("./db");
const { mainreq } = require("./types");
const redis = require("redis");

app.use(express.json());
app.use(cors());

// Encapsulate the cache logic to avoid redeclaration conflicts
(() => {
  // In-memory cache setup for frequent clicks
  const inMemoryCache = new Map();
  const IN_MEMORY_CACHE_DURATION = 60 * 1000; // 1 minute

  // Redis cache setup:
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  redisClient.connect();
  const REDIS_CACHE_DURATION = 300; // 5 minutes

  // Function to cache data in memory
  function cacheInMemory(key, value) {
    inMemoryCache.set(key, value);
    setTimeout(() => {
      inMemoryCache.delete(key);
    }, IN_MEMORY_CACHE_DURATION);
  }

  // Function to get data from in-memory cache
  function getFromInMemoryCache(key) {
    return inMemoryCache.get(key);
  }

  // Function to cache data in Redis
  async function cacheInRedis(key, value) {
    await redisClient.set(key, JSON.stringify(value), {
      EX: REDIS_CACHE_DURATION, // Set cache expiration (5 minutes)
    });
  }

  // Function to retrieve data from Redis
  async function getFromRedisCache(key) {
    const cachedValue = await redisClient.get(key);
    return cachedValue ? JSON.parse(cachedValue) : null;
  }

  // Route: POST /update
  // Route: POST /update
  app.post("/update", async function (req, res) {
    console.log("Received a post request to /update");
    const createPayload = req.body;
    console.log("Received payload:", createPayload);

    const parsedPayload = mainreq.safeParse(createPayload);

    if (!parsedPayload.success) {
      console.log("Validation failed:", parsedPayload.error);
      console.log("Validation errors:", parsedPayload.error.errors);

      return res.status(400).json({
        msg: "You sent wrong inputs",
        errors: parsedPayload.error.errors,
      });
    }

    const prescriptionsWithDateStrings = parsedPayload.data.prescriptions?.map(
      (prescription) => {
        const mappedPrescription = {
          extractedDiagnosis: prescription.extractedDiagnosis,
        };

        if (prescription.date !== undefined) {
          mappedPrescription.date = prescription.date;
        }

        return mappedPrescription;
      }
    );

    // Check if the patient is already cached
    const patientKey = `${createPayload.name}-${createPayload.age}-${createPayload.phone}`;
    let cachedPatient = getFromInMemoryCache(patientKey);

    // If found in in-memory cache
    if (cachedPatient) {
      console.log(
        "Returning cached patient from in-memory cache:",
        cachedPatient
      );

      // Append new diagnoses and prescriptions to the cached patient
      try {
        cachedPatient.diagnoses.push(...createPayload.diagnoses);
        if (prescriptionsWithDateStrings) {
          cachedPatient.prescriptions.push(...prescriptionsWithDateStrings);
        }

        // Update the database with the new diagnoses and prescriptions
        await patient.updateOne(
          {
            name: createPayload.name,
            age: createPayload.age,
            phone: createPayload.phone,
          },
          {
            $push: {
              diagnoses: { $each: createPayload.diagnoses },
              prescriptions: { $each: prescriptionsWithDateStrings },
            },
          }
        );

        // Save the updated patient data back to the in-memory cache
        cacheInMemory(patientKey, cachedPatient);

        return res.json({
          msg: "Diagnosis and Prescriptions added to cache and updated in database",
        });
      } catch (error) {
        console.error("Error updating cached patient:", error);
        return res.status(500).json({
          msg: "Error updating cached patient",
          error: error.message,
        });
      }
    }

    // If not found in memory, check Redis cache
    cachedPatient = await getFromRedisCache(patientKey);
    if (cachedPatient) {
      console.log("Returning cached patient from Redis cache:", cachedPatient);

      // Append new diagnoses and prescriptions to the cached patient
      try {
        cachedPatient.diagnoses.push(...createPayload.diagnoses);
        if (prescriptionsWithDateStrings) {
          cachedPatient.prescriptions.push(...prescriptionsWithDateStrings);
        }

        // Update the database with the new diagnoses and prescriptions
        await patient.updateOne(
          {
            name: createPayload.name,
            age: createPayload.age,
            phone: createPayload.phone,
          },
          {
            $push: {
              diagnoses: { $each: createPayload.diagnoses },
              prescriptions: { $each: prescriptionsWithDateStrings },
            },
          }
        );

        // Save the updated patient data back to Redis and in-memory cache
        await cacheInRedis(patientKey, cachedPatient);
        cacheInMemory(patientKey, cachedPatient);

        return res.json({
          msg: "Diagnosis and Prescriptions added to cache and updated in database",
        });
      } catch (error) {
        console.error("Error updating cached patient in Redis:", error);
        return res.status(500).json({
          msg: "Error updating cached patient in Redis",
          error: error.message,
        });
      }
    }

    // If patient is not in any cache, query the database
    const existingPatient = await patient.findOne({
      name: createPayload.name,
      age: createPayload.age,
      phone: createPayload.phone,
    });

    if (existingPatient) {
      // Append new diagnoses and prescriptions
      existingPatient.diagnoses.push(...createPayload.diagnoses);
      if (prescriptionsWithDateStrings) {
        existingPatient.prescriptions.push(...prescriptionsWithDateStrings);
      }
      await existingPatient.save();

      // Cache patient in both memory and Redis
      cacheInMemory(patientKey, existingPatient);
      await cacheInRedis(patientKey, existingPatient);

      return res.json({
        msg: "Diagnosis and Prescriptions added",
      });
    } else {
      const newPatientPayload = {
        name: createPayload.name,
        email: createPayload.email,
        phone: createPayload.phone,
        diagnoses: createPayload.diagnoses,
        prescriptions: prescriptionsWithDateStrings,
        icd: createPayload.icd,
        confidence_score: createPayload.confidence_score,
      };

      // Conditionally add optional fields
      if (createPayload.age !== undefined) {
        newPatientPayload.age = createPayload.age;
      }
      if (createPayload.sex !== undefined) {
        newPatientPayload.sex = createPayload.sex;
      }

      try {
        const newPatient = await patient.create(newPatientPayload);

        cacheInMemory(patientKey, newPatient);
        await cacheInRedis(patientKey, newPatient);

        return res.json({
          msg: "New patient created successfully",
        });
      } catch (error) {
        console.error("Error creating new patient:", error);
        return res.status(500).json({
          msg: "Error creating new patient",
          error: error.message,
        });
      }
    }
  });

  // Route: POST /filter
  // app.post("/filter", async (req, res) => {
  //   const { patientName, email, phoneNumber } = req.body;

  //   // Check if at least one field is provided
  //   if (!patientName && !email && !phoneNumber) {
  //     return res
  //       .status(400)
  //       .json({ message: "At least one field must be provided." });
  //   }

  //   // Build the query based on provided fields
  //   const query = {};
  //   if (patientName) query.name = { $regex: new RegExp(patientName, "i") };
  //   if (email) query.email = { $regex: new RegExp(email, "i") };
  //   if (phoneNumber) query.phone = { $regex: new RegExp(phoneNumber, "i") };

  //   console.log("Constructed Query: ", query);

  //   try {
  //     // Find patients with similar attributes
  //     const patients = await patient.find(query);

  //     console.log("Found Patients: ", patients); // Check the output
  //     return res.status(200).json(patients);
  //   } catch (error) {
  //     console.error("Error during query:", error.message);
  //     return res
  //       .status(500)
  //       .json({ message: "Internal server error", error: error.message });
  //   }
  // });

  app.post("/filter", async (req, res) => {
    const { patientName, email, phoneNumber } = req.body;

    // Ensure at least one field (either patientName or email) is provided
    if (!patientName && !email && !phoneNumber) {
      return res.status(400).json({
        message: "At least one search field (name or email) is required.",
      });
    }

    try {
      // Build the query using $or to match either name or email
      const query = {
        $or: [],
      };

      // Add partial match for name if provided
      if (patientName) {
        query.$or.push({
          name: { $regex: new RegExp(patientName, "i") }, // Case-insensitive partial match for name
        });
      }

      // Add partial match for email if provided
      if (email) {
        query.$or.push({
          email: { $regex: new RegExp(email, "i") }, // Case-insensitive partial match for email
        });
      }

      if (phoneNumber) {
        query.$or.push({
          phone: phoneNumber, // Case-insensitive partial match for phone
        });
      }

      // Execute the search query
      const patients = await patient.find(query);
      console.log("Found Patients: ", patients);

      if (patients.length === 0) {
        return res.status(404).json({ message: "No records found." });
      }

      return res.status(200).json(patients);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  });

  app.get("/patient", async function (req, res) {
    console.log("Received a get request to /patients");

    const patientId = req.headers["patient-id"];
    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID header is required" });
    }

    // Check if the patient details are cached in memory
    const cachedPatient = getFromInMemoryCache(`patient_${patientId}`);
    if (cachedPatient) {
      console.log("Returning cached patient from in-memory cache");

      return res.json({
        msg: "Data fetched from in-memory cache",
        patient: cachedPatient,
      });
    }

    // If not found in memory, check Redis cache
    const cachedPatientFromRedis = await getFromRedisCache(
      `patient_${patientId}`
    );
    if (cachedPatientFromRedis) {
      console.log("Returning cached patient from Redis cache");

      // Cache the data to in-memory cache for faster subsequent access
      cacheInMemory(`patient_${patientId}`, cachedPatientFromRedis);

      return res.json({
        msg: "Data fetched from Redis cache",
        patient: cachedPatientFromRedis,
      });
    }

    // If patient details are not in any cache, query the database
    const patients = await patient.findById(patientId);
    if (!patients) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Cache the patient details in both memory and Redis
    cacheInMemory(`patient_${patientId}`, patients);
    await cacheInRedis(`patient_${patientId}`, patients);

    return res.json({
      msg: "Data fetched from database",
      patient: patients,
    });
  });

  // Start the server
  app.listen(3000, function () {
    console.log("Server is running on port 3000");
  });
})();
