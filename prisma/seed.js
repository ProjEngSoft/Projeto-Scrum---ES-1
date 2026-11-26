import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIAS_INICIAIS = [
  {
    nome: "Eletrônicos",
    descricao: "Reparo de celulares, tablets, televisores, áudio e equipamentos eletrônicos.",
    especialidades: [
      "Troca de tela e bateria",
      "Reparo de placas eletrônicas",
      "Manutenção de TVs e monitores",
    ],
  },
  {
    nome: "Eletrodomésticos",
    descricao: "Manutenção de geladeiras, máquinas de lavar, micro-ondas e fogões.",
    especialidades: [
      "Máquina de lavar e lava-louças",
      "Micro-ondas e fornos elétricos",
      "Fogão e cooktop",
    ],
  },
  {
    nome: "Informática",
    descricao: "Conserto de notebooks, computadores desktop, impressoras e periféricos.",
    especialidades: [
      "Manutenção de notebooks",
      "Montagem e reparo de desktops",
      "Manutenção de impressoras",
    ],
  },
  {
    nome: "Móveis",
    descricao: "Restauração, marcenaria, estofamento e montagem de móveis.",
    especialidades: [
      "Marcenaria e reparo em madeira",
      "Estofamento e tapeçaria",
      "Ajuste de ferragens e dobradiças",
    ],
  },
  {
    nome: "Refrigeração",
    descricao: "Instalação e reparo de ar-condicionado, freezers e sistemas de climatização.",
    especialidades: [
      "Ar-condicionado split e janela",
      "Geladeiras e freezers",
    ],
  },
  {
    nome: "Bicicletas e Mobilidade",
    descricao: "Revisão e conserto de bicicletas, patinetes e cadeiras de rodas.",
    especialidades: [
      "Revisão completa de bicicletas",
      "Reparo de patinetes elétricos",
    ],
  },
];

async function main() {
  for (const item of CATEGORIAS_INICIAIS) {
    const categoria = await prisma.categoria.upsert({
      where: { nome: item.nome },
      update: {
        descricao: item.descricao,
        ativa: true,
      },
      create: {
        nome: item.nome,
        descricao: item.descricao,
        ativa: true,
      },
    });

    for (const nomeEsp of item.especialidades) {
      await prisma.especialidade.upsert({
        where: {
          categoriaId_nome: {
            categoriaId: categoria.id,
            nome: nomeEsp,
          },
        },
        update: {
          status: "APROVADA",
        },
        create: {
          categoriaId: categoria.id,
          nome: nomeEsp,
          status: "APROVADA",
        },
      });
    }
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@consertaaqui.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
  const senhaHash = await bcrypt.hash(adminPassword, 10);

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: "Administrador ConsertAí",
      email: adminEmail,
      senhaHash,
      perfil: "ADMIN",
      status: "ATIVO",
    },
  });

  console.log("Seed concluído: categorias, especialidades e administrador verificados.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
