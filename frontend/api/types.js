const zod = require("zod");

const mainreq = zod.object({
  name: zod.string(),
  age: zod.number().min(0).max(120).optional(),
  sex: zod.enum(["Male", "Female", "Other"]).optional(),
  address: zod.string().optional(),
  email: zod.string().email(),
  phone: zod.string(),
  diagnoses: zod.array(zod.string()),
  prescriptions: zod.array(
    zod.object({
      date: zod.string().optional(),
      extractedDiagnosis: zod.string(),
    })
  ),
  icd: zod.array(zod.string()),
  confidence_score: zod.number(),
});

module.exports = {
  mainreq: mainreq,
};
