const test = require("node:test");
const assert = require("node:assert/strict");
const { getSafeErrorDetails, logAuditEvent } = require("../utils/auditLogger");

test("audit events are timestamped, structured, and restricted to safe fields", (t) => {
  const originalLog = console.log;
  const output = [];
  t.after(() => {
    console.log = originalLog;
  });
  console.log = (line) => output.push(line);

  logAuditEvent("order.status_changed", {
    orderId: "507f1f77bcf86cd799439011",
    actorType: "staff",
    previousStatus: "Placed",
    newStatus: "Completed",
    password: "must-not-be-logged",
    token: "must-not-be-logged",
    requestBody: { items: ["sensitive"] }
  });

  assert.equal(output.length, 1);
  const record = JSON.parse(output[0]);
  assert.match(record.timestamp, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(record.event, "order.status_changed");
  assert.equal(record.orderId, "507f1f77bcf86cd799439011");
  assert.equal(record.actorType, "staff");
  assert.equal(record.previousStatus, "Placed");
  assert.equal(record.newStatus, "Completed");
  assert.equal("password" in record, false);
  assert.equal("token" in record, false);
  assert.equal("requestBody" in record, false);
  assert.doesNotMatch(output[0], /must-not-be-logged|sensitive/);
});

test("safe error details retain diagnostic type/code but exclude raw messages", (t) => {
  const originalLog = console.log;
  const output = [];
  t.after(() => {
    console.log = originalLog;
  });
  console.log = (line) => output.push(line);

  logAuditEvent("order.creation_failed", {
    actorType: "student",
    ...getSafeErrorDetails({
      name: "MongoServerError",
      code: 11000,
      message: "password=secret bearer token-value"
    })
  });

  const record = JSON.parse(output[0]);
  assert.equal(record.errorName, "MongoServerError");
  assert.equal(record.errorCode, 11000);
  assert.equal("message" in record, false);
  assert.doesNotMatch(output[0], /password|secret|token-value/);
});
