// Portão de entrada: login com Google + verificação em duas etapas por app autenticador (TOTP).
// Fluxo baseado na documentação oficial:
//   https://firebase.google.com/docs/auth/web/totp-mfa
//   https://firebase.google.com/docs/auth/web/multi-factor
// Só entra quem estiver na lista da equipe (coleção "equipe" no Firestore, documento = e-mail).
import { useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  getMultiFactorResolver,
  multiFactor,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'qrcode';
import { auth, db, firebaseConfigurado } from '../lib/firebase';

export interface MembroEquipe {
  email: string;
  nome: string;
  perfil: string;
}

type Estado =
  | { tela: 'carregando' }
  | { tela: 'login'; aviso?: string }
  | { tela: 'codigo'; resolver: MultiFactorResolver }
  | { tela: 'cadastrar-app'; user: User }
  | { tela: 'dentro'; membro: MembroEquipe };

const NOME_APP = 'Ateliê Cecília Amorim';

function mensagemErro(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'A janela do Google foi fechada antes de concluir.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.';
    case 'auth/invalid-verification-code':
    case 'auth/totp-challenge-timeout':
      return 'Código inválido ou vencido. Confira o app autenticador e digite o código atual.';
    case 'auth/requires-recent-login':
      return 'Por segurança, entre de novo para concluir.';
    case 'auth/unauthorized-domain':
      return 'Este endereço do site ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados).';
    case 'auth/operation-not-allowed':
      return 'Este método de login ou a verificação por app autenticador ainda não foi ativado no Firebase.';
    default:
      return 'Não foi possível concluir. Tente de novo.' + (code ? ` (${code})` : '');
  }
}

/** Confere se o e-mail está na lista da equipe e ativo. */
async function buscarMembro(user: User): Promise<MembroEquipe | null> {
  const email = (user.email ?? '').toLowerCase();
  if (!email || !user.emailVerified) return null;
  try {
    const snap = await getDoc(doc(db(), 'equipe', email));
    if (!snap.exists() || snap.data().ativo !== true) return null;
    const d = snap.data();
    return { email, nome: String(d.nome ?? user.displayName ?? email), perfil: String(d.perfil ?? '') };
  } catch {
    // As regras negam a leitura para quem não está na lista.
    return null;
  }
}

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10 text-sand-950">
      <div className="w-full max-w-sm rounded-2xl border border-sand-200 bg-paper p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border-[1.5px] border-terra-400 font-display font-bold text-terra-500">
            A
          </div>
          <div>
            <div className="font-display text-base font-semibold">{NOME_APP}</div>
            <div className="label-mono text-sand-500">Acesso da equipe</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Aviso({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="alert" className="mt-3 rounded-lg bg-terra-50 px-3 py-2 text-sm text-terra-800">
      {texto}
    </p>
  );
}

const botao =
  'w-full rounded-lg bg-sand-950 px-4 py-2.5 text-sm font-medium text-cream transition hover:bg-sand-800 disabled:opacity-50';
const campo =
  'w-full rounded-lg border border-sand-300 bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-terra-400';

function CampoCodigo({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <input
      className={campo}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      aria-label="Código de 6 dígitos"
      value={valor}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      autoFocus
    />
  );
}

function TelaLogin({ aviso, onCodigo }: { aviso?: string; onCodigo: (r: MultiFactorResolver) => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | undefined>(aviso);

  async function entrar() {
    setOcupado(true);
    setErro(undefined);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth(), provider);
      // Sem segunda etapa cadastrada: o observador de login cuida do resto.
    } catch (e) {
      if ((e as { code?: string })?.code === 'auth/multi-factor-auth-required') {
        onCodigo(getMultiFactorResolver(auth(), e as MultiFactorError));
      } else {
        setErro(mensagemErro(e));
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Moldura>
      <p className="mb-4 text-sm text-sand-700">
        Entre com a sua conta Google da equipe. Em seguida, será pedido o código do app autenticador.
      </p>
      <button className={botao} onClick={entrar} disabled={ocupado}>
        {ocupado ? 'Abrindo o Google…' : 'Entrar com Google'}
      </button>
      <Aviso texto={erro} />
    </Moldura>
  );
}

function TelaCodigo({ resolver, onVoltar }: { resolver: MultiFactorResolver; onVoltar: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();
  const dica = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);

  async function confirmar() {
    if (!dica) return;
    setOcupado(true);
    setErro(undefined);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(dica.uid, codigo);
      await resolver.resolveSignIn(assertion);
    } catch (e) {
      setErro(mensagemErro(e));
      setOcupado(false);
    }
  }

  return (
    <Moldura>
      {dica ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirmar();
          }}
        >
          <p className="mb-4 text-sm text-sand-700">
            Abra o app autenticador no celular e digite o código de 6 dígitos de <strong>{NOME_APP}</strong>.
          </p>
          <CampoCodigo valor={codigo} onChange={setCodigo} />
          <button type="submit" className={`${botao} mt-3`} disabled={ocupado || codigo.length !== 6}>
            {ocupado ? 'Conferindo…' : 'Confirmar'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-sand-700">
          A sua conta tem uma segunda etapa diferente da esperada. Peça ajuda ao Administrador.
        </p>
      )}
      <Aviso texto={erro} />
      <button className="mt-3 w-full text-sm text-sand-600 underline" onClick={onVoltar}>
        Voltar
      </button>
    </Moldura>
  );
}

