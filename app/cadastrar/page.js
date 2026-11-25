"use client";

import {useState} from 'react';
import styles from './cadastro.module.css';

export default function cadastroPage(){

    const [tipoUsuario, setTipoUsuario] = useState('cliente');

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
                        <button
                          type="button"
                          className={tipoUsuario === 'cliente' ? styles.selecionado : ''}
                          onClick={() => setTipoUsuario('cliente')}
                        >
                            Cliente
                        </button>

                        <button 
                          type="button"
                          className={tipoUsuario === 'funcionario' ? styles.selecionado : ''}
                          onClick={() => setTipoUsuario('funcionario')}
                        >
                            Funcionario
                        </button>
                    </div>
                </section>


                <section className={styles.formulario}>
                    <h2>Dados do cadastro</h2>

                    <div className={styles.campos}>

                        <div className={styles.campo}>
                            <label>Nome completo</label>
                            <input type='text' placeholder='Digite seu nome completo' />
                        </div>

                        <div className={styles.campo}>
                            <label>E-mail</label>
                            <input type='text' placeholder='Digite seu e-mail' />
                        </div>

                        {tipoUsuario === 'cliente' ? (
                            <div className={styles.campo}>
                                <label>CPF</label>
                                <input type='text' placeholder='Digite seu CPF' />
                            </div>
                            ):(
                              <>
                                <div className={styles.campo}>
                                    <label>CNPJ</label>
                                    <input type='text' placeholder='Digite seu CNPJ' />
                                </div>

                                <div className={styles.campo}>
                                    <label>Serviço oferecido</label>
                                    <input type='text' placeholder='Ex: Manutenção de computadores' />
                                </div>

                                <div className={styles.campo}>
                                    <label>Descrição do serviço</label>
                                    <input type='text' placeholder='Descreva o serviço que você oferece...' />
                                </div>

                              </>
                            )
                        }

                        <div className={styles.campo}>
                            <label>Senha</label>
                            <input type='password' placeholder='Digite sua senha' />
                        </div>

                        <div className={styles.campo}>
                            <label>Confirmar senha</label>
                            <input type='password' placeholder='Confirme sua senha' />
                        </div>  

                    </div>
                </section>
                <p>Voltar para <a href='./'>tela inicial</a></p>
            </div>
        </main>
    );
}