const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const Staff = require("../models/Staff");

async function runSaveHook(Model, document) {
  await Model.schema.s.hooks.execPre("save", document, []);
}

test("Student password is hashed", async () => {
  const student = new Student({
    name: "Test Student",
    email: "student@example.com",
    studentId: "TEST001",
    password: "StudentPass123"
  });

  await runSaveHook(Student, student);

  assert.notEqual(student.password, "StudentPass123");
  assert.equal(
    await bcrypt.compare("StudentPass123", student.password),
    true
  );
});

test("Staff password is hashed", async () => {
  const staff = new Staff({
    name: "Test Staff",
    email: "staff@example.com",
    password: "StaffPass123",
    role: "staff"
  });

  await runSaveHook(Staff, staff);

  assert.notEqual(staff.password, "StaffPass123");
  assert.equal(
    await bcrypt.compare("StaffPass123", staff.password),
    true
  );
});

test("Existing bcrypt hashes are not hashed again", async () => {
  const hash = await bcrypt.hash("StudentPass123", 12);

  const student = new Student({
    name: "Test Student",
    email: "student2@example.com",
    studentId: "TEST002",
    password: hash
  });

  await runSaveHook(Student, student);

  assert.equal(student.password, hash);
});

test("Student password is excluded from default query selection", () => {
  assert.equal(Student.schema.path("password").options.select, false);
});

test("Staff password is excluded from default query selection", () => {
  assert.equal(Staff.schema.path("password").options.select, false);
});

test("Student password verification accepts the correct password", async () => {
  const hash = await bcrypt.hash("StudentPass123", 12);
  assert.equal(await bcrypt.compare("StudentPass123", hash), true);
  assert.equal(await bcrypt.compare("WrongPassword123", hash), false);
});

test("Staff password verification accepts the correct password", async () => {
  const hash = await bcrypt.hash("StaffPass123", 12);
  assert.equal(await bcrypt.compare("StaffPass123", hash), true);
  assert.equal(await bcrypt.compare("WrongPassword123", hash), false);
});
