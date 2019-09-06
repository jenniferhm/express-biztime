const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/", async function (req, res, next) {
  try {
    let result = await db.query(
      `SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: result.rows });
  }
  catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await db.query(
      `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description
      FROM invoices AS i
      INNER JOIN companies AS c
      ON i.comp_code = c.code
      WHERE id=$1`, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ExpressError("Item not found", 404);
    }

    let { id, amt, paid, add_date, paid_date, code, name, description } = result.rows[0];
    let company = { code, name, description };

    return res.json({ invoice: { id, amt, paid, add_date, paid_date, company } });
  }
  catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    let { comp_code, amt } = req.body;
    let checkCompCode = await db.query(
      `SELECT code FROM companies WHERE code=$1`, [comp_code]
    );

    if (checkCompCode.rows.length === 0) {
      throw new ExpressError("This company does not exist!", 404);
    }

    let result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  }
  catch (err) {
    return next(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let result = await db.query(
      `UPDATE invoices SET amt=$1
      WHERE id=$2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.amt, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("That invoice does not exist!", 404);
    }

    return res.json({ invoice: result.rows[0] });
  }
  catch (err) {
    return next(err);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let result = await db.query(
      `DELETE FROM invoices WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("That invoice does not exist!", 404);
    }

    return res.json({ status: "deleted" });
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;