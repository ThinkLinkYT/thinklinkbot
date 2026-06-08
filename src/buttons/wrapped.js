const { getUserStats } = require("../utils/wrapped");
const { buildWrappedEmbed, buildWrappedRow } = require("../commands/wrapped");

async function paginateWrapped(i, direction, currentPage) {
  let pageIndex = currentPage;
  if (direction === "prev" && pageIndex > 0) pageIndex--;
  if (direction === "next" && pageIndex < 3) pageIndex++;

  const stats = getUserStats(i.user.id);
  const embed = buildWrappedEmbed(stats, i.member, pageIndex);
  const row = buildWrappedRow(pageIndex);

  await i.update({ embeds: [embed], components: [row] });
}

module.exports = {
  id: "wrapped_pager",
  async execute(i) {
    const [_, dir, idx] = i.customId.split("_");
    await paginateWrapped(i, dir, parseInt(idx));
  }
};
