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
  required: ["id", "name", "email", "password_hash", "role", "is_active", "created_at", "updated_at"],
  properties: {
    id: { bsonType: ["int", "long"] },
    name: { bsonType: "string" },
    email: { bsonType: "string" },
    password_hash: { bsonType: "string" },
    role: { enum: ["candidate", "company", "admin"] },
    is_active: { bsonType: "bool" },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: "date" }
  }
});

ensureCollection("candidate_profiles", {
  bsonType: "object",
  required: ["user_id", "created_at", "updated_at"],
  properties: {
    user_id: { bsonType: ["int", "long"] },
    skills: {
      bsonType: ["array", "null"],
      items: { bsonType: "string" }
    },
    education: { bsonType: ["string", "null"] },
    experience: { bsonType: ["string", "null"] },
    resume_url: { bsonType: ["string", "null"] },
    resume_filename: { bsonType: ["string", "null"] },
    resume_parser_status: { bsonType: ["string", "null"] },
    resume_text_excerpt: { bsonType: ["string", "null"] },
    resume_parsed_skills: {
      bsonType: ["array", "null"],
      items: { bsonType: "string" }
    },
    linkedin: { bsonType: ["string", "null"] },
    portfolio: { bsonType: ["string", "null"] },
    phone: { bsonType: ["string", "null"] },
    location: { bsonType: ["string", "null"] },
    summary: { bsonType: ["string", "null"] },
    grad_year: { bsonType: ["int", "long", "null"] },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: "date" }
  }
});

ensureCollection("companies", {
  bsonType: "object",
  required: ["id", "owner_user_id", "company_name", "created_at", "updated_at"],
  properties: {
    id: { bsonType: ["int", "long"] },
    company_id: { bsonType: ["int", "long", "null"] },
    owner_user_id: { bsonType: ["int", "long"] },
    company_name: { bsonType: "string" },
    website: { bsonType: ["string", "null"] },
    company_website: { bsonType: ["string", "null"] },
    location: { bsonType: ["string", "null"] },
    description: { bsonType: ["string", "null"] },
    company_description: { bsonType: ["string", "null"] },
    company_logo: { bsonType: ["string", "null"] },
    industry_type: { bsonType: ["string", "null"] },
    company_size: { bsonType: ["string", "null"] },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: "date" }
  }
});

ensureCollection("jobs", {
  bsonType: "object",
  required: [
    "id",
    "company_id",
    "title",
    "description",
    "skills_required",
    "salary_range",
    "location",
    "experience_required",
    "created_at"
  ],
  properties: {
    id: { bsonType: ["int", "long"] },
    job_id: { bsonType: ["int", "long", "null"] },
    company_id: { bsonType: ["int", "long"] },
    title: { bsonType: "string" },
    job_title: { bsonType: ["string", "null"] },
    description: { bsonType: "string" },
    job_description: { bsonType: ["string", "null"] },
    skills_required: {
      bsonType: "array",
      items: { bsonType: "string" }
    },
    skills: {
      bsonType: ["array", "null"],
      items: { bsonType: "string" }
    },
    salary_range: { bsonType: ["string", "null"] },
    salary_min: { bsonType: ["int", "long", "null"] },
    salary_max: { bsonType: ["int", "long", "null"] },
    location: { bsonType: "string" },
    experience_required: { bsonType: "string" },
    education_required: { bsonType: ["string", "null"] },
    employment_type: { bsonType: ["string", "null"] },
    is_active: { bsonType: ["bool", "null"] },
    moderation_status: { enum: ["approved", "pending", "rejected", null] },
    posted_date: { bsonType: ["date", "null"] },
    expiry_date: { bsonType: ["date", "null"] },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: ["date", "null"] }
  }
});

ensureCollection("applications", {
  bsonType: "object",
  required: ["id", "job_id", "candidate_id", "status", "applied_at"],
  properties: {
    id: { bsonType: ["int", "long"] },
    application_id: { bsonType: ["int", "long", "null"] },
    job_id: { bsonType: ["int", "long"] },
    candidate_id: { bsonType: ["int", "long"] },
    user_id: { bsonType: ["int", "long", "null"] },
    company_id: { bsonType: ["int", "long", "null"] },
    status: {
      enum: ["applied", "reviewing", "shortlisted", "interview", "offered", "rejected"]
    },
    applied_at: { bsonType: "date" },
    updated_at: { bsonType: ["date", "null"] }
  }
});

ensureCollection("saved_jobs", {
  bsonType: "object",
  required: ["id", "candidate_id", "job_id", "created_at"],
  properties: {
    id: { bsonType: ["int", "long"] },
    candidate_id: { bsonType: ["int", "long"] },
    job_id: { bsonType: ["int", "long"] },
    created_at: { bsonType: "date" }
  }
});

ensureCollection("notifications", {
  bsonType: "object",
  required: ["id", "user_id", "type", "title", "message", "is_read", "email_status", "created_at"],
  properties: {
    id: { bsonType: ["int", "long"] },
    user_id: { bsonType: ["int", "long"] },
    type: { bsonType: "string" },
    title: { bsonType: "string" },
    message: { bsonType: "string" },
    is_read: { bsonType: "bool" },
    email_status: { bsonType: "string" },
    metadata: { bsonType: ["object", "null"] },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: ["date", "null"] }
  }
});

const countersExists = appDb.getCollectionInfos({ name: "counters" }).length > 0;
if (!countersExists) {
  appDb.createCollection("counters");
}

["users", "companies", "jobs", "applications", "saved_jobs", "notifications"].forEach(function (name) {
  appDb.counters.updateOne(
    { _id: name },
    { $setOnInsert: { seq: 0 } },
    { upsert: true }
  );
});

ensureIndex("users", { id: 1 }, { unique: true, name: "uq_users_id" });
ensureIndex("users", { email: 1 }, { unique: true, name: "uq_users_email" });

ensureIndex("candidate_profiles", { user_id: 1 }, { unique: true, name: "uq_candidate_profiles_user_id" });

ensureIndex("companies", { id: 1 }, { unique: true, name: "uq_companies_id" });
ensureIndex("companies", { owner_user_id: 1 }, { unique: true, name: "uq_companies_owner_user" });

ensureIndex("jobs", { id: 1 }, { unique: true, name: "uq_jobs_id" });
ensureIndex("jobs", { company_id: 1, created_at: -1 }, { name: "ix_jobs_company_created_at" });
ensureIndex("jobs", { expiry_date: 1 }, { name: "ix_jobs_expiry_date" });

ensureIndex("applications", { id: 1 }, { unique: true, name: "uq_applications_id" });
ensureIndex(
  "applications",
  { candidate_id: 1, job_id: 1 },
  { unique: true, name: "uq_applications_candidate_job" }
);
ensureIndex(
  "applications",
  { company_id: 1, status: 1, applied_at: -1 },
  { name: "ix_applications_company_status" }
);

ensureIndex("saved_jobs", { id: 1 }, { unique: true, name: "uq_saved_jobs_id" });
ensureIndex(
  "saved_jobs",
  { candidate_id: 1, job_id: 1 },
  { unique: true, name: "uq_saved_jobs_candidate_job" }
);

ensureIndex("notifications", { id: 1 }, { unique: true, name: "uq_notifications_id" });
ensureIndex(
  "notifications",
  { user_id: 1, created_at: -1 },
  { name: "ix_notifications_user_created_at" }
);
ensureIndex(
  "notifications",
  { user_id: 1, is_read: 1, created_at: -1 },
  { name: "ix_notifications_user_read_state" }
);

print("MongoDB schema ready for database: " + databaseName);
