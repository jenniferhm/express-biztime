const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/", async function (req, res, next) {
  try {
    let result = await db.query(
      `SELECT code, name FROM companies`);
    return res.json({ companies: result.rows });
  }
  catch (err) {
    return next(err);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    let result = await db.query(
      `SELECT c.code, c.name, c.description, i.id
      FROM companies AS c
      INNER JOIN invoices AS i
      ON c.code = i.comp_code
      WHERE code=$1`, [req.params.code]);

    if (result.rows.length === 0) {
      throw new ExpressError("Company could not be found", 404);
    }

    let { code, name, description } = result.rows[0];
    let invoices = result.rows.map(r => r.id);

    return res.json({ company: { code, name, description, invoices } });
  }
  catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    let { code, name, description } = req.body;

    let result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  }
  catch (err) {
    if (err.code === "23505") {
      err = new ExpressError("Bad Request - this company already exists", 400);
    }
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    let { name, description } = req.body;

    let result = await db.query(
      `UPDATE companies SET name=$1, description=$2
      WHERE code=$3
      RETURNING code, name, description`,
      [name, description, req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Item not found", 404);
    }

    return res.json({ company: result.rows[0] });
  }
  catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    let result = await db.query(
      `DELETE FROM companies WHERE code=$1`,
      [req.params.code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("That company does not exist!", 404);
    }

    return res.json({ message: "Deleted" });
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;