const { createTicket } = require("../utils/tickets");

module.exports = {
  id: "collab_ticket",
  async execute(i) {
    await createTicket(
      i,
      "collab",
      "Collab Request Ticket",
      "<@&1265101131353428049> will be able to help you soon!"
    );
  }
};
