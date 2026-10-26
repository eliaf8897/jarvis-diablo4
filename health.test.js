const test = require("node:test");
const assert = require("node:assert/strict");
const { extractPlannerIds } = require("../src/services/maxroll");

test("extractPlannerIds finds public Maxroll planner IDs", () => {
  const html = '<a href="/d4/planner/abc12345">Planner</a><a href="https://maxroll.gg/d4/planner/xyz98765">Other</a>';
  assert.deepEqual(extractPlannerIds(html).sort(), ["abc12345", "xyz98765"]);
});
