import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { logSystem } from "../utils/helpers.js";

export const fetchCategories = async (req, res) => {
  const query =
    "SELECT categoryName FROM projectcategories ORDER BY dateAdded DESC";
  try {
    const [info] = await imisDB.query(query);
    const categories = info;
    return res.json({ categories });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const addCategory = async (req, res) => {
  const { category } = req.body;
  const actor = req.user;
  const query = "INSERT INTO projectcategories SET categoryName = ?";
  try {
    await imisDB.query(query, category);

    logSystem({
      details: `Added a category, ${category}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Category added successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const updateCategory = async (req, res) => {
  const { category } = req.body;
  const actor = req.user;
  const query = "UPDATE projectcategories SET categoryName = ? WHERE id = ?";
  try {
    await imisDB.query(query, [category.categoryName, category.id]);

    logSystem({
      details: `edited a category, ${category.categoryName}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Category updated successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const deleteCategory = async (req, res) => {
  const { category } = req.body;
  const actor = req.user;
  const query = "DELETE FROM projectcategories WHERE id = ?";
  try {
    await imisDB.query(query, category.id);

    logSystem({
      details: `deleted a category, ${category.categoryName}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};
