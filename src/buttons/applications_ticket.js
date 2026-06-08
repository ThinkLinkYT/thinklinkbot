const { MODERATOR_ROLE_ID, createTicket } = require("../utils/tickets");

module.exports = {
  id: "applications_ticket",
  async execute(i) {
    await createTicket(
      i,
      "applications",
      "Applications Ticket",
      `<@&${MODERATOR_ROLE_ID}> will be able to help you soon!\n\n` +
        "**What would you like to apply for?**\n**How old are you?**\n**Are you subscribed to ThinkLink on YouTube?**\n\n" +
        "Please answer these questions below in the ticket and ThinkLink will get back to you!"
    );
  }
};
