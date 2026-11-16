const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

process.env.JWT_SECRET = "test-secret-for-order-data-integrity-tests";

const jwt = require("jsonwebtoken");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const orderRoutes = require("../routes/orderRoutes");

const student = {
  id: "507f1f77bcf86cd799439011",
  studentId: "TEST008",
  name: "Test Student",
  email: "student008@example.com"
};
const otherStudent = {
  ...student,
  id: "507f1f77bcf86cd799439021",
  studentId: "OTHER008",
  email: "other008@example.com"
};
const products = new Map([
  ["507f1f77bcf86cd799439012", {
    _id: "507f1f77bcf86cd799439012",
    name: "Integrity Test Wrap",
    price: 12.35,
    stock: 20,
    available: true
  }],
  ["507f1f77bcf86cd799439013", {
    _id: "507f1f77bcf86cd799439013",
    name: "Integrity Test Juice",
    price: 4.5,
    stock: 20,
    available: true
  }]
]);

function createServer() {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRoutes);
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        url: `http://127.0.0.1:${server.address().port}/api/orders`
      });
    });
  });
}

function createToken(identity, accountType = "student", role) {
  return jwt.sign(
    { ...identity, accountType, ...(role ? { role } : {}) },
    process.env.JWT_SECRET
  );
}

async function request(url, token, method = "GET", body) {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

test("order data and ownership remain consistent through read, status update, and cancellation", async (t) => {
  const originalFindById = Order.findById;
  const originalCreate = Order.create;
  const originalMenuFindById = MenuItem.findById;
  const originalConsoleLog = console.log;
  const auditRecords = [];
  const storedOrders = new Map();
  let nextOrderNumber = 31;

  t.after(() => {
    Order.findById = originalFindById;
    Order.create = originalCreate;
    MenuItem.findById = originalMenuFindById;
    console.log = originalConsoleLog;
  });

  console.log = (line) => auditRecords.push(JSON.parse(line));
  Order.findById = (id) => {
    const order = storedOrders.get(id) || null;
    return {
      lean: async () => order,
      then: (resolve, reject) => Promise.resolve(order).then(resolve, reject)
    };
  };
  Order.create = async (data) => {
    const id = `507f1f77bcf86cd7994390${String(nextOrderNumber++).padStart(2, "0")}`;
    const order = {
      _id: id,
      ...data,
      orderTime: new Date("2026-11-16T00:00:00.000Z"),
      status: "Placed",
      paymentStatus: "Pending",
      async save() {
        storedOrders.set(this._id, this);
      }
    };
    storedOrders.set(id, order);
    return order;
  };
  MenuItem.findById = async (id) => products.get(id) || null;

  const { server, url } = await createServer();
  t.after(() => closeServer(server));

  const studentToken = createToken(student);
  const firstCreateResponse = await request(url, studentToken, "POST", {
    studentId: "UNTRUSTED-CLIENT-VALUE",
    totalAmount: 0.01,
    items: [
      { productId: "507f1f77bcf86cd799439012", quantity: 2 },
      { productId: "507f1f77bcf86cd799439013", quantity: 3 }
    ]
  });
  const firstCreateResult = await firstCreateResponse.json();
  assert.equal(firstCreateResponse.status, 201);

  const firstOrder = storedOrders.get(firstCreateResult.order.id);
  const expectedItems = [
    {
      productId: "507f1f77bcf86cd799439012",
      name: "Integrity Test Wrap",
      quantity: 2,
      unitPrice: 12.35,
      subtotal: 24.7
    },
    {
      productId: "507f1f77bcf86cd799439013",
      name: "Integrity Test Juice",
      quantity: 3,
      unitPrice: 4.5,
      subtotal: 13.5
    }
  ];
  assert.deepEqual(
    firstOrder.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    })),
    expectedItems
  );
  assert.equal(firstOrder.totalAmount, 38.2);
  assert.equal(firstOrder.studentId, student.studentId);
  assert.equal(firstOrder.studentEmail, student.email);

  const ownerReadResponse = await request(
    `${url}/${firstOrder._id}`,
    studentToken
  );
  assert.equal(ownerReadResponse.status, 200);
  const ownerReadResult = await ownerReadResponse.json();
  assert.equal(ownerReadResult.order.id, firstOrder._id);
  assert.equal(ownerReadResult.order.totalAmount, 38.2);
  assert.deepEqual(ownerReadResult.order.items, expectedItems);

  const unauthorizedReadResponse = await request(
    `${url}/${firstOrder._id}`,
    createToken(otherStudent)
  );
  assert.equal(unauthorizedReadResponse.status, 404);

  const orderSnapshot = (order) => ({
    studentId: order.studentId,
    studentEmail: order.studentEmail,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    })),
    totalAmount: order.totalAmount
  });
  const firstOrderSnapshot = orderSnapshot(firstOrder);

  const secondCreateResponse = await request(url, studentToken, "POST", {
    items: [{ productId: "507f1f77bcf86cd799439012", quantity: 1 }]
  });
  assert.equal(secondCreateResponse.status, 201);
  const secondCreateResult = await secondCreateResponse.json();
  const secondOrder = storedOrders.get(secondCreateResult.order.id);
  const secondOrderSnapshot = orderSnapshot(secondOrder);

  const staffToken = createToken(
    { id: "507f1f77bcf86cd799439022" },
    "staff",
    "staff"
  );
  const statusResponse = await request(
    `${url}/${secondOrder._id}/status`,
    staffToken,
    "PATCH",
    { status: "Completed" }
  );
  assert.equal(statusResponse.status, 200);
  assert.equal(secondOrder.status, "Completed");
  assert.deepEqual(orderSnapshot(secondOrder), secondOrderSnapshot);

  const cancelResponse = await request(
    `${url}/${firstOrder._id}/cancel`,
    studentToken,
    "PATCH"
  );
  assert.equal(cancelResponse.status, 200);
  assert.equal(firstOrder.status, "Cancelled");
  assert.deepEqual(orderSnapshot(firstOrder), firstOrderSnapshot);

  assert.equal(
    auditRecords.filter((record) => record.event === "order.created").length,
    2
  );
  assert.ok(auditRecords.some((record) =>
    record.event === "order.status_changed" &&
    record.orderId === secondOrder._id &&
    record.previousStatus === "Placed" &&
    record.newStatus === "Completed"
  ));
  assert.ok(auditRecords.some((record) =>
    record.event === "order.cancelled" &&
    record.orderId === firstOrder._id &&
    record.previousStatus === "Placed" &&
    record.newStatus === "Cancelled"
  ));
});

