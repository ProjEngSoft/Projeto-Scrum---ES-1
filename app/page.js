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
    <main className="pagina-login">
      <section className="painel-apresentacao">
        <Link href="/" className="marca">
          <span className="marca-icone" aria-hidden="true">
            +
          </span>
          Conserta Aqui
        </Link>

        <div className="apresentacao-conteudo">
          <span className="etiqueta">SERVIÇOS PERTO DE VOCÊ</span>

          <h1>
            Encontrar quem
            <br />
            resolve ficou <span>mais fácil.</span>
          </h1>

          <p className="texto-apresentacao">
            Precisa de um serviço? Encontre profissionais da sua cidade e
            conecte-se com quem pode ajudar.
          </p>

          <div className="cartao-destaque">
            <div className="avatar-profissional" aria-hidden="true">
              M
            </div>
            <div>
              <strong>Uma solução pode estar perto</strong>
              <p>Entre e descubra profissionais disponíveis.</p>
            </div>
            <span className="sinal-online" aria-label="Disponível" />
          </div>
        </div>

        <p className="rodape-apresentacao">
          Conectando pessoas a bons serviços.
        </p>
      </section>

      <section className="painel-formulario">
        <div className="formulario-conteudo">
          <span className="boas-vindas">BEM-VINDO DE VOLTA</span>
          <h2>Acesse sua conta</h2>
          <p className="subtitulo-login">
            Entre para encontrar ou oferecer serviços.
          </p>

          <form onSubmit={logar} className="formulario-login">
            <div className="campo-login">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="campo-login">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </div>

            {erro && (
              <p className="mensagem-erro" role="alert">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="botao-entrar"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar na conta"}
              {!carregando && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="texto-cadastro">
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro">Cadastre-se grátis</Link>
          </p>
            <p>
                Não tem uma conta? <Link href="/cadastrar">Cadastre-se</Link>
            </p>
        </div>

        <p className="nota-privacidade">
          Sua próxima solução pode começar por aqui.
        </p>
      </section>
    </main>
  );
}
