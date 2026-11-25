"use client";

import styles from './cadastro.module.css'

export default function cadastroPage(){
    return(
        <main className={styles.container}>

            <div className={styles.card}>

                <header className={styles.cabecalho}>
                    <h1>Criar cadastro</h1>
                    <p>Preencha seus dados para continuar...</p>
                </header>

                <section className={styles.tipoCadastro}>
                    <h2>Qual cadastro deseja realizar?</h2>

                    <div className={styles.opcoes}>
                        <button>
                            Cliente
                        </button>
                        <button type="button">
                            Funcionario
                        </button>
                    </div>
                </section>

                <section className={styles.formulario}>
                    <h2>Dados do cadastro</h2>
                </section>
                <p>Voltar para <a href='./'>tela inicial</a></p>
            </div>
        </main>
    );
}