const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://mern-book-store:Jr41tXRsUTBGlF8r@cluster0.mlvki.mongodb.net/bajaj_hackrx_new2"
  )
  .then(() => console.log("connected to db"))
  .catch((err) => console.log("mongo conneection failed", err));

const patientSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    min: 0,
    max: 120,
    required: false,
  },
  sex: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: false,
  },
  phone: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  diagnoses: {
    type: [String],
    required: true,
  },
  prescriptions: [
    {
      date: {
        type: String, // Store the date as a string
        required: false,
      },
      extractedDiagnosis: {
        type: String,
        required: true,
      },
    },
  ],

  icd: {
    type: [String],
    required: true,
  },

  confidence_score: {
    type: Number,
    required: true,
  },
});

const diagnosisSchema = mongoose.Schema({
  provisional_diagnosis: String,
});

const prescriptionSchema = mongoose.Schema({
  patient_id: String,
  diagnosis: [diagnosisSchema],
  extracted_at: {
    type: String,
  },
});

//indexing the db to reduce complexity and increase speed
patientSchema.index({ name: 1, age: 1, phone: 1 });

const patient = mongoose.model("patients", patientSchema);
const prescription = mongoose.model("prescriptions", prescriptionSchema);

module.exports = {
  patient,
  prescription,
};
