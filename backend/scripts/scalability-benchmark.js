const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const { performance } = require("node:perf_hooks");
const path = require("node:path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

const mongoUri = process.env.CPS_TEST_MONGODB_URI;
const allowedDatabase = "canteen_preorder_test";
const backendDirectory = path.resolve(__dirname, "..");
const menuBaselineCount = 3;
const menuLargeCount = 1000;
const ordersBaselineCount = 50;
const ordersLargeCount = 5000;
const requestCount = 30;
const menuConcurrency = 5;
const ordersConcurrency = 5;
const warmupRequestCount = 5;
const perfStudentId = `PERF-TEST-${Date.now()}`;
const perfStudentName = "Synthetic Scalability Test Student";
const perfStudentEmail = `${perfStudentId.toLowerCase()}@example.invalid`;

function assertSafeTestUri(uri) {
  assert.ok(uri, "Set CPS_TEST_MONGODB_URI to run this benchmark.");
  const parsedUri = new URL(uri);
  assert.ok(
    parsedUri.protocol === "mongodb:" || parsedUri.protocol === "mongodb+srv:",
    "Test MongoDB URI must use the MongoDB protocol."
  );
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsedUri.hostname),
    "Scalability benchmark may only use a local MongoDB server."
  );
  assert.equal(
    parsedUri.pathname.slice(1).split("/")[0],
    allowedDatabase,
    `Scalability benchmark may only write to ${allowedDatabase}.`
  );
}

function percentile(samples, value) {
  return samples[Math.max(0, Math.ceil(samples.length * value) - 1)];
}

async function consumeResponse(response) {
  let bytes = 0;
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
    }
  }
  return bytes;
}

async function measureEndpoint(url, token, concurrency) {
  const latencies = [];
  let failures = 0;
  let bytes = 0;
  let nextRequest = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const requestNumber = nextRequest++;
      if (requestNumber >= requestCount) return;

      const start = performance.now();
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        bytes += await consumeResponse(response);
        latencies.push(performance.now() - start);
        if (!response.ok) failures += 1;
      } catch {
        latencies.push(performance.now() - start);
        failures += 1;
      }
    }
  });

  const startedAt = performance.now();
  await Promise.all(workers);
  const durationMs = performance.now() - startedAt;
  latencies.sort((left, right) => left - right);

  return {
    requests: requestCount,
    concurrency,
    failures,
    durationMs: Number(durationMs.toFixed(2)),
    requestsPerSecond: Number((requestCount * 1000 / durationMs).toFixed(2)),
    latencyMs: {
      median: Number(percentile(latencies, 0.5).toFixed(2)),
      p90: Number(percentile(latencies, 0.9).toFixed(2)),
      p99: Number(percentile(latencies, 0.99).toFixed(2)),
      max: Number(latencies.at(-1).toFixed(2))
    },
    averageResponseBytes: Math.round(bytes / requestCount)
  };
}

async function warmupEndpoint(url, token) {
  for (let requestNumber = 0; requestNumber < warmupRequestCount; requestNumber += 1) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await consumeResponse(response);
    assert.equal(response.status, 200, `Warm-up failed for ${url}.`);
  }
}

async function waitForServer(child, url, stderr) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Backend exited before becoming ready: ${stderr()}`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Backend did not become ready: ${stderr()}`);
}

function readResidentMemory(pid) {
  try {
    const status = require("node:fs").readFileSync(`/proc/${pid}/status`, "utf8");
    const match = status.match(/^VmRSS:\s+(\d+)\s+kB$/m);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function collectExecutionStats(explanation) {
  const stats = explanation.executionStats;
  const stages = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.stage) stages.push(node.stage);
    for (const [key, value] of Object.entries(node)) {
      if (key === "inputStage") visit(value);
      if (key === "inputStages" && Array.isArray(value)) value.forEach(visit);
      if (key === "shards" && value && typeof value === "object") {
        Object.values(value).forEach((shard) => visit(shard.winningPlan));
      }
    }
  };
  visit(explanation.queryPlanner.winningPlan);
  return {
    executionTimeMs: stats.executionTimeMillis,
    docsExamined: stats.totalDocsExamined,
    keysExamined: stats.totalKeysExamined,
    winningPlanStages: [...new Set(stages)]
  };
}

async function seedMenuItems(count, existingItems = []) {
  const remainingCount = count - existingItems.length;
  if (remainingCount <= 0) return existingItems;

  const items = Array.from({ length: remainingCount }, (_, index) => {
    const sequence = existingItems.length + index;
    return {
      name: `Perf Test Menu ${String(sequence).padStart(4, "0")}`,
      price: 1 + sequence % 20,
      foodType: sequence % 2 === 0 ? "Veg" : "Non-Veg",
      available: true,
      stock: 100
    };
  });
  const created = await MenuItem.insertMany(items, { ordered: true });
  return [...existingItems, ...created];
}

