"use client";

import "./login.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validarLogin } from "../actions/usuarioActions";

export default function TelaLogin() {

    const rota = useRouter();

    async function logar(acao) {

        acao.preventDefault()

        const dados = new FormData(acao.currentTarget);
        const validacao = await validarLogin(dados)

        if (validacao === true) {

            rota.push("/home");

        } else {
            
            alert("Login inválido!");

        }

    }

    return(
        <div className="container-login">

            <form onSubmit={logar} className="formulario-login">

                <label htmlFor="email">E-mail:</label>
                <input
                id="email"
                name="email"
                type="email"
                required
                />

                <label htmlFor="senha">Senha:</label>
                <input
                id="senha"
                name="senha"
                type="password"
                required
                />

                <button type="submit" className="botao-entrar">
                    Login
                </button>
            </form>

            <p>
                Não tem uma conta? <Link href="/cadastro">Cadastre-se</Link>
            </p>
        </div>

    );

}