function TelaCadastrarApp({ user, onConcluido }: { user: User; onConcluido: () => void }) {
  const [segredo, setSegredo] = useState<TotpSecret | null>(null);
  const [qr, setQr] = useState<string>();
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const sessao = await multiFactor(user).getSession();
        const s = await TotpMultiFactorGenerator.generateSecret(sessao);
        if (!ativo) return;
        setSegredo(s);
        setQr(await QRCode.toDataURL(s.generateQrCodeUrl(user.email ?? undefined, NOME_APP), { margin: 1, width: 200 }));
      } catch (e) {
        if (ativo) setErro(mensagemErro(e));
      }
    })();
    return () => {
      ativo = false;
    };
  }, [user]);

  async function confirmar() {
    if (!segredo) return;
    setOcupado(true);
    setErro(undefined);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(segredo, codigo);
      await multiFactor(user).enroll(assertion, 'App autenticador');
      onConcluido();
    } catch (e) {
      setErro(mensagemErro(e));
      setOcupado(false);
    }
  }

  return (
    <Moldura>
      <p className="mb-3 text-sm text-sand-700">
        Primeiro acesso: cadastre a verificação em duas etapas. Instale um app autenticador no celular (por exemplo,
        Google Authenticator) e leia o código abaixo.
      </p>
      {qr ? (
        <img src={qr} alt="QR code para o app autenticador" className="mx-auto mb-2 h-[200px] w-[200px]" />
      ) : (
        !erro && <p className="mb-2 text-center text-sm text-sand-500">Gerando o código…</p>
      )}
      {segredo && (
        <p className="mb-4 break-all text-center text-xs text-sand-600">
          Sem câmera? Digite esta chave no app:
          <br />
          <span className="font-mono text-sand-900">{segredo.secretKey}</span>
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void confirmar();
        }}
      >
        <CampoCodigo valor={codigo} onChange={setCodigo} />
        <button type="submit" className={`${botao} mt-3`} disabled={!segredo || ocupado || codigo.length !== 6}>
          {ocupado ? 'Cadastrando…' : 'Confirmar código'}
        </button>
      </form>
      <Aviso texto={erro} />
      <button className="mt-3 w-full text-sm text-sand-600 underline" onClick={() => void signOut(auth())}>
        Sair
      </button>
    </Moldura>
  );
}

function ModoDemonstracao({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-terra-700 px-4 py-1.5 text-center text-xs text-cream">
        Modo demonstração: login desativado porque o Firebase ainda não foi configurado neste site.
      </div>
      {children}
    </>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(firebaseConfigurado ? { tela: 'carregando' } : { tela: 'login' });

  useEffect(() => {
    if (!firebaseConfigurado) return;
    return onAuthStateChanged(auth(), async (user) => {
      if (!user) {
        setEstado((atual) =>
          atual.tela === 'codigo' || (atual.tela === 'login' && atual.aviso) ? atual : { tela: 'login' },
        );
        return;
      }
      setEstado({ tela: 'carregando' });
      const membro = await buscarMembro(user);
      if (!membro) {
        await signOut(auth());
        setEstado({
          tela: 'login',
          aviso: `A conta ${user.email ?? ''} não está liberada para a equipe. Peça acesso ao Administrador.`,
        });
        return;
      }
      if (multiFactor(user).enrolledFactors.length === 0) {
        setEstado({ tela: 'cadastrar-app', user });
        return;
      }
      setEstado({ tela: 'dentro', membro });
    });
  }, []);

  if (!firebaseConfigurado) return <ModoDemonstracao>{children}</ModoDemonstracao>;

  switch (estado.tela) {
    case 'carregando':
      return (
        <Moldura>
          <p className="text-sm text-sand-600">Carregando…</p>
        </Moldura>
      );
    case 'login':
      return (
        <TelaLogin
          key={estado.aviso ?? ''}
          aviso={estado.aviso}
          onCodigo={(resolver) => setEstado({ tela: 'codigo', resolver })}
        />
      );
    case 'codigo':
      return <TelaCodigo resolver={estado.resolver} onVoltar={() => setEstado({ tela: 'login' })} />;
    case 'cadastrar-app':
      return (
        <TelaCadastrarApp
          user={estado.user}
          onConcluido={async () => {
            // Sai e pede login de novo, já com o código: confirma que a segunda etapa funciona.
            await signOut(auth());
            setEstado({ tela: 'login', aviso: 'App autenticador cadastrado. Entre de novo e use o código.' });
          }}
        />
      );
    case 'dentro':
      return (
        <>
          {children}
          <button
            onClick={() => void signOut(auth())}
            title={`${estado.membro.nome} · ${estado.membro.email}`}
            className="fixed right-3 top-3 z-50 rounded-full border border-sand-300 bg-paper/90 px-3 py-1 text-xs text-sand-700 shadow-sm backdrop-blur hover:bg-sand-100"
          >
            Sair · {estado.membro.nome.split(' ')[0]}
          </button>
        </>
      );
  }
}