test("order creation failures log a safe diagnostic without request contents", async (t) => {
  const originalCreate = Order.create;
  const originalMenuFindById = MenuItem.findById;
  const originalConsoleLog = console.log;
  const auditRecords = [];

  t.after(() => {
    Order.create = originalCreate;
    MenuItem.findById = originalMenuFindById;
    console.log = originalConsoleLog;
  });

  console.log = (line) => auditRecords.push(JSON.parse(line));
  MenuItem.findById = async () => ({
    _id: "507f1f77bcf86cd799439012",
    name: "Integrity Test Wrap",
    price: 12.35,
    stock: 20,
    available: true
  });
  Order.create = async () => {
    const error = new Error("password=do-not-log bearer=do-not-log");
    error.code = "TEST_FAILURE";
    throw error;
  };

  const { server, url } = await createServer();
  t.after(() => closeServer(server));

  const response = await request(url, createToken(student), "POST", {
    items: [{ productId: "507f1f77bcf86cd799439012", quantity: 1 }],
    password: "request-password-must-not-be-logged"
  });
  assert.equal(response.status, 500);
  assert.equal(auditRecords.length, 1);
  assert.equal(auditRecords[0].event, "order.creation_failed");
  assert.equal(auditRecords[0].actorType, "student");
  assert.equal(auditRecords[0].errorName, "Error");
  assert.equal(auditRecords[0].errorCode, "TEST_FAILURE");
  assert.equal("password" in auditRecords[0], false);
  assert.doesNotMatch(JSON.stringify(auditRecords[0]), /do-not-log|request-password/);
});

test("status and cancellation failures log safe order diagnostics", async (t) => {
  const originalFindById = Order.findById;
  const originalConsoleLog = console.log;
  const auditRecords = [];

  t.after(() => {
    Order.findById = originalFindById;
    console.log = originalConsoleLog;
  });

  console.log = (line) => auditRecords.push(JSON.parse(line));
  Order.findById = async () => {
    const error = new Error("authorization bearer token must not be logged");
    error.name = "MongoError";
    error.code = "TEST_READ_FAILURE";
    throw error;
  };

  const { server, url } = await createServer();
  t.after(() => closeServer(server));

  const orderId = "507f1f77bcf86cd799439031";
  const statusResponse = await request(
    `${url}/${orderId}/status`,
    createToken({ id: "507f1f77bcf86cd799439022" }, "staff", "staff"),
    "PATCH",
    { status: "Completed" }
  );
  const cancellationResponse = await request(
    `${url}/${orderId}/cancel`,
    createToken(student),
    "PATCH"
  );

  assert.equal(statusResponse.status, 500);
  assert.equal(cancellationResponse.status, 500);
  assert.deepEqual(
    auditRecords.map((record) => record.event),
    ["order.status_change_failed", "order.cancellation_failed"]
  );
  for (const record of auditRecords) {
    assert.equal(record.orderId, orderId);
    assert.equal(record.errorName, "MongoError");
    assert.equal(record.errorCode, "TEST_READ_FAILURE");
  }
  assert.doesNotMatch(
    JSON.stringify(auditRecords),
    /authorization bearer token must not be logged/
  );
});
