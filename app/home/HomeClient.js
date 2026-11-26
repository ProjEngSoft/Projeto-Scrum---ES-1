"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  alterarSenhaAction,
  atualizarDadosContaAction,
  encerrarSessaoAction,
  excluirContaAction,
} from "../actions/usuarioActions";

const ROTULOS_PERFIL = {
  CLIENTE: "Cliente",
  PROFISSIONAL: "Profissional",
  AMBOS: "Cliente e Profissional",
  ADMIN: "Administrador",
};

const ROTULOS_STATUS = {
  ATIVO: "Ativa",
  BLOQUEADO: "Bloqueada",
  EXCLUIDO: "Excluída",
};

function obterIniciais(nome) {
  if (!nome) return "U";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function formatarCpf(cpf) {
  if (!cpf) return "";
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarCnpj(cnpj) {
  if (!cnpj) return "";
  const digitos = cnpj.replace(/\D/g, "");
  if (digitos.length !== 14) return cnpj;
  return digitos.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

function aplicarMascaraCpf(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarData(iso) {
  if (!iso) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export default function HomeClient({ usuarioInicial }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(usuarioInicial);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuarioInicial.nome || "");
  const [email, setEmail] = useState(usuarioInicial.email || "");
  const [telefone, setTelefone] = useState(usuarioInicial.telefone || "");
  const [cpf, setCpf] = useState(formatarCpf(usuarioInicial.cliente?.cpf || ""));
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroDados, setErroDados] = useState("");
  const [sucessoDados, setSucessoDados] = useState("");

  const [alterandoSenhaAberto, setAlterandoSenhaAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [sucessoSenha, setSucessoSenha] = useState("");

  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [confirmouExclusao, setConfirmouExclusao] = useState(false);
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  useEffect(() => {
    if (!modalExclusaoAberto) return;

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape" && !excluindoConta) {
        setModalExclusaoAberto(false);
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [modalExclusaoAberto, excluindoConta]);

  function iniciarEdicao() {
    setNome(usuario.nome || "");
    setEmail(usuario.email || "");
    setTelefone(usuario.telefone || "");
    setCpf(formatarCpf(usuario.cliente?.cpf || ""));
    setErroDados("");
    setSucessoDados("");
    setEditando(true);
  }

  function cancelarEdicao() {
    setEditando(false);
    setErroDados("");
  }

  async function salvarDados(evento) {
    evento.preventDefault();
    setErroDados("");
    setSucessoDados("");
    setSalvandoDados(true);

    try {
      const dados = new FormData(evento.currentTarget);
      const resultado = await atualizarDadosContaAction(dados);

      if (resultado?.sessaoExpirada) {
        router.push("/");
        router.refresh();
        return;
      }

      if (resultado?.ok && resultado.usuario) {
        setUsuario(resultado.usuario);
        setEditando(false);
        setSucessoDados("Dados atualizados com sucesso!");
        router.refresh();
      } else {
        setErroDados(resultado?.erro || "Não foi possível atualizar seus dados.");
      }
    } finally {
      setSalvandoDados(false);
    }
  }

  function abrirAlteracaoSenha() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroSenha("");
    setSucessoSenha("");
    setAlterandoSenhaAberto(true);
  }

  function cancelarAlteracaoSenha() {
    setAlterandoSenhaAberto(false);
    setErroSenha("");
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
  }

  async function salvarNovaSenha(evento) {
    evento.preventDefault();
    setErroSenha("");
    setSucessoSenha("");
    setSalvandoSenha(true);

    try {
      const dados = new FormData(evento.currentTarget);
      const resultado = await alterarSenhaAction(dados);

      if (resultado?.sessaoExpirada) {
        router.push("/");
        router.refresh();
        return;
      }

      if (resultado?.ok) {
        setAlterandoSenhaAberto(false);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarNovaSenha("");
        setSucessoSenha("Senha alterada com sucesso!");
      } else {
        setErroSenha(resultado?.erro || "Não foi possível alterar a senha.");
      }
    } finally {
      setSalvandoSenha(false);
    }
  }

  function abrirModalExclusao() {
    setSenhaExclusao("");
    setConfirmouExclusao(false);
    setErroExclusao("");
    setModalExclusaoAberto(true);
  }

  function fecharModalExclusao() {
    if (excluindoConta) return;
    setModalExclusaoAberto(false);
    setErroExclusao("");
  }

  async function confirmarExclusaoConta(evento) {
    evento.preventDefault();
    setErroExclusao("");
    setExcluindoConta(true);

    try {
      const dados = new FormData(evento.currentTarget);
      const resultado = await excluirContaAction(dados);

      if (resultado?.ok || resultado?.sessaoExpirada) {
        router.push("/");
        router.refresh();
        return;
      }

      setErroExclusao(
        resultado?.erro || "Não foi possível excluir sua conta no momento."
      );
    } finally {
      setExcluindoConta(false);
    }
  }

  const iniciais = obterIniciais(usuario.nome);
  const rotuloPerfil = ROTULOS_PERFIL[usuario.perfil] || usuario.perfil;
  const rotuloStatus = ROTULOS_STATUS[usuario.status] || usuario.status;

  return (
    <div className="pagina-home">
      <header className="home-topo">
        <div className="home-topo-conteudo">
          <Link href="/home" className="home-marca">
            <span className="home-marca-icone" aria-hidden="true">
              +
            </span>
            ConsertAí
          </Link>

          <div className="home-topo-acoes">
            <div className="home-usuario-pill" title={usuario.email}>
              <span className="home-avatar-pequeno" aria-hidden="true">
                {iniciais}
              </span>
              <span>{usuario.nome}</span>
            </div>

            <form action={encerrarSessaoAction}>
              <button type="submit" className="botao-sair">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="home-conteudo">
        <section className="home-banner" aria-label="Resumo da conta">
          <div className="home-banner-identidade">
            <div className="home-avatar-grande" aria-hidden="true">
              {iniciais}
            </div>

            <div>
              <span className="home-etiqueta">MINHA CONTA</span>
              <h1>Olá, {usuario.nome}!</h1>
              <p className="home-banner-subtitulo">
                {usuario.email} · Membro desde {formatarData(usuario.criadoEm)}
              </p>
            </div>
          </div>

          <div className="home-badges">
            <span className="home-badge">{rotuloPerfil}</span>
            <span className="home-badge home-badge-status">
              Conta {rotuloStatus}
            </span>
          </div>
        </section>

        <div className="home-grade">
          <section className="home-cartao" aria-labelledby="titulo-dados-conta">
            <div className="home-cartao-cabecalho">
              <div>
                <h2 id="titulo-dados-conta">Dados da Conta</h2>
                <p>
                  Consulte e mantenha suas informações pessoais sempre
                  atualizadas.
                </p>
              </div>

              {!editando && (
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={iniciarEdicao}
                >
                  Editar dados
                </button>
              )}
            </div>

            {sucessoDados && (
              <p className="alerta-sucesso" role="status">
                {sucessoDados}
              </p>
            )}

            {erroDados && (
              <p className="alerta-erro" role="alert">
                {erroDados}
              </p>
            )}

            {!editando ? (
              <dl className="home-lista-dados">
                <div className="home-dado-item">
                  <dt>Nome completo</dt>
                  <dd>{usuario.nome}</dd>
                </div>

                <div className="home-dado-item">
                  <dt>E-mail</dt>
                  <dd>{usuario.email}</dd>
                </div>

                <div className="home-dado-item">
                  <dt>Telefone</dt>
                  <dd>
                    {usuario.telefone ? (
                      usuario.telefone
                    ) : (
                      <span className="home-dado-vazio">Não informado</span>
                    )}
                  </dd>
                </div>

                {usuario.cliente && (
                  <div className="home-dado-item">
                    <dt>CPF</dt>
                    <dd>
                      {usuario.cliente.cpf ? (
                        formatarCpf(usuario.cliente.cpf)
                      ) : (
                        <span className="home-dado-vazio">Não informado</span>
                      )}
                    </dd>
                  </div>
                )}

                <div className="home-dado-item">
                  <dt>Perfil</dt>
                  <dd>{rotuloPerfil}</dd>
                </div>

                <div className="home-dado-item">
                  <dt>Situação da conta</dt>
                  <dd>{rotuloStatus}</dd>
                </div>

                <div className="home-dado-item">
                  <dt>Cadastrado em</dt>
                  <dd>{formatarData(usuario.criadoEm)}</dd>
                </div>

                <div className="home-dado-item">
                  <dt>Última atualização</dt>
                  <dd>{formatarData(usuario.atualizadoEm)}</dd>
                </div>
              </dl>
            ) : (
              <form onSubmit={salvarDados} className="home-formulario">
                <div className="home-campo">
                  <label htmlFor="editar-nome">Nome completo</label>
                  <input
                    id="editar-nome"
                    name="nome"
                    type="text"
                    minLength={3}
                    maxLength={150}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="home-campo">
                  <label htmlFor="editar-email">E-mail</label>
                  <input
                    id="editar-email"
                    name="email"
                    type="email"
                    maxLength={150}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="home-campos-duplos">
                  <div className="home-campo">
                    <label htmlFor="editar-telefone">Telefone (opcional)</label>
                    <input
                      id="editar-telefone"
                      name="telefone"
                      type="tel"
                      maxLength={20}
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>

                  {usuario.cliente && (
                    <div className="home-campo">
                      <label htmlFor="editar-cpf">CPF (opcional)</label>
                      <input
                        id="editar-cpf"
                        name="cpf"
                        type="text"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) =>
                          setCpf(aplicarMascaraCpf(e.target.value))
                        }
                      />
                      <span className="home-dica">
                        Informe os 11 dígitos ou deixe em branco para remover.
                      </span>
                    </div>
                  )}
                </div>

                <div className="home-acoes-form">
                  <button
                    type="submit"
                    className="botao-primario"
                    disabled={salvandoDados}
                  >
                    {salvandoDados ? "Salvando..." : "Salvar alterações"}
                  </button>
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={cancelarEdicao}
                    disabled={salvandoDados}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {usuario.profissional && (
              <div className="home-secao-profissional">
                <h3>Perfil Profissional</h3>
                <dl className="home-lista-dados">
                  <div className="home-dado-item">
                    <dt>Tipo de cadastro</dt>
                    <dd>
                      {usuario.profissional.tipoPessoa === "PJ"
                        ? "Pessoa Jurídica (CNPJ)"
                        : "Pessoa Física (CPF)"}
                    </dd>
                  </div>

                  <div className="home-dado-item">
                    <dt>
                      {usuario.profissional.tipoPessoa === "PJ"
                        ? "CNPJ"
                        : "CPF Profissional"}
                    </dt>
                    <dd>
                      {usuario.profissional.tipoPessoa === "PJ"
                        ? formatarCnpj(usuario.profissional.cnpj)
                        : formatarCpf(usuario.profissional.cpf)}
                    </dd>
                  </div>

                  <div className="home-dado-item">
                    <dt>Cidade / UF</dt>
                    <dd>
                      {usuario.profissional.cidade ? (
                        `${usuario.profissional.cidade}${
                          usuario.profissional.uf
                            ? ` - ${usuario.profissional.uf}`
                            : ""
                        }`
                      ) : (
                        <span className="home-dado-vazio">Não informado</span>
                      )}
                    </dd>
                  </div>

                  <div className="home-dado-item">
                    <dt>Status profissional</dt>
                    <dd>
                      {usuario.profissional.ativo ? "Ativo" : "Inativo"}
                    </dd>
                  </div>

                  {usuario.profissional.regiaoAtendimento && (
                    <div className="home-dado-item">
                      <dt>Região de atendimento</dt>
                      <dd>{usuario.profissional.regiaoAtendimento}</dd>
                    </div>
                  )}

                  {usuario.profissional.horarioAtendimento && (
                    <div className="home-dado-item">
                      <dt>Horário de atendimento</dt>
                      <dd>{usuario.profissional.horarioAtendimento}</dd>
                    </div>
                  )}

                  {usuario.profissional.descricao && (
                    <div className="home-dado-item">
                      <dt>Descrição dos serviços</dt>
                      <dd>{usuario.profissional.descricao}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </section>

          <div className="home-coluna-lateral">
            <section className="home-cartao" aria-labelledby="titulo-seguranca">
              <div className="home-cartao-cabecalho">
                <div>
                  <h2 id="titulo-seguranca">Segurança da Conta</h2>
                  <p>Atualize sua senha de acesso regularmente.</p>
                </div>

                {!alterandoSenhaAberto && (
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={abrirAlteracaoSenha}
                  >
                    Alterar senha
                  </button>
                )}
              </div>

              {sucessoSenha && (
                <p className="alerta-sucesso" role="status">
                  {sucessoSenha}
                </p>
              )}

              {erroSenha && (
                <p className="alerta-erro" role="alert">
                  {erroSenha}
                </p>
              )}

              {alterandoSenhaAberto && (
                <form onSubmit={salvarNovaSenha} className="home-formulario">
                  <div className="home-campo">
                    <label htmlFor="senha-atual">Senha atual</label>
                    <input
                      id="senha-atual"
                      name="senhaAtual"
                      type="password"
                      autoComplete="current-password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      required
                    />
                  </div>

                  <div className="home-campo">
                    <label htmlFor="nova-senha">Nova senha</label>
                    <input
                      id="nova-senha"
                      name="novaSenha"
                      type="password"
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="Mínimo de 8 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                    />
                  </div>

                  <div className="home-campo">
                    <label htmlFor="confirmar-nova-senha">
                      Confirmar nova senha
                    </label>
                    <input
                      id="confirmar-nova-senha"
                      name="confirmarNovaSenha"
                      type="password"
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      required
                    />
                  </div>

                  <div className="home-acoes-form">
                    <button
                      type="submit"
                      className="botao-primario"
                      disabled={salvandoSenha}
                    >
                      {salvandoSenha ? "Atualizando..." : "Atualizar senha"}
                    </button>
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={cancelarAlteracaoSenha}
                      disabled={salvandoSenha}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section
              className="home-cartao home-cartao-perigo"
              aria-labelledby="titulo-exclusao"
            >
              <div className="home-cartao-cabecalho">
                <div>
                  <h2 id="titulo-exclusao">Zona de Perigo</h2>
                  <p>Exclusão definitiva de acesso à conta.</p>
                </div>
              </div>

              <p className="home-texto-perigo">
                Ao excluir sua conta, todas as sessões ativas serão encerradas,
                seus dados pessoais de contato serão anonimizados conforme a
                LGPD e você não poderá mais acessar a plataforma com este
                cadastro.
              </p>

              <button
                type="button"
                className="botao-perigo"
                onClick={abrirModalExclusao}
              >
                Excluir minha conta
              </button>
            </section>
          </div>
        </div>
      </main>

      {modalExclusaoAberto && (
        <div
          className="home-modal-fundo"
          onClick={(e) => {
            if (e.target === e.currentTarget) fecharModalExclusao();
          }}
        >
          <div
            className="home-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-exclusao"
          >
            <h3 id="titulo-modal-exclusao">Confirmar exclusão da conta</h3>
            <p className="home-modal-descricao">
              Esta ação encerrará sua conta permanentemente e revogará seu
              acesso. Para confirmar, digite sua senha atual.
            </p>

            {erroExclusao && (
              <p className="alerta-erro" role="alert">
                {erroExclusao}
              </p>
            )}

            <form onSubmit={confirmarExclusaoConta} className="home-formulario">
              <div className="home-campo">
                <label htmlFor="senha-exclusao">Senha atual</label>
                <input
                  id="senha-exclusao"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha para confirmar"
                  value={senhaExclusao}
                  onChange={(e) => setSenhaExclusao(e.target.value)}
                  required
                />
              </div>

              <label className="home-checkbox">
                <input
                  type="checkbox"
                  checked={confirmouExclusao}
                  onChange={(e) => setConfirmouExclusao(e.target.checked)}
                />
                <span>
                  Entendo que a exclusão da conta é permanente e não poderá ser
                  desfeita.
                </span>
              </label>

              <div className="home-acoes-form">
                <button
                  type="submit"
                  className="botao-perigo"
                  disabled={
                    excluindoConta ||
                    !confirmouExclusao ||
                    !senhaExclusao.trim()
                  }
                >
                  {excluindoConta ? "Excluindo..." : "Confirmar exclusão"}
                </button>
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={fecharModalExclusao}
                  disabled={excluindoConta}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
