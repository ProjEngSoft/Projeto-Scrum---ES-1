"use client";

export default function cadastroPage(){
    return(
        <main className="container">
            <header className="cabecalho">
                <h1>Criar cadastro</h1>
                <p>Preencha seus dados para continuar...</p>
            </header>

            <section className="opcoes">
                <h2>Qual cadastro deseja realizar?</h2>

                <div type="button">
                    <button>
                        Cliente
                    </button>
                    <button type="button">
                        Funcionario
                    </button>
                </div>
            </section>

            <section className="formulario">
                <h2>Dados do cadastro</h2>
            </section>
        </main>
    );
}