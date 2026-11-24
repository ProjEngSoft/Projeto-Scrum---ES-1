"use client";

import "./login.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validarLogin } from "./actions/usuarioActions";

export default function TelaLogin() {
  const rota = useRouter();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function logar(acao) {
    acao.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const dados = new FormData(acao.currentTarget);
      const validacao = await validarLogin(dados);

      if (validacao?.ok) {
        rota.push("/home");
        rota.refresh();
      } else {
        setErro(validacao?.erro || "Login inválido!");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container-login">
      <form onSubmit={logar} className="formulario-login">
        <label htmlFor="email">E-mail:</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="senha">Senha:</label>
        <input id="senha" name="senha" type="password" required />

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao-entrar" disabled={carregando}>
          {carregando ? "Entrando..." : "Login"}
        </button>
      </form>

      <p>
        Não tem uma conta? <Link href="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
}
