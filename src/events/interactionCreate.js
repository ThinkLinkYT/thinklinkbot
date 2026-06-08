module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
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
        "closeticket",
        "timeclose",
        "modapp",
        "collabapp",
        "giveawaycreate",
        "accept",
        "deny"
      ];

      if (
        ownerOnly.includes(interaction.commandName) &&
        interaction.user.id !== process.env.OWNER_ID
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

      // Wrapped pagination
      if (id.startsWith("wrapped_")) {
        btn = client.buttons.get("wrapped_pager");
      }

      // ⭐ FIXED: Leaderboard pagination
      else if (id.startsWith("leaderboard_")) {
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
