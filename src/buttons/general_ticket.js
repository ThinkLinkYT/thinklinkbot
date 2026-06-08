const { MODERATOR_ROLE_ID, createTicket } = require("../utils/tickets");

module.exports = {
  id: "general_ticket",
  async execute(i) {
    await createTicket(
      i,
      "general",
      "Support Ticket",
      `<@&${MODERATOR_ROLE_ID}> will be with you soon!`
    );
  }
};
