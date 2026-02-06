const PAYMENT_TYPES = {
  "ALUMNI CLEARANCE DUES": {
    amountKey: "alumniDues",
    splitCode: "SPL_qb31b7ThqX",
    uniqueCompleted: true,
    onSuccess: ["sendWelcomeEmail"],
  },
  "ALUMNI DONATION": {
    amountKey: "alumniDonation",
    splitCode: "SPL_Yz4usMsAJz",
  },
  "SOUVENIR_PURCHASE": {
    amountKey: null, // Amount will be determined by the specific souvenir's price
    splitCode: '', 
  },
  "STUDENT TRANSCRIPT": {
    amountKey: "studentTranscript",
    splitCode: "",
  },
};

export default PAYMENT_TYPES;