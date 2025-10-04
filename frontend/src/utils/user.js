export const normalizeUser = (data) => ({
    id: data.id || data.user_id || data.userID,
    name: data.name || "",
    email: data.email || "",
    role: (data.role || "").toUpperCase(),
    verification_status: (data.verification_status || data.verificationStatus || "").toUpperCase(),

    age: data.age || "",
    gender: data.gender || "",
    medical_history: data.medical_history || data.medicalHistory || "",

    specialization: data.specialization || "",
    npi_number: data.npi_number || "",

});
