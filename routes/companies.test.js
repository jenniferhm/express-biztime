process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany1;
let testCompany2;
let invoice1;
let invoice2;
let invoice3;
let invoice4;

beforeEach(async function () {
  let resultCompanies = await db.query(
    `INSERT INTO companies
    VALUES ('google', 'Google', 'Search God.'), ('facebook', 'Facebook', 'CEO is Mark Zukerberg')
    RETURNING code, name, description`
  );

  let resultInvoices = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('google', 100, false, null), ('google', 200, true, '2019-08-07'), ('facebook', 300, true, '2018-12-12'), ('facebook', 400, false, null)
    RETURNING id, amt, paid, add_date, paid_date`
  );

  testCompany1 = resultCompanies.rows[0];
  testCompany2 = resultCompanies.rows[1];

  invoice1 = resultInvoices.rows[0];
  invoice2 = resultInvoices.rows[1];
  invoice3 = resultInvoices.rows[2];
  invoice4 = resultInvoices.rows[3];
});

afterEach(async function () {
  await db.query("DELETE FROM companies");
});

afterAll(async function () {
  await db.end();
});

describe("GET /companies", function () {
  test("Get a list of all companies", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [{ code: testCompany1.code, name: testCompany1.name },
      { code: testCompany2.code, name: testCompany2.name }]
    });
  });
});

describe("GET /companies/[code]", function () {
  test("Get a single company", async function () {
    const response = await request(app).get(`/companies/${testCompany1.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany1.code,
        name: testCompany1.name,
        description: testCompany1.description,
        invoices: [invoice1.id, invoice2.id]
      }
    });
  });
});

describe("POST /companies", function () {
  test("Adding a company", async function () {
    const response = await request(app).post(`/companies`)
      .send({
        code: "instagram",
        name: "Instagram",
        description: "IG is better than Snap!"
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {
        code: "instagram",
        name: "Instagram",
        description: "IG is better than Snap!"
      }
    });
  });
});