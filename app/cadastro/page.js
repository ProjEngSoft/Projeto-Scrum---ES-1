"use client";

import "./cadastro.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cadastrarUsuario } from "../actions/usuarioActions";

export default function TelaCadastro() {
  const rota = useRouter();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function registrar(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const dados = new FormData(evento.currentTarget);
      const resultado = await cadastrarUsuario(dados);

      if (resultado?.ok) {
        rota.push("/home");
        rota.refresh();
      } else {
        setErro(resultado?.erro || "Não foi possível realizar o cadastro.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="pagina-cadastro">
        <div className="container-login">

          <h1>Criar conta</h1>
          <form onSubmit={registrar} className="formulario-login">
            <label htmlFor="nome">Nome:</label>
            <input id="nome" name="nome" type="text" minLength={3} required />

            <label htmlFor="email">E-mail:</label>
            <input id="email" name="email" type="email" required />

            <label htmlFor="telefone">Telefone (opcional):</label>
            <input id="telefone" name="telefone" type="tel" />

            <label htmlFor="senha">Senha (mínimo 8 caracteres):</label>
            <input id="senha" name="senha" type="password" minLength={8} required />

            {erro && (
              <p className="mensagem-erro" role="alert">
                {erro}
              </p>
            )}

            <button type="submit" className="botao-entrar" disabled={carregando}>
              {carregando ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          <p>
            Já possui conta? <Link href="/">Fazer login</Link>
          </p>
      </div>
    </main>
    
  );
}
