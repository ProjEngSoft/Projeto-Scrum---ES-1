import "./home.css";
import { redirect } from "next/navigation";
import { obterUsuarioSessao } from "../../lib/auth.js";
import { obterDadosConta } from "../../lib/services/usuarioService.js";
import HomeClient from "./HomeClient";

export const metadata = {
  title: "Minha Conta | Conserta Aqui",
  description: "Visualize e gerencie os dados da sua conta no Conserta Aqui.",
};

export default async function TelaHome() {
  const sessao = await obterUsuarioSessao();

  if (!sessao) {
    redirect("/");
  }

  const dadosConta = await obterDadosConta(sessao.id);

  if (!dadosConta) {
    redirect("/");
  }

  const dadosSerializados = {
    ...dadosConta,
    criadoEm: dadosConta.criadoEm.toISOString(),
    atualizadoEm: dadosConta.atualizadoEm.toISOString(),
  };

  return <HomeClient usuarioInicial={dadosSerializados} />;
}
