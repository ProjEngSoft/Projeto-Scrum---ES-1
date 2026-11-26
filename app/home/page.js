import "../login.css";
import { redirect } from "next/navigation";
import { obterUsuarioSessao } from "../../lib/auth.js";
import { encerrarSessaoAction } from "../actions/usuarioActions";

export default async function TelaHome() {
  const usuario = await obterUsuarioSessao();

  if (!usuario) {
    redirect("/");
  }

  return (
    <div className="container-home">
      <h1>Bem-vindo(a), {usuario.nome}!</h1>
      <p>Você está logado(a) com o e-mail {usuario.email} ({usuario.perfil}).</p>

      <form action={encerrarSessaoAction}>
        <button type="submit" className="botao-sair">
          Sair
        </button>
      </form>
    </div>
  );
}
