const { MODERATOR_ROLE_ID, createTicket } = require("../utils/tickets");

module.exports = {
  id: "collab_ticket",
  async execute(i) {
    await createTicket(
      i,
      "collab",
      "Collab Request Ticket",
      `<@&${MODERATOR_ROLE_ID}> will be able to help you soon!`
    );
  }
};
