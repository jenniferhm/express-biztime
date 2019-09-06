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
  await db.query("DELETE FROM invoices");
});

afterAll(async function () {
  await db.end();
});

describe("GET /invoices", function () {
  test("Get a list of all invoices", async function () {
    const response = await request(app).get(`/invoices`);
    console.log("THIS IS THE BODY: ", response.body);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ invoices: [invoice1, invoice2, invoice3, invoice4]});
  });
});