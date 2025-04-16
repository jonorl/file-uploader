const { timeStamp } = require("console");
const pool = require("./pool");

// Prisma config
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function serialise(email) {
  // const rows = await pool.query("SELECT * FROM users WHERE email = $1", [
  //   email,
  // ]);

  const rows = await prisma.users.findUnique({
    where: {
      email: email,
    },
  });
  return rows;
}

async function deserialise(id) {
  // const rows = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);
  const rows = await prisma.users.findUnique({
    where: {
      user_id: id,
    },
  });
  return rows;
}

async function getAllUsernames() {
  // const { rows } = await pool.query("SELECT * FROM board");
  const rows = await prisma.board.findMany();
  return rows;
}

async function insertMessage(email, title, text) {
  // await pool.query(
  //   "INSERT INTO board (email, title, text) VALUES ($1, $2, $3)",
  //   [email, title, text]
  // );
  await prisma.board.create({
    data: {
      email: email,
      title: title,
      text: text,
    },
  });
}

async function insertNewUser(firstName, lastName, email, password) {
  // const result = await pool.query(
  //   "insert into users (first_name, last_name, email, password_hash) values ($1, $2, $3, $4) RETURNING *",
  //   [firstName, lastName, email, password]
  // );
  const result = await prisma.users.create({
    data: {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: password,
    },
  });
  return result;
}

async function checkExistingEmail(email) {
  // const rows = await pool.query("SELECT * FROM users WHERE email = $1", [
  //   email,
  // ]);
  const rows = await prisma.users.findUnique({
    where: {
      email: email,
    },
  });
  return rows;
}

async function updateRole(email, role) {
  // const update = await pool.query(
  //   "UPDATE users SET role = $2 WHERE email = $1",
  //   [email, role]
  // );
  const update = await prisma.users.update({
    where: {
      email: email,
    },
    data: {
      role: role,
    },
  });
  return update;
}

async function deleteMessage(id) {
  // const del = await pool.query("DELETE FROM board WHERE message_id = $1", [id]);
  const del = await prisma.board.delete({
    where: {
      message_id: parseInt(id),
    },
  });
  return del;
}

async function incrementVisits(id) {
  // const increment = await pool.query(
  //   "UPDATE users SET visits = visits + 1 WHERE user_id = $1",
  //   [id]
  // );
  const increment = await prisma.users.update({
    where: {
      user_id: id,
    },
    data: {
      visits: {
        increment: 1, // Use the atomic 'increment' operation
      },
    },
  });

  return increment;
}

async function updateCreatedAt(email) {
  // const result = await pool.query(
  //   "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE email = $1",
  //   [email]
  // );
  const result = await prisma.users.update({
    where: {
      email: email,
    },
    data: {
      updated_at: new Date(),
    },
  });
  return result;
}

async function insertURL(
  user,
  url,
  publicID,
  resourceType,
  originalName,
  folder,
  metadata
) {
  await prisma.resources.create({
    data: {
      user_id: user,
      url_address: url,
      public_id: publicID,
      resource_type: resourceType,
      original_name: originalName,
      asset_folder: folder,
      metadata: metadata,
    },
  });
}

async function getAllFiles(id) {
  const files = await prisma.resources.findUnique({
    where: {
      user_id: id,
    },
  });
  return files;
}

async function getFileName(publicID) {
  const files = await prisma.resources.findMany({
    where: {
      public_id: publicID,
    },
  });
  console.log("files: ",files[0])
  return files[0];
}

module.exports = {
  serialise,
  deserialise,
  getAllUsernames,
  insertMessage,
  insertNewUser,
  checkExistingEmail,
  updateRole,
  deleteMessage,
  incrementVisits,
  updateCreatedAt,
  insertURL,
  getAllFiles,
  getFileName,
};
