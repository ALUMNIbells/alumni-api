const PAYMENT_TYPES = {
  "ALUMNI CLEARANCE DUES": {
    amountKey: "alumniDues",
    splitCode: "SPL_qb31b7ThqX",
    uniqueCompleted: true,
    onSuccess: ["sendWelcomeEmail"],
    addition: 1000
  },
  "ALUMNI CLEARANCE DUES - MSC": {
    amountKey: "alumniDues",
    splitCode: "SPL_qb31b7ThqX",
    uniqueCompleted: true,
    onSuccess: ["sendWelcomeEmail"],
    addition: 1000
  },
  "ALUMNI CLEARANCE DUES - PGD": {
    amountKey: "alumniDues",
    splitCode: "SPL_qb31b7ThqX",
    uniqueCompleted: true,
    onSuccess: ["sendWelcomeEmail"],
    addition: 1000
  },
  "ALUMNI CLEARANCE DUES - PHD": {
    amountKey: "alumniDues",
    splitCode: "SPL_qb31b7ThqX",
    uniqueCompleted: true,
    onSuccess: ["sendWelcomeEmail"],
    addition: 1000
  },
  "ALUMNI DONATION": {
    amountKey: "alumniDonation",
    splitCode: "SPL_Yz4usMsAJz",
    addition: 1000
  },
  "SOUVENIR_PURCHASE": {
    amountKey: null, // Amount will be determined by the specific souvenir's price
    splitCode: '', 
    addition: 300
  },
  "STUDENT TRANSCRIPT": {
    amountKey: "studentTranscript",
    splitCode: "SPL_IORoFrp9Y9",
    addition: 3000
  },
};

export default PAYMENT_TYPES;