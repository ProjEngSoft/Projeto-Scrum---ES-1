"use server"

export async function validarLogin(dados) {

    const email = dados.get("email");
    const senha = dados.get("senha");

    // Aqui Será implmentado o READ para verificar se esses dados existem no banco de dados
    // retornando "true" caso existam e "false" caso não existam

}