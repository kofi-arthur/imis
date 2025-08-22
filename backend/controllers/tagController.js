import { optramisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";

// Fetch all tags
export const fetchTags = async (req, res) => {
  const query = `SELECT * FROM tags;`;
  try {
    const [tags] = await optramisDB.query(query);
    return res.status(200).json({ tags });
  } catch (err) {
    console.error("Error fetching tags:", err);
    return res.status(500).json({ error: defError });
  }
};

// Add a new tag
export const addTag = async (req, res) => {
  const tag = req.body;
  const query = `INSERT INTO tags SET ?;`;
  try {
    const [result] = await optramisDB.query(query, [tag]);
    return res
      .status(201)
      .json({ message: "Tag added successfully", tagId: result.insertId });
  } catch (err) {
    console.error("Error adding tag:", err);
    return res.status(500).json({ error: defError });
  }
};

// Update an existing tag
export const updateTag = async (req, res) => {
  const tag = req.body;
  const query = `UPDATE tags SET name = ?, color = ? WHERE id = ?;`;
  try {
    const [result] = await optramisDB.query(query, [tag.name, tag.color, tag.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tag not found" });
    }
    return res.status(200).json({ message: "Tag updated successfully" });
  } catch (err) {
    console.error("Error updating tag:", err);
    return res.status(500).json({ error: defError });
  }
};

// Delete a tag by ID
export const deleteTag = async (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM tags WHERE id = ?;`;
  try {
    const [result] = await optramisDB.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tag not found" });
    }
    return res.status(200).json({ message: "Tag deleted successfully" });
  } catch (err) {
    console.error("Error deleting tag:", err);
    return res.status(500).json({ error: defError });
  }
};
