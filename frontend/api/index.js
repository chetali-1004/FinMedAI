const express = require("express");
const app = express();
const cors = require("cors");
const { patient } = require("./db");
const { mainreq } = require("./types");
const redis = require("redis");

app.use(express.json());
app.use(cors());

() => {
  const inMemoryCache = new Map();
  const IN_MEMORY_CACHE_DURATION = 60 * 1000; // 1 minute

  // Redis cache setup:
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  redisClient.connect();
  const REDIS_CACHE_DURATION = 300; // 5 minutes

  function cacheInMemory(key, value) {
    inMemoryCache.set(key, value);
    setTimeout(() => {
      inMemoryCache.delete(key);
    }, IN_MEMORY_CACHE_DURATION);
  }

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
        // Save the updated patient data back to the in-memory cache
        cacheInMemory(patientKey, cachedPatient);

        return res.json({
          msg: "Diagnosis and Prescriptions added",
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
        // Save the updated patient data back to Redis and in-memory cache
        await cacheInRedis(patientKey, cachedPatient);
        cacheInMemory(patientKey, cachedPatient);

        return res.json({
          msg: "Diagnosis and Prescriptions added",
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

      // Mark the fields as modified
      existingPatient.markModified("diagnoses");
      existingPatient.markModified("prescriptions");

      // Save the updated document
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
};
