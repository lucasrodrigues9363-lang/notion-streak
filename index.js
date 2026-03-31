const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.DATABASE_ID;

function diffDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
}

async function run() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    page_size: 100,
  });

  const items = response.results;

  const grouped = {};

  for (let item of items) {
    const cliente =
      item.properties.Cliente.relation[0]?.id || "sem_cliente";

    const data = item.properties.Data.date?.start;

    const valida =
      item.properties["Prática válida"].formula?.boolean;

    if (!data || !valida) continue;

    if (!grouped[cliente]) grouped[cliente] = [];

    grouped[cliente].push({
      id: item.id,
      data,
    });
  }

  for (let cliente in grouped) {
    const lista = grouped[cliente].sort(
      (a, b) => new Date(a.data) - new Date(b.data)
    );

    let streak = 1;

    for (let i = 0; i < lista.length; i++) {
      if (i > 0) {
        const diff = diffDays(lista[i].data, lista[i - 1].data);

        if (diff === 1) {
          streak += 1;
        } else {
          streak = 1;
        }
      }

      await notion.pages.update({
        page_id: lista[i].id,
        properties: {
          Streak: {
            number: streak,
          },
        },
      });
    }
  }

  console.log("Streak atualizado com sucesso 🚀");
}

run();
