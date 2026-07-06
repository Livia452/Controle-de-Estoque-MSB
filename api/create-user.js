// Função serverless da Vercel — cria um usuário novo no Supabase Auth.
// Só quem já é admin (checado via RLS com o próprio token de quem chamou) pode
// usar essa rota. A chave secreta (service_role) só existe aqui, no servidor —
// nunca no código que roda no navegador.

const SUPABASE_URL             = 'https://hytvtwtiekznvjhngtwl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_8KRMNDDdFiJwUWxK0QtazQ_i0l_ADvx';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!callerToken) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  try {
    // 1. Quem está chamando?
    const meResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${callerToken}` },
    });
    if (!meResp.ok) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
    const me = await meResp.json();

    // 2. Quem está chamando é admin? (RLS deixa cada um ler o próprio profile)
    const profResp = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${me.id}&select=role`,
      { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${callerToken}` } }
    );
    const profRows = profResp.ok ? await profResp.json() : [];
    if (profRows[0]?.role !== 'admin') {
      res.status(403).json({ error: 'Só administradores podem criar usuários.' });
      return;
    }

    // 3. Dados do usuário novo
    const { email, password, role } = req.body || {};
    if (!email || !password || password.length < 6) {
      res.status(400).json({ error: 'E-mail e senha (mín. 6 caracteres) são obrigatórios.' });
      return;
    }
    const finalRole = role === 'admin' ? 'admin' : 'user';

    // 4. Cria o usuário no Auth (precisa da chave secreta)
    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const created = await createResp.json();
    if (!createResp.ok) {
      res.status(createResp.status).json({ error: created?.msg || created?.error_description || 'Falha ao criar usuário.' });
      return;
    }

    // 5. Grava o papel (profiles) — também precisa da chave secreta, RLS bloqueia clientes
    const profileResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ id: created.id, email, role: finalRole }),
    });
    if (!profileResp.ok) {
      const err = await profileResp.text();
      res.status(500).json({ error: 'Usuário criado, mas falhou ao gravar o papel: ' + err });
      return;
    }

    res.status(200).json({ ok: true, id: created.id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro inesperado.' });
  }
};
