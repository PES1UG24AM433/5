const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

process.env.JWT_SECRET = "test-secret-for-order-idempotency-tests";

const jwt = require("jsonwebtoken");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const orderRoutes = require("../routes/orderRoutes");

const student = {
  id: "507f1f77bcf86cd799439011",
  studentId: "TEST001",
  name: "Test Student",
  email: "student@example.com"
};
const productId = "507f1f77bcf86cd799439012";
const idempotencyKey = "checkout-request-1";

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

async function submitOrder(url) {
  const token = jwt.sign(
    { ...student, accountType: "student" },
    process.env.JWT_SECRET
  );
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      items: [{ productId, quantity: 1 }]
    })
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

test("order idempotency index is unique per student and excludes missing keys", () => {
  const index = Order.schema.indexes().find(([fields]) =>
    fields.studentId === 1 && fields.idempotencyKey === 1
  );

  assert.ok(index);
  assert.deepEqual(index[1], {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } }
  });
});

test("repeating an order request returns the existing order without recreating it", async (t) => {
  const originalFindOne = Order.findOne;
  const originalCreate = Order.create;
  const originalFindById = MenuItem.findById;
  const orders = new Map();
  let createCount = 0;
  let menuLookupCount = 0;

  t.after(() => {
    Order.findOne = originalFindOne;
    Order.create = originalCreate;
    MenuItem.findById = originalFindById;
  });

  Order.findOne = async ({ studentId, idempotencyKey: key }) =>
    orders.get(`${studentId}:${key}`) || null;
  Order.create = async (data) => {
    createCount += 1;
    const order = {
      _id: "507f1f77bcf86cd799439013",
      ...data,
      orderTime: new Date(),
      status: "Placed",
      paymentStatus: "Pending"
    };
    orders.set(`${data.studentId}:${data.idempotencyKey}`, order);
    return order;
  };
  MenuItem.findById = async () => {
    menuLookupCount += 1;
    return {
      _id: productId,
      name: "Test item",
      price: 5,
      stock: 5,
      available: true
    };
  };

  const { server, url } = await createServer();
  t.after(() => closeServer(server));

  const firstResponse = await submitOrder(url);
  const firstResult = await firstResponse.json();
  const retryResponse = await submitOrder(url);
  const retryResult = await retryResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(retryResponse.status, 200);
  assert.equal(firstResult.order.id, retryResult.order.id);
  assert.equal(retryResult.message, "This order was already placed.");
  assert.equal(createCount, 1);
  assert.equal(orders.size, 1);
  assert.equal(menuLookupCount, 1);
});

test("simultaneous submissions with the same key create one order", async (t) => {
  const originalFindOne = Order.findOne;
  const originalCreate = Order.create;
  const originalFindById = MenuItem.findById;
  const orders = new Map();
  let createAttempts = 0;
  let releaseCreates;
  const bothCreating = new Promise((resolve) => {
    releaseCreates = resolve;
  });

  t.after(() => {
    Order.findOne = originalFindOne;
    Order.create = originalCreate;
    MenuItem.findById = originalFindById;
  });

  Order.findOne = async ({ studentId, idempotencyKey: key }) =>
    orders.get(`${studentId}:${key}`) || null;
  Order.create = async (data) => {
    createAttempts += 1;
    if (createAttempts === 2) releaseCreates();
    await bothCreating;

    const key = `${data.studentId}:${data.idempotencyKey}`;
    if (orders.has(key)) {
      const error = new Error("Duplicate idempotency key");
      error.code = 11000;
      throw error;
    }

    const order = {
      _id: "507f1f77bcf86cd799439014",
      ...data,
      orderTime: new Date(),
      status: "Placed",
      paymentStatus: "Pending"
    };
    orders.set(key, order);
    return order;
  };
  MenuItem.findById = async () => ({
    _id: productId,
    name: "Test item",
    price: 5,
    stock: 5,
    available: true
  });

  const { server, url } = await createServer();
  t.after(() => closeServer(server));

  const responses = await Promise.all([submitOrder(url), submitOrder(url)]);
  const results = await Promise.all(responses.map((response) => response.json()));

  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 201]
  );
  assert.equal(results[0].order.id, results[1].order.id);
  assert.equal(createAttempts, 2);
  assert.equal(orders.size, 1);
});
