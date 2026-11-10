const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-secret-for-authentication-tests";

const jwt = require("jsonwebtoken");

const {
  authenticateStaff,
  authorizeStaffRoles
} = require("../middleware/authMiddleware");

const {
  authenticateStudent
} = require("../middleware/studentAuthMiddleware");

const validId = "507f1f77bcf86cd799439011";

function createToken(payload, expiresIn = "1h") {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function invokeMiddleware(middleware, authorization) {
  const req = { headers: {} };

  if (authorization !== undefined) {
    req.headers.authorization = authorization;
  }

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

test("Staff middleware rejects missing token", () => {
  const { res, nextCalled } = invokeMiddleware(authenticateStaff);
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Staff middleware rejects malformed token", () => {
  const { res, nextCalled } = invokeMiddleware(
    authenticateStaff,
    "Bearer invalid-token"
  );
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Staff middleware rejects expired token", () => {
  const token = createToken(
    { id: validId, accountType: "staff", role: "staff" },
    "-1s"
  );

  const { res, nextCalled } = invokeMiddleware(
    authenticateStaff,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Staff middleware rejects student token", () => {
  const token = createToken({
    id: validId,
    accountType: "student"
  });

  const { res, nextCalled } = invokeMiddleware(
    authenticateStaff,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("Staff middleware rejects invalid account ID", () => {
  const token = createToken({
    id: "invalid-id",
    accountType: "staff",
    role: "staff"
  });

  const { res, nextCalled } = invokeMiddleware(
    authenticateStaff,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Staff middleware accepts valid staff token", () => {
  const token = createToken({
    id: validId,
    accountType: "staff",
    role: "staff"
  });

  const { req, res, nextCalled } = invokeMiddleware(
    authenticateStaff,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.equal(req.staff.id, validId);
  assert.equal(req.staff.role, "staff");
});

test("Student middleware rejects missing token", () => {
  const { res, nextCalled } = invokeMiddleware(authenticateStudent);
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Student middleware rejects malformed token", () => {
  const { res, nextCalled } = invokeMiddleware(
    authenticateStudent,
    "Bearer invalid-token"
  );

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Student middleware rejects expired token", () => {
  const token = createToken(
    { id: validId, accountType: "student" },
    "-1s"
  );

  const { res, nextCalled } = invokeMiddleware(
    authenticateStudent,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Student middleware rejects staff token", () => {
  const token = createToken({
    id: validId,
    accountType: "staff",
    role: "staff"
  });

  const { res, nextCalled } = invokeMiddleware(
    authenticateStudent,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("Student middleware accepts valid student token", () => {
  const token = createToken({
    id: validId,
    accountType: "student",
    name: "Test Student",
    studentId: "TEST33",
    email: "teststudent33@example.com"
  });

  const { req, res, nextCalled } = invokeMiddleware(
    authenticateStudent,
    `Bearer ${token}`
  );

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.equal(req.student.id, validId);
  assert.equal(req.student.studentId, "TEST33");
});

test("Staff role authorization allows permitted roles", () => {
  for (const role of ["staff", "manager"]) {
    const req = { staff: { id: validId, role } };
    let nextCalled = false;

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };

    authorizeStaffRoles("staff", "manager")(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  }
});

test("Staff role authorization rejects unauthorized role", () => {
  const req = { staff: { id: validId, role: "student" } };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  let nextCalled = false;

  authorizeStaffRoles("staff", "manager")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("Staff role authorization rejects missing staff identity", () => {
  const req = {};
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  let nextCalled = false;

  authorizeStaffRoles("staff", "manager")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});
