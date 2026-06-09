const { installInteractionPanelReplies } = require("../utils/panels");
const { canManageTickets, isOwner } = require("../utils/staff");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    installInteractionPanelReplies(interaction);

    async function replyWithError(error) {
      console.error("Interaction error:", error);

      const payload = {
        content: "Something went wrong while handling that interaction.",
        ephemeral: true
      };

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (replyErr) {
        console.error("Failed to send interaction error response:", replyErr);
      }
    }

    // Slash commands
    if (interaction.isChatInputCommand()) {
      const ownerOnly = [
        "countingstart",
        "countingend",
        "ticketpanel",
        "giveawaycreate",
        "accept",
        "deny"
      ];
      const ticketStaffCommands = [
        "closeticket",
        "timeclose",
        "modapp",
        "collabapp"
      ];

      if (
        ownerOnly.includes(interaction.commandName) &&
        !isOwner(interaction)
      ) {
        return interaction.reply({
          content: "You are not authorized to use this command.",
          ephemeral: true
        });
      }

      if (
        ticketStaffCommands.includes(interaction.commandName) &&
        !canManageTickets(interaction)
      ) {
        return interaction.reply({
          content: "You are not authorized to use this command.",
          ephemeral: true
        });
      }

      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) {
        return interaction.reply({
          content: "That command is not loaded right now.",
          ephemeral: true
        });
      }

      try {
        await cmd.execute(interaction, client);
      } catch (err) {
        await replyWithError(err);
      }
      return;
    }

    // Autocomplete
    if (interaction.isAutocomplete()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd || !cmd.autocomplete) return;

      try {
        await cmd.autocomplete(interaction, client);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
      return;
    }

    // Buttons
    if (interaction.isButton()) {
      const id = interaction.customId;
      let btn = null;

      // ⭐ FIXED: Leaderboard pagination
      if (id.startsWith("leaderboard_")) {
        btn = client.buttons.get("leaderboard_pager");
      }

      // Mod / collab application navigation
      else if (id.startsWith("modapp_")) {
        btn = client.buttons.get("modapp_nav");
      }

      else if (id.startsWith("collabapp_")) {
        btn = client.buttons.get("collabapp_nav");
      }

      // Ban/Kick verification buttons
      else if (id.startsWith("verify_")) {
        btn = client.buttons.get("verify");
      }

      // Blackjack buttons
      else if (id.startsWith("bj_")) {
        btn = client.buttons.get("bj_");
      }

      // Role members pagination
      else if (id.startsWith("rolemembers_")) {
        btn = client.buttons.get("rolemembers_");
      }

      // Default button handler
      else {
        btn = client.buttons.get(id);
      }

      if (!btn) {
        return interaction.reply({
          content: "That button handler is not loaded right now.",
          ephemeral: true
        });
      }

      try {
        await btn.execute(interaction, client);
      } catch (err) {
        await replyWithError(err);
      }
    }
  }
};
