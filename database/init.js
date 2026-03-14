const databaseName = "fresher_connect";
const appDb = db.getSiblingDB(databaseName);

function ensureCollection(name, schema) {
  const options = {
    validator: { $jsonSchema: schema },
    validationLevel: "moderate",
    validationAction: "error"
  };

  const exists = appDb.getCollectionInfos({ name: name }).length > 0;
  if (!exists) {
    appDb.createCollection(name, options);
    return;
  }

  appDb.runCommand({
    collMod: name,
    validator: options.validator,
    validationLevel: options.validationLevel,
    validationAction: options.validationAction
  });
}

function ensureIndex(collectionName, keys, options) {
  appDb.getCollection(collectionName).createIndex(keys, options || {});
}

ensureCollection("users", {
  bsonType: "object",
  required: [
    "user_id",
    "name",
    "email",
    "password_hash",
    "role",
    "education",
    "grad_year",
    "skills",
    "is_premium",
    "created_at",
    "updated_at"
  ],
  properties: {
    user_id: { bsonType: ["int", "long"] },
    name: { bsonType: "string" },
    email: { bsonType: "string" },
    password_hash: { bsonType: "string" },
    role: { enum: ["fresher"] },
    phone: { bsonType: ["string", "null"] },
    location: { bsonType: ["string", "null"] },
    education: { bsonType: "string" },
    grad_year: { bsonType: ["int", "long"] },
    skills: {
      bsonType: "array",
      items: { bsonType: "string" }
    },
    summary: { bsonType: ["string", "null"] },
    resume_path: { bsonType: ["string", "null"] },
    is_premium: { bsonType: "bool" },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: "date" }
  }
});

ensureCollection("companies", {
  bsonType: "object",
  required: [
    "company_id",
    "contact_name",
    "email",
    "password_hash",
    "company_name",
    "company_website",
    "industry_type",
    "company_size",
    "company_description",
    "created_at",
    "updated_at"
  ],
  properties: {
    company_id: { bsonType: ["int", "long"] },
    contact_name: { bsonType: "string" },
    email: { bsonType: "string" },
    password_hash: { bsonType: "string" },
    company_name: { bsonType: "string" },
    company_logo: { bsonType: ["string", "null"] },
    company_website: { bsonType: "string" },
    industry_type: { bsonType: "string" },
    company_size: { bsonType: "string" },
    company_description: { bsonType: "string" },
    location: { bsonType: ["string", "null"] },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: "date" }
  }
});

ensureCollection("jobs", {
  bsonType: "object",
  required: [
    "job_id",
    "company_id",
    "job_title",
    "job_description",
    "experience_required",
    "education_required",
    "location",
    "employment_type",
    "skills",
    "posted_date",
    "expiry_date"
  ],
  properties: {
    job_id: { bsonType: ["int", "long"] },
    company_id: { bsonType: ["int", "long"] },
    job_title: { bsonType: "string" },
    job_description: { bsonType: "string" },
    experience_required: { bsonType: "string" },
    education_required: { bsonType: "string" },
    salary_min: { bsonType: ["int", "long", "null"] },
    salary_max: { bsonType: ["int", "long", "null"] },
    location: { bsonType: "string" },
    employment_type: {
      enum: ["full-time", "internship", "contract", "part-time", "hybrid"]
    },
    skills: {
      bsonType: "array",
      items: { bsonType: "string" }
    },
    department: { bsonType: ["string", "null"] },
    work_mode: { bsonType: ["string", "null"] },
    posted_date: { bsonType: "date" },
    expiry_date: { bsonType: "date" },
    is_active: { bsonType: ["bool", "null"] }
  }
});

ensureCollection("applications", {
  bsonType: "object",
  required: [
    "application_id",
    "user_id",
    "company_id",
    "job_id",
    "status",
    "applied_at"
  ],
  properties: {
    application_id: { bsonType: ["int", "long"] },
    user_id: { bsonType: ["int", "long"] },
    company_id: { bsonType: ["int", "long"] },
    job_id: { bsonType: ["int", "long"] },
    status: {
      enum: ["applied", "reviewing", "shortlisted", "interview", "offered", "rejected"]
    },
    applied_at: { bsonType: "date" },
    updated_at: { bsonType: ["date", "null"] }
  }
});

const countersExists = appDb.getCollectionInfos({ name: "counters" }).length > 0;
if (!countersExists) {
  appDb.createCollection("counters");
}

["users", "companies", "jobs", "applications"].forEach(function (name) {
  appDb.counters.updateOne(
    { _id: name },
    { $setOnInsert: { seq: 0 } },
    { upsert: true }
  );
});

ensureIndex("users", { user_id: 1 }, { unique: true, name: "uq_users_user_id" });
ensureIndex("users", { email: 1 }, { unique: true, name: "uq_users_email" });

ensureIndex("companies", { company_id: 1 }, { unique: true, name: "uq_companies_company_id" });
ensureIndex("companies", { email: 1 }, { unique: true, name: "uq_companies_email" });

ensureIndex("jobs", { job_id: 1 }, { unique: true, name: "uq_jobs_job_id" });
ensureIndex("jobs", { company_id: 1, posted_date: -1 }, { name: "ix_jobs_company_posted_date" });
ensureIndex("jobs", { expiry_date: 1 }, { name: "ix_jobs_expiry_date" });

ensureIndex(
  "applications",
  { user_id: 1, job_id: 1 },
  { unique: true, name: "uq_applications_user_job" }
);
ensureIndex(
  "applications",
  { company_id: 1, status: 1, applied_at: -1 },
  { name: "ix_applications_company_status" }
);

print("MongoDB schema ready for database: " + databaseName);
