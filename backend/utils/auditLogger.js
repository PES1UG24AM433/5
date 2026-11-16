const ALLOWED_FIELDS = [
  "orderId",
  "actorType",
  "previousStatus",
  "newStatus",
  "errorName",
  "errorCode"
];

function logAuditEvent(event, details = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    event
  };

  for (const field of ALLOWED_FIELDS) {
    const value = details[field];
    if (
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= 100
    ) {
      record[field] = value;
    } else if (field === "errorCode" && Number.isSafeInteger(value)) {
      record[field] = value;
    }
  }

  console.log(JSON.stringify(record));
}

function getSafeErrorDetails(error) {
  const details = {};
  if (typeof error?.name === "string") {
    details.errorName = error.name;
  }
  if (
    Number.isSafeInteger(error?.code) ||
    (typeof error?.code === "string" && error.code.length <= 100)
  ) {
    details.errorCode = error.code;
  }
  return details;
}

module.exports = { logAuditEvent, getSafeErrorDetails };
