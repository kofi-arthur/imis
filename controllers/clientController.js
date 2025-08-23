import { userDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { getClientInfo, logSystem } from "../utils/helpers.js";

export const fetchClients = async (req, res) => {
  const query = "SELECT * FROM clients ORDER BY dateCreated DESC";
  try {
    const [info] = await userDB.query(query);
    const clients = info;
    return res.json({ clients });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const addClient = async (req, res) => {
  const client  = JSON.parse(req.body.clientData);
  const avatar = req.file;
  const actor = req.user;

  if (avatar) {
    client.avatar = avatar.filename;
  }
  
  const query = "INSERT INTO clients SET ?";
  try {
    await userDB.query(query, [client]);

    logSystem({
      details: `Added a client, ${client.name}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Client added successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const updateClient = async (req, res) => {
  const { client } = req.body;
  const actor = req.user;
  const query = "UPDATE clients SET ? WHERE id = ?";
  try {
    await userDB.query(query, [client, client.id]);

    logSystem({
      details: `edited client ${client.name} information `,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Client updated successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const deleteClient = async (req, res) => {
  const id = req.params.id;
  const actor = req.user;
  const query = "DELETE FROM clients WHERE id = ?";
  try {
    await userDB.query(query, [id]);
    const client = await getClientInfo(id);
    logSystem({
      details: `deleted a client, ${client.name}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};
