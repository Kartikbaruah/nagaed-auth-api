const prisma = require('../config/db');

// Find a user by email
function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// Find a user by username
function findByUsername(username) {
  return prisma.user.findUnique({
    where: { username },
  });
}

// Find a user by ID
function findById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

// Create a new user
function create({ username, email, passwordHash, address }) {
  return prisma.user.create({
    data: {
      username,
      email,
      password: passwordHash,
      address,
    },
  });
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
};