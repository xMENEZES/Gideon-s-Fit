import type { JWK } from "@supabase/supabase-js";

// Chave PÚBLICA de verificação do login (JWKS) do projeto Supabase, a mesma que o endereço
// /auth/v1/.well-known/jwks.json publica. Passá-la a getClaims() poupa uma ida ao Supabase em toda
// requisição (o cache interno é por cliente, e o app cria um cliente novo a cada requisição).
// Se o Supabase girar a chave de assinatura, os logins novos trazem outro "kid": a chave não é
// encontrada aqui e a biblioteca busca a lista nova online sozinha, então nada quebra. Para
// atualizar este arquivo depois de uma rotação, copie o conteúdo do endereço acima.
export const SUPABASE_JWKS: { keys: JWK[] } = {
  "keys": [
    {
      "kty": "EC",
      "crv": "P-256",
      "x": "yh_1bwYGx7MXiXRaRjlYNTq7FZse-Q6QLXDhfWeCzwA",
      "y": "AoIzl1wMaz1xy8bR8LUTpcsIdl4yik44BbvUBlwGtd4",
      "alg": "ES256",
      "kid": "350b9199-887d-49f9-a8e0-b927358e8e1f",
      "use": "sig",
      "key_ops": [
        "verify"
      ],
      "ext": true
    }
  ]
};
