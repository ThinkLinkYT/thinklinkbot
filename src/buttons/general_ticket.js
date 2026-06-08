const { createTicket } = require("../utils/tickets");

module.exports = {
  id: "general_ticket",
  async execute(i) {
    await createTicket(i, "general", "Support Ticket", "Support will be with you soon!");
  }
};
