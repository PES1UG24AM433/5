const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const express = require("express");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const orderRoutes = require("../routes/orderRoutes");

const testMongoUri = process.env.CPS_TEST_MONGODB_URI;
const allowedTestDatabase = "canteen_preorder_test";

function assertIsolatedTestDatabase(uri) {
  const parsedUri = new URL(uri);
  assert.ok(
    parsedUri.protocol === "mongodb:" || parsedUri.protocol === "mongodb+srv:",
    "Test MongoDB URI must use the MongoDB protocol."
  );
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsedUri.hostname),
    "Order integrity integration tests may only use a local MongoDB server."
  );
  assert.equal(
    parsedUri.pathname.slice(1).split("/")[0],
    allowedTestDatabase,
    `Integration tests may only write to ${allowedTestDatabase}.`
  );
}

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

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
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

function snapshot(order) {
  return {
    studentId: order.studentId,
    studentEmail: order.studentEmail,
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    })),
    totalAmount: order.totalAmount
  };
}

test("persisted order data stays consistent through status update and cancellation", {
  skip: !testMongoUri
}, async (t) => {
  assertIsolatedTestDatabase(testMongoUri);
  process.env.JWT_SECRET ||= `test-secret-${randomUUID()}`;
  await mongoose.connect(testMongoUri);

  const suffix = randomUUID();
  const student = {
    id: new mongoose.Types.ObjectId().toString(),
    studentId: `TEST008-${suffix}`,
    name: "Synthetic Integrity Test Student",
    email: `test-${suffix}@example.invalid`
  };
  const otherStudent = {
    ...student,
    id: new mongoose.Types.ObjectId().toString(),
    studentId: `OTHER008-${suffix}`,
    email: `other-${suffix}@example.invalid`
  };
  const menuItems = [];
  const createdOrderIds = [];
  let server;

  t.after(async () => {
    if (server) await closeServer(server);
    await Order.deleteMany({ studentId: student.studentId });
    if (menuItems.length) {
      await MenuItem.deleteMany({ _id: { $in: menuItems.map((item) => item._id) } });
    }
    await mongoose.disconnect();
  });

  menuItems.push(...await MenuItem.create([
    {
      name: `Integrity Test Wrap ${suffix}`,
      price: 12.35,
      available: true,
      stock: 20
    },
    {
      name: `Integrity Test Juice ${suffix}`,
      price: 4.5,
      available: true,
      stock: 20
    }
  ]));

  const endpoint = await createServer();
  server = endpoint.server;
  const studentToken = createToken(student);
  const inputItems = [
    { productId: menuItems[0]._id.toString(), quantity: 2 },
    { productId: menuItems[1]._id.toString(), quantity: 3 }
  ];

  const createOrder = async () => {
    const response = await request(endpoint.url, studentToken, "POST", {
      studentId: "UNTRUSTED-CLIENT-VALUE",
      totalAmount: 0.01,
      items: inputItems
    });
    const result = await response.json();
    assert.equal(response.status, 201, JSON.stringify(result));
    createdOrderIds.push(result.order.id);
    return result.order.id;
  };

  const firstOrderId = await createOrder();
  const firstStoredOrder = await Order.findById(firstOrderId).lean();
  const expectedItems = [
    {
      productId: menuItems[0]._id.toString(),
      name: menuItems[0].name,
      quantity: 2,
      unitPrice: 12.35,
      subtotal: 24.7
    },
    {
      productId: menuItems[1]._id.toString(),
      name: menuItems[1].name,
      quantity: 3,
      unitPrice: 4.5,
      subtotal: 13.5
    }
  ];
  assert.deepEqual(snapshot(firstStoredOrder), {
    studentId: student.studentId,
    studentEmail: student.email,
    items: expectedItems,
    totalAmount: 38.2
  });

  const ownerRead = await request(
    `${endpoint.url}/${firstOrderId}`,
    studentToken
  );
  assert.equal(ownerRead.status, 200);
  const otherStudentRead = await request(
    `${endpoint.url}/${firstOrderId}`,
    createToken(otherStudent)
  );
  assert.equal(otherStudentRead.status, 404);

  const firstSnapshot = snapshot(firstStoredOrder);
  const completedOrderId = await createOrder();
  const staffToken = createToken(
    { id: new mongoose.Types.ObjectId().toString() },
    "staff",
    "staff"
  );
  const statusResponse = await request(
    `${endpoint.url}/${completedOrderId}/status`,
    staffToken,
    "PATCH",
    { status: "Completed" }
  );
  assert.equal(statusResponse.status, 200);
  const completedOrder = await Order.findById(completedOrderId).lean();
  assert.equal(completedOrder.status, "Completed");
  assert.deepEqual(snapshot(completedOrder), firstSnapshot);

  const cancelResponse = await request(
    `${endpoint.url}/${firstOrderId}/cancel`,
    studentToken,
    "PATCH"
  );
  assert.equal(cancelResponse.status, 200);
  const cancelledOrder = await Order.findById(firstOrderId).lean();
  assert.equal(cancelledOrder.status, "Cancelled");
  assert.deepEqual(snapshot(cancelledOrder), firstSnapshot);

  console.log(JSON.stringify({
    testStudentId: student.studentId,
    productIds: menuItems.map((item) => item._id.toString()),
    orderIds: createdOrderIds,
    expectedSubtotalTotal: 38.2,
    persistedTotalAmount: cancelledOrder.totalAmount,
    statusAfterCancellation: cancelledOrder.status
  }));
});