async function seedOrders(count, menuItems, offset = 0) {
  for (let start = offset; start < count; start += 500) {
    const end = Math.min(start + 500, count);
    const orders = Array.from({ length: end - start }, (_, localIndex) => {
      const sequence = start + localIndex;
      const menuItem = menuItems[sequence % menuItems.length];
      const quantity = sequence % 3 + 1;
      const subtotal = menuItem.price * quantity;
      return {
        studentId: perfStudentId,
        studentName: perfStudentName,
        studentEmail: perfStudentEmail,
        items: [{
          productId: menuItem._id,
          name: menuItem.name,
          quantity,
          unitPrice: menuItem.price,
          subtotal
        }],
        totalAmount: subtotal,
        orderTime: new Date(Date.now() - sequence * 1000),
        status: "Placed",
        paymentStatus: "Pending"
      };
    });
    await Order.insertMany(orders, { ordered: true });
  }
}

async function measureStage(stageName, menuCount, orderCount, baseUrl, token, child) {
  await Promise.all([
    warmupEndpoint(`${baseUrl}/api/menu`, token),
    warmupEndpoint(`${baseUrl}/api/orders`, token)
  ]);
  const menuResult = await measureEndpoint(
    `${baseUrl}/api/menu`,
    token,
    menuConcurrency
  );
  const ordersResult = await measureEndpoint(
    `${baseUrl}/api/orders`,
    token,
    ordersConcurrency
  );
  const plan = await Order.find({
    studentId: perfStudentId,
    studentEmail: perfStudentEmail
  })
    .select("items totalAmount orderTime status paymentStatus")
    .sort({ orderTime: -1 })
    .explain("executionStats");

  return {
    stage: stageName,
    dataset: { menuItems: menuCount, studentOrders: orderCount },
    menu: menuResult,
    orders: ordersResult,
    orderQuery: collectExecutionStats(plan),
    backendRssMiB: Number((readResidentMemory(child.pid) / 1024).toFixed(2))
  };
}

async function main() {
  assertSafeTestUri(mongoUri);
  process.env.JWT_SECRET ||= `scalability-test-${require("node:crypto").randomUUID()}`;
  await mongoose.connect(mongoUri);

  const existingMenuCount = await MenuItem.countDocuments();
  const existingOrderCount = await Order.countDocuments();
  assert.equal(existingMenuCount, 0, "Test database menuitems collection must be empty.");
  assert.equal(existingOrderCount, 0, "Test database orders collection must be empty.");

  const createdMenuIds = [];
  const backendPort = await new Promise((resolve, reject) => {
    const net = require("node:net").createServer();
    net.once("error", reject);
    net.listen(0, "127.0.0.1", () => {
      const port = net.address().port;
      net.close((error) => error ? reject(error) : resolve(port));
    });
  });
  const baseUrl = `http://127.0.0.1:${backendPort}`;
  const jwtSecret = process.env.JWT_SECRET;
  const token = jwt.sign({
    id: new mongoose.Types.ObjectId().toString(),
    accountType: "student",
    name: perfStudentName,
    studentId: perfStudentId,
    email: perfStudentEmail
  }, jwtSecret);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      JWT_SECRET: jwtSecret,
      PORT: String(backendPort),
      NODE_ENV: "test"
    },
    stdio: ["ignore", "ignore", "pipe"]
  });
  let childStderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { childStderr += chunk; });
  const rssSamples = [];
  const rssSampler = setInterval(() => {
    const rss = readResidentMemory(child.pid);
    if (rss !== null) rssSamples.push(rss);
  }, 100);

  try {
    await waitForServer(child, baseUrl, () => childStderr);
    let menuItems = await seedMenuItems(menuBaselineCount);
    createdMenuIds.push(...menuItems.map((item) => item._id));
    await seedOrders(ordersBaselineCount, menuItems);
    const baseline = await measureStage(
      "baseline",
      menuBaselineCount,
      ordersBaselineCount,
      baseUrl,
      token,
      child
    );

    menuItems = await seedMenuItems(menuLargeCount, menuItems);
    createdMenuIds.push(...menuItems.slice(menuBaselineCount).map((item) => item._id));
    await seedOrders(ordersLargeCount, menuItems, ordersBaselineCount);
    const increased = await measureStage(
      "increased",
      menuLargeCount,
      ordersLargeCount,
      baseUrl,
      token,
      child
    );

    rssSamples.push(readResidentMemory(child.pid));
    const validRssSamples = rssSamples.filter(Number.isFinite);
    console.log(JSON.stringify({
      database: allowedDatabase,
      load: {
        requestsPerEndpointPerStage: requestCount,
        menuConcurrency,
        ordersConcurrency
      },
      baseline,
      increased,
      backendRssMiB: {
        minimumSampled: Number((Math.min(...validRssSamples) / 1024).toFixed(2)),
        maximumSampled: Number((Math.max(...validRssSamples) / 1024).toFixed(2))
      }
    }, null, 2));
  } finally {
    clearInterval(rssSampler);
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(resolve, 3000).unref();
    });
    await Order.deleteMany({ studentId: perfStudentId });
    if (createdMenuIds.length) {
      await MenuItem.deleteMany({ _id: { $in: createdMenuIds } });
    }
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: "scalability_benchmark.failed",
    errorName: typeof error?.name === "string" ? error.name : "Error",
    errorCode: Number.isSafeInteger(error?.code) ||
      (typeof error?.code === "string" && error.code.length <= 100)
      ? error.code
      : undefined
  }));
  process.exitCode = 1;
});
